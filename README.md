# ACAT CyberGuard — Setup Guide

This is the real, deployable version of the CyberGuard prototype, wired to
a Supabase backend (Postgres + Auth + Storage) instead of in-browser demo
storage. Everything in `src/App.jsx` talks to Supabase through the `api`
object near the top of the file — no other UI code needed to change.

## 1. Install dependencies

```bash
npm install
```

## 2. Set up Supabase

If you haven't already:

1. Create a project at [supabase.com](https://supabase.com) (pick a region close to India, e.g. Singapore).
2. In the SQL Editor, run **`supabase_schema.sql`** (tables + RLS).
3. Then run **`storage_policies.sql`** (creates the private `evidence` bucket + its access rules).
4. Then run **`seed.sql`** (adds the sample alerts/guides so the app isn't empty).

## 3. Enable Anonymous sign-ins (replaces phone OTP for now)

Since phone OTP setup is being skipped for now, the app signs people in with
Supabase's **anonymous auth** — they get a real, persistent account with no
phone number or email needed. You must turn this on manually:

**Dashboard → Authentication → Sign In / Providers → Anonymous Sign-Ins → Enable**

Without this, the app will fail on load with a "Couldn't connect" toast.
When you're ready for real phone OTP later, only `ensureSession()` in
`src/App.jsx` needs to change — the rest of the app is unaffected.

## 4. Add your Supabase credentials

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your Project URL and anon public key, both
found at **Dashboard → Project Settings → API**. Both are safe to expose in
frontend code — never put the `service_role` key here or anywhere in this
project.

## 5. Run it locally

```bash
npm run dev
```

Open the printed localhost URL. The onboarding screen should appear (asks
for a name) — if instead you see a red "Couldn't connect" toast at the
bottom, double check step 3 and step 4.

## 6. Testing the Staff view

Settings → "Staff view (demo)" opens the reviewer console, but every staff
action (start review, send guidance, close case, etc.) is protected by Row
Level Security — it will only work for a Supabase user listed in the
`staff_roles` table. To test it as yourself:

1. Open the app once (so your anonymous user gets created).
2. In Supabase Dashboard → Authentication → Users, find your user (it'll be
   the most recent one, no email/phone shown since it's anonymous) and copy
   its UUID.
3. In Table Editor → `staff_roles`, insert a row: `user_id` = that UUID,
   `role` = `staff`.
4. Reload the app — staff actions should now succeed.

Real ACAT team members would each need their own row here once real staff
accounts (not anonymous ones) exist.

## 7. Deploy

1. Push this project to a GitHub repo.
2. Go to [vercel.com](https://vercel.com) → New Project → import the repo.
3. Vercel auto-detects Vite. Before deploying, add the two environment
   variables from `.env.local` under Project Settings → Environment
   Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
4. Deploy. Every future `git push` redeploys automatically.
5. Optional: attach a custom domain under Project Settings → Domains.

## What's still not real

- **Malware scanning** — files upload and hash correctly, but nothing scans
  them yet. Needs a Supabase Edge Function calling ClamAV or VirusTotal.
- **Phone/email OTP** — anonymous auth works but doesn't identify a real
  person. Needed before this can be trusted with real incident reports at
  scale (also required for DLT-compliant SMS in India if you go the phone
  OTP route later).
- **Push notifications** — the bell icon toggles a local preference only;
  no actual notification is ever sent.
- **Real staff accounts** — right now "staff" is just any Supabase user
  manually added to `staff_roles`. A real admin panel to manage this
  doesn't exist yet.

None of these block a private/internal test with real ACAT volunteers —
they matter before opening this to the general public.
