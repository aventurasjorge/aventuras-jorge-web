# Aventuras Jorge — website

React (Vite) frontend, deployed to Netlify. Talks to the existing
Aventuras Jorge booking API hosted on Railway.

## Structure

```
src/
  api/
    client.js      # shared fetch wrapper: base URL, headers, error handling
    tours.js        # feature-specific calls, e.g. getTours()
  pages/
    Home.jsx         # example page using the API client
  App.jsx             # routes
  main.jsx            # React entry point
netlify.toml           # build command + SPA redirect rule
.env.example            # copy to .env.local for local dev
```

As the app grows, add more files under `src/api/` per feature (e.g.
`auth.js`, `trips.js`), and more pages/routes in `App.jsx`.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in VITE_API_URL
npm run dev
```

`.env.local` is gitignored — never commit real API URLs or secrets.

## Connecting to Railway

All requests go through `src/api/client.js`, which reads the API base
URL from `VITE_API_URL`. Point this at:
- your Railway deployment's URL for normal development, or
- `http://localhost:PORT` if you're running the Railway API locally too

Your Railway API needs to allow cross-origin requests from this site's
domain (both your local dev origin and the production Netlify domain)
in its CORS configuration, or the browser will block these calls.

## Deploying

1. Push this repo to GitHub.
2. In Netlify: "Add new site" → "Import from GitHub" → select this repo.
   Build command and publish directory are already set via `netlify.toml`.
3. In Netlify's dashboard, set the `VITE_API_URL` environment variable
   to your production Railway URL (Site settings → Environment variables).
4. Point `aventurasjorge.com` at Netlify (Domain settings).

## Adding a new API call

```js
// src/api/trips.js
import { api } from "./client";

export function getTripStatus(tripId) {
  return api.get(`/api/trips/${tripId}/status`);
}
```

Then use it in a component the same way `Home.jsx` uses `getTours()`.
