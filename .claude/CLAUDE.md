# Claude Guide For Loki

This file is the Claude-specific entrypoint for working in this repository. Keep it short and operational; the large product docs remain the source of truth.

## Current Repo Reality

Loki is an early MVP scaffold, not the finished messenger described in the roadmap docs.

- `apps/server/` is an Express + ESM backend with middleware, env config, health/auth routes, PostgreSQL pool config, in-memory bearer sessions, and a browser debug login.
- `apps/mobile/` is an Expo React Native app with Expo Router, splash/login flow, tab shell, AsyncStorage auth persistence, and a placeholder new-chat screen.
- `packages/shared/` has TypeScript types for all domain entities and API wire shapes, retention constants, and a `validatePublicId` / `normalizePublicId` utility. All cross-app contracts go here.
- `docs/` is the static GitHub Pages landing site. `docs/qa/` holds per-sprint manual QA checklists.
- There is no formal test infrastructure yet. Do not invent test commands.

## Source-Of-Truth Order

Use these files in this order when planning or implementing work:

1. `README.md` for what exists and how to run it today.
2. `loki-build-plan.md` for sprint order, dependencies, likely file ownership, and task sequencing.
3. `loki-mvp-prd.md` for MVP product scope, goals, non-goals, and acceptance intent.
4. `loki-feature-set.md` for feature-level behavior.
5. `loki-architecture.md` for privacy invariants, architecture principles, ADRs, domain model, limits, and known risks.

When the implementation differs from roadmap docs, state the gap plainly instead of pretending the future state already exists.

## Default Workflow

1. Inspect the current files before proposing architecture or commands.
2. Map the requested work to the relevant sprint task, product requirement, feature section, and architecture/ADR guidance.
3. Keep changes scoped to the request and the sprint dependency graph.
4. Preserve Loki privacy constraints before convenience, UI polish, or speed.
5. Put cross-app contracts, shared constants, and Public-ID validation in `packages/shared` instead of duplicating them.
6. Verify with commands that exist in `package.json` or workspace package scripts. If a command does not exist, say so.
7. After completing a sprint (or being asked to QA one), produce a manual QA checklist and save it to `docs/qa/sprint-<N>-qa.md`. Use the `manual-qa` skill. Do not skip this step — there is no automated test suite, so these checklists are the only structured verification record.

## Existing Commands

From the repo root:

```bash
npm run server:dev
npm run server:start
npm run mobile:start
```

From `apps/server`:

```bash
npm run dev
npm run start
npm run check
npm run migrate   # run DB migrations in apps/server/db/migrations/ against DATABASE_URL
```

From `apps/mobile`:

```bash
npm run start
npm run android
npm run ios
npm run web
npm run lint
```

## Claude Operating Surface

- Rules live in `.claude/rules/` and define recurring repo constraints.
- Skills live in `.claude/skills/` and describe reusable Loki workflows.
- Slash commands live in `.claude/commands/` and should inspect first, then act.

Prefer the lean project-specific files in `.claude` over copying large chunks from the roadmap docs into prompts.
