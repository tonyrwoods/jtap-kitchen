# Base44 Setup — JTAP Kitchen

## What this app is
Vite + React frontend using the Base44 SDK (`@base44/sdk`). It connects to a remote Base44 backend for data/auth. No local database — all data goes through the Base44 API proxy.

## Running it
```bash
docker compose -f docker-compose.base44.yml up -d
```
- Node 22 base image, source bind-mounted at `/app`, `node_modules` in a named volume.
- Dev server: `npx vite --host 0.0.0.0 --port 5173`, mapped to host port 3000.
- Vite config has `server.allowedHosts: true` so the preview's external hostname is accepted.
- The `@base44/vite-plugin` proxies `/api` to the configured Base44 backend URL.

## Required secrets (external service)
Delivered via `/run/base44/app.env`:
- `VITE_BASE44_APP_ID` — Base44 app ID
- `VITE_BASE44_APP_BASE_URL` — Base44 backend URL

Placeholder defaults in `.env.base44-defaults` allow the container to boot before real values arrive.

## Verifying it works
- `curl -sf -H "Host: external-preview.example.com" http://localhost:3000/` should return 200 with the Vite-served HTML.
- The Base44 proxy line (`[base44] Proxy enabled: /api -> ...`) in logs confirms the backend URL was read.
