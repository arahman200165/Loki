#Requires -Version 5.1
# Claude Code Status Line - PowerShell
# Receives JSON via stdin, outputs a single ANSI-colored status line.

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# ── ANSI helpers ──────────────────────────────────────────────────────────────
function ansi($code, $text) { return "`e[${code}m${text}`e[0m" }

# Foreground colors (256-color)
function fg($n, $t)  { return "`e[38;5;${n}m${t}`e[0m" }
# Dim/subtle version
function fgd($n, $t) { return "`e[2;38;5;${n}m${t}`e[0m" }

# Named palette (tuned for dark terminals, degrades on light)
$C = @{
    Reset   = "`e[0m"
    Sep     = "`e[38;5;240m"          # dark grey separator
    Dir     = "`e[38;5;75m"           # sky blue  — directory
    Branch  = "`e[38;5;214m"          # amber     — git branch
    Clean   = "`e[38;5;83m"           # green     — clean repo
    Dirty   = "`e[38;5;203m"          # red-orange — dirty repo
    Ahead   = "`e[38;5;83m"           # green
    Behind  = "`e[38;5;203m"          # red
    Model   = "`e[38;5;141m"          # lavender  — model name
    Ctx     = "`e[38;5;180m"          # tan       — context usage
    CtxHigh = "`e[38;5;203m"          # red       — context > 80 %
    Time    = "`e[38;5;246m"          # grey      — time
    User    = "`e[38;5;109m"          # steel blue — user/workspace
    Rate    = "`e[38;5;203m"          # red       — rate limits
    Version = "`e[38;5;240m"          # very dark — version
    Effort  = "`e[38;5;220m"          # gold      — effort level
    Vim     = "`e[38;5;208m"          # orange    — vim mode
}

$SEP  = "$($C.Sep)|$($C.Reset)"       # dim pipe separator
$DASH = "$($C.Sep)-$($C.Reset)"

# ── Read + parse JSON from stdin ──────────────────────────────────────────────
$raw = [Console]::In.ReadToEnd()
if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }

try   { $j = $raw | ConvertFrom-Json }
catch { exit 0 }

# ── Helper: safe property access ──────────────────────────────────────────────
function prop($obj, [string]$path) {
    $parts = $path -split '\.'
    $cur = $obj
    foreach ($p in $parts) {
        if ($null -eq $cur) { return $null }
        try { $cur = $cur.$p } catch { return $null }
    }
    return $cur
}

# ── 1. DIRECTORY (shortened) ──────────────────────────────────────────────────
$cwd = prop $j 'workspace.current_dir'
if (-not $cwd) { $cwd = prop $j 'cwd' }

function shorten-path([string]$p) {
    if (-not $p) { return '' }
    # Replace home dir with ~
    $home2 = [Environment]::GetFolderPath('UserProfile')
    if ($p.StartsWith($home2)) { $p = '~' + $p.Substring($home2.Length) }
    # Normalize slashes
    $p = $p -replace '\\', '/'
    $parts = $p -split '/'
    if ($parts.Count -le 4) { return $p }
    # Keep first 1 + last 2 segments, abbreviate middle
    $first = $parts[0..1] -join '/'
    $last  = $parts[-2..-1] -join '/'
    return "$first/..$last"
}

$dirStr = ''
if ($cwd) {
    $short = shorten-path $cwd
    $dirStr = "$($C.Dir)$short$($C.Reset)"
}

# ── 2. GIT STATUS ─────────────────────────────────────────────────────────────
$gitStr = ''
$isGitRepo = $false
if ($cwd) {
    if (Test-Path "$cwd\.git" -ErrorAction SilentlyContinue) {
        $isGitRepo = $true
    } else {
        $gitCheck = & git -C "$cwd" --no-optional-locks rev-parse --is-inside-work-tree 2>$null
        $isGitRepo = ($gitCheck -eq 'true')
    }
}
if ($isGitRepo) {

    $branch = & git -C "$cwd" --no-optional-locks symbolic-ref --short HEAD 2>$null
    if (-not $branch) {
        # Detached HEAD — show short SHA
        $branch = '(' + (& git -C "$cwd" --no-optional-locks rev-parse --short HEAD 2>$null) + ')'
    }

    # Staged / unstaged / untracked counts
    $statusLines = & git -C "$cwd" --no-optional-locks status --porcelain 2>$null
    $staged   = 0
    $unstaged = 0
    $untracked= 0
    foreach ($line in $statusLines) {
        if ($line.Length -lt 2) { continue }
        $x = $line[0]; $y = $line[1]
        if ($x -ne ' ' -and $x -ne '?') { $staged++ }
        if ($y -eq 'M' -or $y -eq 'D')  { $unstaged++ }
        if ($x -eq '?' -and $y -eq '?') { $untracked++ }
    }
    $isDirty = ($staged + $unstaged + $untracked) -gt 0

    # Ahead / behind upstream
    $ahead  = 0
    $behind = 0
    $ab = & git -C "$cwd" --no-optional-locks rev-list --left-right --count '@{upstream}...HEAD' 2>$null
    if ($ab -match '^(\d+)\s+(\d+)$') {
        $behind = [int]$Matches[1]
        $ahead  = [int]$Matches[2]
    }

    # Build git segment
    if ($isDirty) {
        $branchColor = $C.Dirty
        $stateGlyph  = '*'
    } else {
        $branchColor = $C.Clean
        $stateGlyph  = ''
    }

    $gitStr = "${branchColor}${branch}${stateGlyph}$($C.Reset)"

    $details = @()
    if ($staged   -gt 0) { $details += "$($C.Ahead)+${staged}s$($C.Reset)" }
    if ($unstaged -gt 0) { $details += "$($C.Dirty)~${unstaged}u$($C.Reset)" }
    if ($untracked-gt 0) { $details += "$($C.Sep)?${untracked}$($C.Reset)" }
    if ($ahead    -gt 0) { $details += "$($C.Ahead)^${ahead}$($C.Reset)" }
    if ($behind   -gt 0) { $details += "$($C.Behind)v${behind}$($C.Reset)" }

    if ($details.Count -gt 0) {
        $gitStr += " $($C.Sep)[$($C.Reset)" + ($details -join ' ') + "$($C.Sep)]$($C.Reset)"
    }
}

# ── 3. MODEL ──────────────────────────────────────────────────────────────────
$modelStr = ''
$modelName = prop $j 'model.display_name'
if (-not $modelName) { $modelName = prop $j 'model.id' }
if ($modelName) {
    # Abbreviate long model names
    $short = $modelName -replace 'Claude ', '' -replace ' Latest', '' -replace 'claude-', ''
    $modelStr = "$($C.Model)$short$($C.Reset)"
}

# ── 4. CONTEXT WINDOW ─────────────────────────────────────────────────────────
$ctxStr = ''
$usedPct = prop $j 'context_window.used_percentage'
if ($null -ne $usedPct) {
    $pct = [math]::Round([double]$usedPct, 0)
    $color = if ($pct -ge 80) { $C.CtxHigh } else { $C.Ctx }
    # Simple ASCII bar (10 chars)
    $filled = [math]::Round($pct / 10)
    $bar = ('=' * $filled) + ('-' * (10 - $filled))
    $ctxStr = "${color}ctx:${pct}%$($C.Reset) $($C.Sep)[${color}${bar}$($C.Sep)]$($C.Reset)"

    # Also show raw token count if available
    $totalIn = prop $j 'context_window.total_input_tokens'
    $winSize  = prop $j 'context_window.context_window_size'
    if ($totalIn -and $winSize) {
        $usedK = [math]::Round([double]$totalIn / 1000, 0)
        $winK  = [math]::Round([double]$winSize  / 1000, 0)
        $ctxStr += " $($C.Sep)(${usedK}k/${winK}k)$($C.Reset)"
    }
}

# ── 5. EFFORT LEVEL ───────────────────────────────────────────────────────────
$effortStr = ''
$effortLevel = prop $j 'effort.level'
if ($effortLevel) {
    $effortStr = "$($C.Effort)effort:${effortLevel}$($C.Reset)"
}

# ── 6. VIM MODE ───────────────────────────────────────────────────────────────
$vimStr = ''
$vimMode = prop $j 'vim.mode'
if ($vimMode) {
    $vimStr = "$($C.Vim)[${vimMode}]$($C.Reset)"
}

# ── 7. RATE LIMITS ────────────────────────────────────────────────────────────
$rateStr = ''
$fiveHour = prop $j 'rate_limits.five_hour.used_percentage'
$sevenDay = prop $j 'rate_limits.seven_day.used_percentage'
$rateParts = @()
if ($null -ne $fiveHour) {
    $p = [math]::Round([double]$fiveHour, 0)
    $rateParts += "5h:${p}%"
}
if ($null -ne $sevenDay) {
    $p = [math]::Round([double]$sevenDay, 0)
    $rateParts += "7d:${p}%"
}
if ($rateParts.Count -gt 0) {
    $rateStr = "$($C.Rate)" + ($rateParts -join ' ') + "$($C.Reset)"
}

# ── 8. SESSION / WORKSPACE ────────────────────────────────────────────────────
$sessionStr = ''
$sessionName = prop $j 'session_name'
$workspace   = prop $j 'workspace.project_dir'
if ($sessionName) {
    $sessionStr = "$($C.User)[$sessionName]$($C.Reset)"
} elseif ($workspace) {
    $leaf = Split-Path $workspace -Leaf
    $sessionStr = "$($C.User)[$leaf]$($C.Reset)"
}

# ── 9. VERSION ────────────────────────────────────────────────────────────────
$verStr = ''
$ver = prop $j 'version'
if ($ver) {
    $verStr = "$($C.Version)v${ver}$($C.Reset)"
}

# ── 10. OUTPUT STYLE ──────────────────────────────────────────────────────────
$styleStr = ''
$styleName = prop $j 'output_style.name'
if ($styleName -and $styleName -ne 'default') {
    $styleStr = "$($C.Sep)style:$($C.Reset)$($C.User)${styleName}$($C.Reset)"
}

# ── 11. CURRENT TIME ─────────────────────────────────────────────────────────
$timeStr = "$($C.Time)$(Get-Date -Format 'HH:mm:ss')$($C.Reset)"

# ── 12. GIT WORKTREE ─────────────────────────────────────────────────────────
$wtStr = ''
$wtName = prop $j 'workspace.git_worktree'
if (-not $wtName) { $wtName = prop $j 'worktree.name' }
if ($wtName) {
    $wtStr = "$($C.Branch)wt:${wtName}$($C.Reset)"
}

# ── Assemble segments — skip empties ─────────────────────────────────────────
$segments = @()
if ($sessionStr)  { $segments += $sessionStr }
if ($dirStr)      { $segments += $dirStr }
if ($gitStr)      { $segments += $gitStr }
if ($wtStr)       { $segments += $wtStr }
if ($modelStr)    { $segments += $modelStr }
if ($effortStr)   { $segments += $effortStr }
if ($ctxStr)      { $segments += $ctxStr }
if ($rateStr)     { $segments += $rateStr }
if ($vimStr)      { $segments += $vimStr }
if ($styleStr)    { $segments += $styleStr }
if ($verStr)      { $segments += $verStr }
if ($timeStr)     { $segments += $timeStr }

$line = $segments -join " $SEP "
Write-Host $line
