# Backend Rollback Runbook

## Trigger

Use this runbook when production deploy completes but the backend fails health checks or has a severe regression.

## Fast path

1. Identify the bad commit on `main`.
2. Revert it with a new commit using `git revert <sha>`.
3. Merge the revert to `main`.
4. Let the normal CI and deploy workflow promote the revert through staging and then production.

This is the preferred rollback path because it keeps Git history and deployed state aligned.

## Emergency Render rollback

1. Open the Render production service deploy history.
2. Roll back to the last known healthy deploy.
3. Immediately create a follow-up Git revert if `main` still contains the bad commit.
4. Re-run the smoke check against production after rollback.

## Database considerations

- If the app rollback is compatible with the latest schema, stop at the code rollback.
- If a migration introduced an incompatible schema change, recover with a reviewed reverse migration or Neon point-in-time recovery.
- Treat Neon PITR as a last resort because it can discard legitimate newer writes.

## Verification

1. Confirm Render reports the rolled-back deploy as healthy.
2. Confirm `GET /api/v1/health` returns HTTP `200`.
3. Confirm smoke check passes with:

```powershell
$env:SMOKE_BASE_URL="https://<production-host>"
npm run smoke:backend
```
