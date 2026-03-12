# Loki

Loki is a monorepo with:
- A Node.js + Express backend API (`apps/server`)
- An Expo React Native mobile app (`apps/mobile`)
- Shared package(s) for cross-app code (`packages/shared`)

## Table of Contents
- [Project Structure](#project-structure)
- [Implementation Overview](#implementation-overview)
- [Authentication Model](#authentication-model)
- [API Endpoints](#api-endpoints)
- [Run Locally](#run-locally)
- [Environment Variables](#environment-variables)
- [Common Commands](#common-commands)
- [Troubleshooting](#troubleshooting)

## Project Structure

```text
Loki/
|- apps/
|  |- mobile/      # Expo app (login + ping server flow)
|  |- server/      # Express API + browser-protected web page
|- packages/
|  |- shared/      # Shared constants/types/utilities
|- package.json    # Workspace-level scripts
```

## Implementation Overview

### Backend (`apps/server`)
- Entry/middleware setup in `src/app.js`
- Security and request pipeline:
  - `helmet` for security headers
  - `cors` with configured `CLIENT_ORIGIN`
  - `morgan` for request logging
  - JSON/body parsing middleware
- Route design:
  - Web routes:
    - `GET /login`
    - `POST /login`
    - `GET /` (requires browser session)
    - `POST /logout` (requires browser session)
  - API routes under `API_PREFIX` (default `/api/v1`)
- API guards:
  - `requireApiKey` enforces API key header
  - `requireSessionAuth` enforces bearer token session

### Mobile app (`apps/mobile`)
- Login screen in `app/login.tsx`
- Sends:
  - `POST /api/v1/auth/login` with username/password
  - `GET /api/v1/health` as "Ping Server"
- Uses `AsyncStorage` to persist:
  - `authToken`
  - `authUser`
- Sends API key using `x-api-key` header with value from `EXPO_PUBLIC_API_KEY`

## Authentication Model

Loki currently uses simple credential-based auth configured in server environment variables:
- `AUTH_USERNAME`
- `AUTH_PASSWORD`

On successful login:
- Server creates an in-memory session token
- Mobile receives a bearer token
- Protected API routes require:
  - Valid `x-api-key`
  - Valid `Authorization: Bearer <token>`

Note: the backend web root (`/`) is protected separately by browser session login via `/login`.

## API Endpoints

Assuming default `API_PREFIX=/api/v1`:
- `POST /api/v1/auth/login` - authenticate and receive token
- `POST /api/v1/auth/logout` - invalidate token (requires bearer token)
- `GET /api/v1/health` - health check (requires bearer token)

## Run Locally

### 1) Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+
- Expo CLI tools (installed via project dependencies)

### 2) Install dependencies (workspace root)

```powershell
cd c:\Loki\Loki
npm install
```

### 3) Configure backend env

```powershell
cd c:\Loki\Loki\apps\server
Copy-Item .env.example .env
```

### 4) Start backend

From workspace root:

```powershell
cd c:\Loki\Loki
npm run server:dev
```

Or from `apps/server` directly:

```powershell
npm run dev
```

### 5) Start mobile app

In a second terminal:

```powershell
cd c:\Loki\Loki
$env:EXPO_PUBLIC_API_KEY="dev-mobile-api-key"
npm run mobile:start
```

Important:
- `EXPO_PUBLIC_API_KEY` must match backend `API_KEY` in `apps/server/.env`
- `apps/mobile/app/login.tsx` currently uses a hardcoded `API_BASE_URL`, so update it if your server runs at a different host/IP

## Environment Variables

### Backend (`apps/server/.env`)

Defaults from `.env.example`:

```env
PORT=4000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000
API_PREFIX=/api/v1
API_KEY=dev-mobile-api-key
API_KEY_HEADER=x-api-key
AUTH_USERNAME=loki-admin
AUTH_PASSWORD=loki-pass-123
```

### Mobile
- `EXPO_PUBLIC_API_KEY` - API key sent in `x-api-key`

## Common Commands

From workspace root (`c:\Loki\Loki`):

```powershell
npm run server:dev     # start backend in dev mode (nodemon)
npm run server:start   # start backend in node mode
npm run mobile:start   # start Expo app
```

From `apps/mobile`:

```powershell
npm run android
npm run ios
npm run web
npm run lint
```

## Troubleshooting

- `401 Unauthorized` on mobile requests:
  - Ensure login succeeded and token is being sent.
- `403`/API key errors:
  - Ensure `EXPO_PUBLIC_API_KEY` exactly matches backend `API_KEY`.
- Cannot connect from device/emulator:
  - Confirm `API_BASE_URL` in `apps/mobile/app/login.tsx` points to a reachable backend host.
