# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Loki is a privacy-first messenger MVP — a monorepo containing a React Native mobile app (Expo) and a Node.js/Express backend API, plus a static GitHub Pages landing site.

## Commands

### Root (run from `c:\Loki\Loki`)
```bash
npm run server:dev      # Start backend with nodemon (auto-reload)
npm run server:start    # Start backend (production)
npm run mobile:start    # Start Expo dev server
```

### Server (`apps/server`)
```bash
npm run dev     # nodemon src/server.js
npm run start   # node src/server.js
npm run check   # Syntax check only
```

### Mobile (`apps/mobile`)
```bash
npm run start     # expo start (choose platform interactively)
npm run android   # expo start --android
npm run ios       # expo start --ios
npm run web       # expo start --web
npm run lint      # ESLint via expo lint
```

No test infrastructure exists yet.

## Architecture

### Monorepo Layout
- `apps/server/` — Express API (JavaScript, ESM)
- `apps/mobile/` — Expo React Native app (TypeScript)
- `packages/shared/` — Shared types/utilities (currently minimal)
- `docs/` — Static GitHub Pages landing site

### Backend (`apps/server/src/`)

The server has **two separate authentication contexts** mounted on different route prefixes:

| Context | Routes | Auth Mechanism |
|---|---|---|
| Mobile API | `/api/v1/*` | `x-api-key` header + `Authorization: Bearer <token>` |
| Web browser | `/login`, `/` | httpOnly cookie `loki_session` |

Key files:
- `app.js` — Middleware stack and route mounting
- `server.js` — HTTP server init and graceful shutdown
- `config/env.js` — All env vars with defaults
- `services/sessionStore.js` — In-memory token store (`crypto.randomBytes(48)`)
- `services/healthCheckService.js` — DB connectivity probe
- `db/pool.js` — PostgreSQL connection pool (SSL-configurable)
- `controllers/authController.js` — Mobile login/logout
- `controllers/webAuthController.js` — Browser login/logout + protected home page

Authentication uses hardcoded credentials from env vars (`AUTH_USERNAME`, `AUTH_PASSWORD`) with timing-safe comparison. Sessions are in-memory only (cleared on restart, no expiration).

### Mobile (`apps/mobile/app/`)

Uses Expo Router (file-based routing, like Next.js):

- `_layout.tsx` — Root stack navigator
- `index.tsx` — Animated splash, auto-redirects to login after 2.4s
- `login.tsx` — Login form; stores `authToken` + `authUser` in AsyncStorage; `API_BASE_URL` is hardcoded to the Render deployment (`https://loki-0pfz.onrender.com/api`)
- `(tabs)/` — Tab navigator (Chats, Calls, Profile)
- `chat/newchat.tsx` — New chat modal (placeholder)

The mobile client sends every API request with two headers: `x-api-key` (from `EXPO_PUBLIC_API_KEY`) and `Authorization: Bearer <token>`.

### Data Flow

```
Mobile login:
  POST /api/v1/auth/login  →  validate creds  →  generate token  →  return { token, user }
  Client stores token in AsyncStorage  →  navigate to /(tabs)/chat

Protected requests:
  x-api-key + Authorization: Bearer <token>  →  requireApiKey  →  requireSessionAuth  →  handler
```

## Environment Setup

### Backend (`apps/server/.env`)
Copy `.env.example` and fill in:
```
PORT=4000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000
API_KEY=dev-mobile-api-key
AUTH_USERNAME=loki-admin
AUTH_PASSWORD=loki-pass-123
DATABASE_URL=                          # Neon Postgres connection string (optional)
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true
```

### Mobile
Set `EXPO_PUBLIC_API_KEY` to match the server's `API_KEY`. The `API_BASE_URL` in `apps/mobile/app/login.tsx` is currently hardcoded to the Render deployment; change it for local development.

## Deployment

- **Backend:** Deployed on Render.com
- **Landing page:** GitHub Pages via `.github/workflows/deploy-pages.yml` (auto-deploys `docs/` on push to `main`)
- **Database:** Neon Postgres (see `apps/server/NEON_SETUP.md` for branching strategy)

## Key Constraints

- The React Compiler and New Architecture are both enabled in the Expo app (`app.json`).
- Session tokens have no expiration — they survive only until the server restarts or explicit logout.
- The `packages/shared` package exists for cross-app code but is not yet used; add types/constants there rather than duplicating across apps.
