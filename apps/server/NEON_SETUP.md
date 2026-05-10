# Neon Setup for Loki Server

This guide sets up a shared Neon Postgres database for the Loki backend and a 4-developer team workflow.

## 1) Create and secure the Neon workspace

1. Create a Neon organization and project for Loki.
2. Keep at least two trusted account owners (primary + backup) for account continuity.
3. Invite each developer to the organization/project instead of sharing one login.
4. Enable MFA on all owner/admin accounts.
5. Keep billing and ownership under a company-controlled email/group, not a personal inbox.

## 2) Create branches for team development

Use Neon branching so each dev can work safely without breaking shared data.

1. Keep one production branch (for example: `main`).
2. Keep one shared integration branch (for example: `staging`).
3. Give each developer an isolated branch (for example: `dev-alex`, `dev-sam`, `dev-jordan`, `dev-priya`).
4. Use branch-specific connection strings in local `.env` files.

## 3) Get your Neon connection string

From Neon dashboard, copy the Postgres connection string for the correct branch.

Recommended format:

```text
postgresql://<user>:<password>@<host>/<database>?sslmode=verify-full&channel_binding=require
```

## 4) Configure this backend

In `apps/server/.env`:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=verify-full&channel_binding=require
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true
DATABASE_POOL_MAX=10
```

Notes:
- `DATABASE_URL` is required for DB connectivity checks.
- `sslmode=verify-full` is recommended to keep strict TLS verification behavior with future `pg` versions.
- `DATABASE_SSL=true` is recommended for Neon.
- `DATABASE_SSL_REJECT_UNAUTHORIZED=true` is recommended so TLS validates the server certificate.
- `DATABASE_POOL_MAX` can stay `10` for local/dev starts.

## 5) Verify locally

1. Start server:

```powershell
cd c:\Loki\Loki
npm run server:dev
```

2. Log in from mobile/web to obtain auth token.
3. Call health endpoint:
   - `GET /api/v1/health`
4. Confirm response includes:
   - `"database": { "status": "ok", ... }`

If `DATABASE_URL` is missing, health will return:

```json
{
  "status": "degraded",
  "database": {
    "status": "not_configured",
    "message": "DATABASE_URL is not configured."
  }
}
```

## 6) Team operating model (recommended)

1. Each dev uses their own Neon branch + local `.env`.
2. Shared environments (staging/prod) use centrally managed secrets (not committed to git).
3. Restrict who can modify production branch settings.
4. Rotate credentials on team changes and immediately revoke removed users.
5. Run schema changes in staging first, then promote to production.
