# AITU Science RMS

Clean monorepo for the AITU Research Management System prototype.

## Structure

- `apps/frontend` - React + Vite client.
- `apps/server` - Express + MongoDB API.

## Local Setup

1. Install dependencies:

   ```bash
   npm run install:all
   ```

2. Create local env files from examples:

   ```bash
   cp apps/frontend/.env.example apps/frontend/.env.local
   cp apps/server/.env.example apps/server/.env
   ```

3. Start both apps:

   ```bash
   npm run dev
   ```

Frontend runs on `http://localhost:5173`.
Backend runs on `http://localhost:5000`.

## Useful Commands

```bash
npm run build
npm run start:server
npm run check:server
npm run lint:frontend
```

## Runtime Data

Uploaded files and generated reports are runtime data and are intentionally ignored by git:

- `apps/server/public/uploads`
- `apps/server/services/reports`

Keep real `.env` files local. Only `.env.example` files should be committed.
