# HOSTING STEP-BY-STEP — PKM DUN SENTOSA LUCKY DRAW V2.9.2

This guide starts from a clean project and avoids the previous `supabaseUrl is required`, `DEV_RECURSIVE_INVOCATION`, RLS and invalid-URL problems.

## PART A — Prepare the project on Windows

### 1. Extract the ZIP
Extract the ZIP to a simple folder, for example:
`C:\LuckyDraw\pkm-lucky-draw`

Avoid working inside a deeply nested OneDrive path if possible.

### 2. Open Command Prompt in the project folder
Example:
```cmd
cd C:\LuckyDraw\pkm-lucky-draw
```

### 3. Check Node
```cmd
node -v
```
Use Node 20+; Node 22 LTS is recommended.

### 4. Install packages
```cmd
npm install
```

### 5. Install Vercel CLI once
```cmd
npm install -g vercel
```
Check:
```cmd
vercel --version
```

---

## PART B — Create/configure Supabase

### 6. Open your Supabase project
Use the existing project if you already created one.

### 7. Run the database schema
Open **Supabase → SQL Editor → New query**.
Open this project file:
`supabase/schema.sql`
Copy the entire SQL into the SQL Editor and click **Run**.

The schema creates:
- users
- events
- prizes
- participants
- draws
- indexes/constraints
- the `lucky-draw` Storage bucket

### 8. Verify registration rules
The database allows:
- Full Name = blank
- Contact Number = blank
- NRIC = required
- NRIC = unique per event

### 9. Get Supabase credentials
In **Supabase → Settings → API** obtain:
- Project URL
- server-side service-role/secret key

**Never paste the secret key into frontend code.**

---

## PART C — Create the Vercel project

### 10. Login
```cmd
vercel login
```
Complete the browser login.

### 11. Create/link the project
From the project folder:
```cmd
vercel
```
If asked:
- Team: choose your team
- Existing project: choose **Create a new project** if you want a clean deployment
- Project name: `pkm-lucky-draw` (or another available name)
- Code directory: `./`
- Customize settings: **No**

The project should be created and linked.

---

## PART D — Add Vercel environment variables

Go to **Vercel → Project → Settings → Environment Variables**.

Add these variables. Select **Production, Preview and Development** where available.

### Variable 1
Name:
`SUPABASE_URL`
Value:
`https://YOUR_PROJECT.supabase.co`

### Variable 2
Name:
`SUPABASE_SERVICE_ROLE_KEY`
Value:
Your Supabase server-side service-role/secret key.
Keep this **Secret**.

### Variable 3
Name:
`JWT_SECRET`
Value:
A long random secret, for example a randomly generated 32+ character value.

### Variable 4
Name:
`ADMIN_USERNAME`
Value:
Your desired administrator username, for example `admin`.

### Variable 5
Name:
`ADMIN_PASSWORD`
Value:
A strong initial administrator password.

### Variable 6
Name:
`SUPABASE_STORAGE_BUCKET`
Value:
`lucky-draw`

**Do not create `VITE_SUPABASE_SERVICE_ROLE_KEY`.**

---

## PART E — Local test

### 12. Pull Development variables
In Command Prompt:
```cmd
vercel env pull .env.local --environment=development
```

This creates `.env.local`. Never upload or share it.

### 13. Start the local server
```cmd
vercel dev
```

You should see:
`Ready! Available at http://localhost:3000`

### 14. Test health
Open:
`http://localhost:3000/api/health`

Expected:
```json
{"ok":true,"online":true,"databaseConfigured":true}
```

### 15. Test login
Open:
`http://localhost:3000`
Use the `ADMIN_USERNAME` and `ADMIN_PASSWORD` you configured.

The first successful login creates the admin record in Supabase.

### 16. Test registration
Create an event, open its registration QR/link, then test:
1. Name blank + NRIC entered + Phone blank → **must succeed**.
2. Same NRIC again for the same event → **must be rejected as duplicate**.
3. Different NRIC + blank Name + blank Phone → **must succeed**.

---

## PART F — Deploy to production

### 17. Deploy
Stop the local server with `Ctrl+C`, then run:
```cmd
vercel --prod
```

Follow the prompts if Vercel asks for confirmation.

### 18. Open the production URL
Vercel will display an HTTPS URL such as:
`https://pkm-lucky-draw-xxxx.vercel.app`

Open it and test login.

### 19. After environment-variable changes
Whenever you change Vercel environment variables, redeploy:
```cmd
vercel --prod
```

---

## PART G — Recommended final checks

- Login works.
- Event creation works.
- Prize creation works.
- QR registration works.
- Blank Name is accepted.
- Blank Phone is accepted.
- NRIC is required.
- Duplicate NRIC is blocked per event.
- Winner draw works.
- Excel reports work.
- Supabase Storage accepts event/prize images.

## Troubleshooting

### `supabaseUrl is required`
Run:
```cmd
vercel env pull .env.local --environment=development
```
Then restart:
```cmd
vercel dev
```

### `DEV_RECURSIVE_INVOCATION`
Do not run `npm start`. Run:
```cmd
vercel dev
```
The ZIP intentionally uses Vercel CLI for local development.

### `Invalid path specified in request URL`
This usually means an old frontend/API configuration is being used. This version uses `/api/...` on the same origin and server-side Supabase variables. Do not add `/rest/v1` to `SUPABASE_URL`.

### `new row violates row-level security policy`
This version uses the server-side Supabase service-role key in the Vercel API. Do not expose that key in the browser. Recheck that `SUPABASE_SERVICE_ROLE_KEY` is configured and that the API is the one being deployed.

### `Failed to fetch`
First open `/api/health`. If it does not return JSON, the Vercel API is not running/deployed. If it returns `databaseConfigured:false`, configure the environment variables.
