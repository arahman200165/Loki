# Manual QA Checklists

One file per sprint. Created after the sprint is implemented, using the `manual-qa` Claude skill.

## Convention

- Filename: `sprint-<N>-qa.md`
- Covers: happy path, constraint checks, privacy checks, retention defaults, and cleanup steps
- Uses only commands and SQL that work today — no invented test runners

## Files

| Sprint | File | Status |
|---|---|---|
| 1 — DB schema & shared types | [sprint-1-qa.md](sprint-1-qa.md) | Ready |

## Why these exist

There is no automated test suite in the Loki MVP. These checklists are the structured verification record for each sprint. If you complete a sprint without running the checklist, the sprint is not done.

## For Claude

After implementing any sprint, run the `manual-qa` skill and save the output here as `sprint-<N>-qa.md`. This is step 7 of the Default Workflow in `.claude/CLAUDE.md`.
