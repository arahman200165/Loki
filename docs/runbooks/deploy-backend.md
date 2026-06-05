# Backend Deploy Runbook

## Purpose

Deploy the Loki backend from GitHub Actions into Render staging and production using the same `main` commit.

## Prerequisites

- `render.yaml` has been reviewed against the existing Render service settings before Blueprint sync.
- Render backend services exist as:
  - `loki-api-staging`
  - `loki-api-production`
- Render backend auto-deploy is disabled for both services.
- GitHub environments exist:
  - `staging`
  - `production`
- Environment secrets are configured:
  - `STAGING_DATABASE_URL`
  - `RENDER_STAGING_DEPLOY_HOOK_URL`
  - `STAGING_BASE_URL`
  - `PRODUCTION_DATABASE_URL`
  - `RENDER_PRODUCTION_DEPLOY_HOOK_URL`
  - `PRODUCTION_BASE_URL`
- Runtime secrets are set in Render for both services:
  - `CLIENT_ORIGIN`
  - `API_KEY`
  - `AUTH_USERNAME`
  - `AUTH_PASSWORD`
  - `DATABASE_URL`

## Standard deploy path

1. Merge a change into `main`.
2. Confirm `.github/workflows/ci.yml` succeeds.
3. Confirm `.github/workflows/deploy-backend.yml` starts automatically from the successful `push` run.
4. Wait for staging migration, staging deploy hook, and staging smoke check to succeed.
5. Approve the `production` environment gate in GitHub.
6. Wait for production migration, deploy hook, and smoke check to finish.
7. Confirm Render reports a healthy deploy and `GET /api/v1/health` returns HTTP `200`.

## First-time Blueprint adoption

1. In Render, generate a Blueprint from the existing backend services and compare it with [`render.yaml`](/C:/Loki/Loki/render.yaml:1).
2. Reconcile any plan, region, domain, or scaling differences before the first sync.
3. Create or connect the Blueprint in Render using the repo root `render.yaml`.
4. Confirm no unexpected changes are listed before deploying the Blueprint.

## Failure handling

- If staging migration fails, stop. Fix the migration or staging environment and rerun the workflow.
- If staging smoke fails, do not approve production. Inspect Render logs and staging health output.
- If production migration fails, do not trigger a manual production deploy until the schema issue is resolved.
- If production smoke fails after deploy, follow [`rollback-backend.md`](/C:/Loki/Loki/docs/runbooks/rollback-backend.md:1).
