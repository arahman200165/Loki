#!/bin/bash
input=$(cat)

cwd=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // empty')
model=$(echo "$input" | jq -r '.model.display_name // empty')
used=$(echo "$input" | jq -r '.context_window.used_percentage // empty')

branch=""
if [ -n "$cwd" ]; then
  branch=$(git -C "$cwd" --no-optional-locks symbolic-ref --short HEAD 2>/dev/null)
fi

parts=()

if [ -n "$cwd" ]; then
  parts+=("$cwd")
fi

if [ -n "$branch" ]; then
  parts+=("$branch")
fi

if [ -n "$model" ]; then
  parts+=("$model")
fi

if [ -n "$used" ]; then
  used_rounded=$(printf "%.0f" "$used")
  parts+=("ctx: ${used_rounded}%")
fi

output=""
for i in "${!parts[@]}"; do
  if [ $i -eq 0 ]; then
    output="${parts[$i]}"
  else
    output="${output} | ${parts[$i]}"
  fi
done

echo "$output"
