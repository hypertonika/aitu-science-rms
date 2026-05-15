# AITU Science RMS

AITU Science RMS is a research management system for tracking university publications, researcher profiles, admin review workflows, exports and academic resume generation.

The project is organized as a Node.js monorepo:

- `apps/frontend` - React + Vite client.
- `apps/server` - Express + MongoDB API.

## Implemented Scope

- JWT authentication with access and refresh token rotation.
- User and admin roles with protected frontend routes and backend role checks.
- Researcher profile management: contacts, school, visibility, ORCID, Scopus and Web of Science identifiers.
- Publication CRUD with draft, submitted, approved and rejected statuses.
- DOI/Crossref import into draft publications.
- Duplicate publication checks by normalized title, authors and DOI.
- Admin review queue with approve/reject actions and review comments.
- Public/private/institutional visibility fields for profiles and publications.
- Publication filtering by query, year, type, status and higher school.
- User and admin dashboards with analytics.
- CSV, PDF and Excel exports.
- DOCX/PDF resume and report generation.

## Requirements

- Node.js 20+
- npm 10+
- MongoDB running locally or a remote MongoDB connection string

## Environment

Create local env files from examples:

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/server/.env.example apps/server/.env
```

On Windows PowerShell:

```powershell
Copy-Item apps/frontend/.env.example apps/frontend/.env.local
Copy-Item apps/server/.env.example apps/server/.env
```

Frontend env:

```env
VITE_API_URL=http://localhost:5000
```

Server env:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/aitu-science
JWT_SECRET=change-me
JWT_REFRESH_SECRET=change-me-too
LOCAL_ORIGIN=http://localhost:5173
PRODUCTION_ORIGIN=
CROSSREF_MAILTO=research@example.edu
```

For real use, replace both JWT secrets with long random values.

## Install

Install all workspace dependencies from the repository root:

```bash
npm install
```

or:

```bash
npm run install:all
```

## Run Locally

Start frontend and backend together:

```bash
npm run dev
```

Default URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

You can also start the backend only:

```bash
npm run start:server
```

## Verification

Run the main checks before submitting or committing:

```bash
npm run lint:frontend
npm run build
npm run check:server
```

The frontend build may show a Vite warning about a large JavaScript chunk because charting libraries are bundled into the app. This is not a build failure.

## Data And Files

MongoDB stores users and publications.

Runtime files are intentionally ignored by git:

- `apps/server/public/uploads`
- `apps/server/services/reports`

Keep real `.env` files local. Only `.env.example` files should be committed.

## Main Workflows

Researcher:

1. Register or sign in.
2. Complete profile data in `Profile`.
3. Add a publication manually or import metadata from Crossref.
4. Submit draft/rejected publications for review.
5. Export approved publications or generate an academic resume.

Admin:

1. Sign in with an admin account.
2. Review submitted publications in `Review`.
3. Approve or reject with comments.
4. Monitor dashboards and user profiles.
5. Export approved publications and reports.

## Useful Commands

```bash
npm run dev
npm run build
npm run start:server
npm run check:server
npm run lint:frontend
npm run backfill:mvp --workspace apps/server
```
