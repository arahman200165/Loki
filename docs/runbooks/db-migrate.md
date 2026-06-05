# Database Migration Runbook

## Purpose

Run Loki SQL migrations against Neon staging or production in a controlled way.

## Source of truth

- Migration runner: [`apps/server/db/migrate.js`](/C:/Loki/Loki/apps/server/db/migrate.js:1)
- Migration files: [`apps/server/db/migrations`](/C:/Loki/Loki/apps/server/db/migrations:1)
- Tracking table: `schema_migrations`

## Normal automated path

The deploy workflow runs:

- `npm run server:migrate` with `STAGING_DATABASE_URL`
- `npm run server:migrate` with `PRODUCTION_DATABASE_URL` after production approval

The runner is idempotent for previously applied files because it skips any migration already recorded in `schema_migrations`.

## Manual execution

From repo root:

```powershell
$env:DATABASE_URL="<target-neon-connection-string>"
npm run server:migrate
```

## Safety rules

- Run new migrations in staging before production.
- Keep migrations backward compatible with the currently deployed app version.
- Treat destructive schema changes as a separately reviewed change.
- Do not use seeds or backfills in the deploy workflow by default.

## Verification

1. Confirm the workflow log shows either `apply` or `skip` for each migration file.
2. Confirm the target environment health endpoint returns HTTP `200`.
3. Confirm the response includes `"database": { "status": "ok" }`.

## Recovery

- If a migration fails, the runner issues `ROLLBACK` for the transaction.
- Fix the migration and rerun it.
- If a bad migration has already reached production, use the rollback runbook and Neon recovery options as needed.
