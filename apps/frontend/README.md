# AITU Science RMS Frontend

React + Vite frontend for the AITU Science RMS.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

When running from the repository root, prefer workspace commands:

```bash
npm run dev --workspace apps/frontend
npm run build --workspace apps/frontend
npm run lint --workspace apps/frontend
```

## Environment

Create `apps/frontend/.env.local`:

```env
VITE_API_URL=http://localhost:5000
```

## Notes

- The app uses protected routes for `user` and `admin` roles.
- API requests go through `src/services/api.js`, which refreshes expired access tokens when possible.
- Shared publication labels live in `src/constants/publications.js`.
