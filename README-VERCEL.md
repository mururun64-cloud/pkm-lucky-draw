# PKM DUN SENTOSA Lucky Draw — Vercel Edition

This version replaces the offline SQLite/local-file backend with:
- Vercel serverless Node/Express API
- Supabase PostgreSQL database
- Supabase Storage for event/prize images
- JWT authentication

## Deploy

1. Create a Supabase project.
2. Open Supabase -> SQL Editor and run `supabase/schema.sql`.
3. Create a GitHub repository and upload the contents of this folder.
4. In Vercel, import the GitHub repository.
5. Add these Vercel Environment Variables for Production (and Preview if desired):
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = your Supabase service role key (server-side only)
   - `JWT_SECRET` = a long random secret
   - `ADMIN_USERNAME` = your desired first-login username (optional; default `admin`)
   - `ADMIN_PASSWORD` = your desired first-login password (optional; default `admin123`)
   - `SUPABASE_STORAGE_BUCKET` = `lucky-draw` (optional)
6. Deploy.
7. Open the Vercel URL.
8. Login using the configured admin credentials. The first successful login creates the admin account in Supabase.
9. Create an event and use the QR button. The generated registration URL will use the public Vercel HTTPS URL.

## Important

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code.
- Change the default admin password before a real event.
- The old SQLite `data/` directory is intentionally not used in this build.
- Local `uploads/` and `backups/` are intentionally not used for persistent production data.
- The database backup endpoint now exports JSON rather than a SQLite file.
