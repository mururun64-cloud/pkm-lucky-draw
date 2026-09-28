# PKM DUN SENTOSA Lucky Draw System — V2.9.2 NRIC-Only

Production-ready Vercel + Supabase edition.

## Registration rules
- **NRIC Number:** required and unique per event.
- **Full Name:** optional; never used for duplicate checking.
- **Contact Number:** optional; never used for duplicate checking.

## Architecture
Browser → Vercel HTTPS → `/api/index.js` → Supabase PostgreSQL/Storage

The Supabase service-role key is server-side only. It is never placed in frontend `VITE_` variables.

## Quick local test
1. Install Node.js 20+ (Node 22 LTS is recommended).
2. Install dependencies: `npm install`
3. Install Vercel CLI once: `npm install -g vercel`
4. Link/create the Vercel project: `vercel link` or `vercel`
5. Pull Development variables: `vercel env pull .env.local --environment=development`
6. Start local server: `vercel dev`
7. Open `http://localhost:3000`

**Do not use `npm start` in this edition. Use `vercel dev`.**

## Supabase setup
1. Create/open the Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql` once.
4. Get the project URL and server-side service-role/secret key.
5. Never expose the service-role/secret key in browser code.

## Vercel environment variables
Add to **Production, Preview and Development** as needed:
- `SUPABASE_URL` = `https://YOUR_PROJECT.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = Supabase server-side secret/service-role key
- `JWT_SECRET` = long random secret
- `ADMIN_USERNAME` = first admin username (recommended)
- `ADMIN_PASSWORD` = first admin password (recommended)
- `SUPABASE_STORAGE_BUCKET` = `lucky-draw`

After changing variables, redeploy. For local development run `vercel env pull .env.local --environment=development`.

## First login
The first successful login creates the admin user in Supabase. Change the initial credentials before the real event.

## Deployment
See `HOSTING-STEP-BY-STEP.md` for the complete Windows + Supabase + GitHub + Vercel procedure.

## Important security
- Do not commit `.env.local`.
- Do not paste `SUPABASE_SERVICE_ROLE_KEY`, `sb_secret_...`, or `JWT_SECRET` into frontend files.
- Do not create `VITE_SUPABASE_SERVICE_ROLE_KEY`.
- The frontend calls `/api/...`; only the Vercel API talks to Supabase.
