# Database Schema

This folder contains the PostgreSQL schema and schema bootstrap logic for the server app.

## How schema initialization works

- `src/server.js` calls `ensureAuthSchema()` at startup.
- `ensureAuthSchema()` loads every `.sql` file in `src/db/schema/` in filename order and executes them.
- Scripts are idempotent (`create table if not exists`, `create index if not exists`, `alter table ... if not exists`) so they can run on every boot.

## Schema file layout

Schema files are ordered with numeric prefixes:

- `01_core_entities.sql`: identity and device foundation tables.
  - `users`
  - `devices`
  - `device_prekeys`
  - `user_contact_codes`
- `02_auth_sessions.sql`: authentication challenge/session tables.
  - `auth_challenges`
  - `auth_sessions`
  - `web_sessions`
- `03_device_linking_and_recovery.sql`: linking/recovery flow tables.
  - `device_link_sessions`
  - `recovery_sessions`
- `04_indexes.sql`: query-performance and uniqueness indexes.
- `05_compatibility_updates.sql`: safe compatibility updates for older databases.

## Table relationships (high level)

- `users` -> `devices` is one-to-many.
- `devices` -> `device_prekeys` is one-to-many.
- `users` and `devices` both connect to session/linking/recovery tables through foreign keys.
- Most foreign keys use `on delete cascade`; some linking references use `on delete set null` where historical linkage may be kept.

## Running the schema

Prerequisites:

1. PostgreSQL is reachable from the server process.
2. `DATABASE_URL` is set in environment (see `.env.example`).

Apply schema manually:

```bash
npm run db:schema
```

Run normally (also applies schema automatically before listening):

```bash
npm run dev
```

or

```bash
npm start
```

## Environment variables used by DB bootstrap

- `DATABASE_URL` (required)
- `DATABASE_SSL` (default `true`)
- `DATABASE_SSL_REJECT_UNAUTHORIZED` (default `true`)
- `DATABASE_POOL_MAX` (default `10`)

## Extending the schema safely

1. Add a new `.sql` file in `src/db/schema/` with the next numeric prefix (`06_...sql`).
2. Make changes idempotent so reruns are safe.
3. Keep tables in domain-specific files and indexes in `04_indexes.sql` (or a later index file if needed).
