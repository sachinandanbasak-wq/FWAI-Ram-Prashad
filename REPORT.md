# Defence Contract CRM — Phase 1, Step 1.1 report

## Status per part

Planning documents (Steps 1-3): DONE
  evidence: PRD.md, TECH-STACK.md, IMPLEMENTATION-PLAN.md; both approval gates passed.

Step 1.1 app shell: DONE
  evidence: `GET http://localhost:3000/ -> 200 len=32929`; `GET /settings -> 200 len=18953`; `npm.cmd run build` compiled, pages 4/4.

Three distinct screen states: 2 of 3 VERIFIED
  Missing: DONE — both pages name the two absent settings.
  Failed:  DONE — unreachable database produced "Could not load settings".
  Empty:   IMPLEMENTED, UNVERIFIED — needs a signed-in read against the real table.

Database migration 0001: DONE (applied to the live Supabase project)
  evidence: `node --env-file=.env.local scripts/apply-migration.mjs 0001_init.sql` ->
            `connected: ok`, `public tables: audit_log, profiles, settings`,
            `settings rows: 12`, `audit_settings trigger: 1`.

Git repository: DONE
  evidence: `git push -u origin main` -> `* [new branch] main -> main`;
            `git ls-remote --heads origin` -> `564643b... refs/heads/main`.
  Secrets stayed out: `.env.local` ignored, only `.env.example` staged.

Vercel deployment: DONE (live)
  evidence: `vercel deploy --prod --yes` -> `✓ Ready in 43s`;
            `GET https://defence-crm-alpha.vercel.app/ -> 200`, contains "Morning view".

Step 1.2 (login, roles, DB-enforced access): BLOCKED
  evidence: the app has no anon key yet, so it cannot authenticate or read settings through RLS.

## What broke and how I fixed it

- `npm.ps1` blocked by execution policy -> used `npm.cmd` throughout.
- Two TypeScript narrowing errors in `lib/config.ts` and `lib/settings.ts` -> fixed the guards; production build then passed.
- npm 11 blocked `esbuild`'s postinstall (Vitest-only) -> deferred until tests begin.

## Claims ledger

- "app serves the shell locally" — proven: `GET / -> 200`.
- "Missing and Failed states are distinct" — proven: two different env situations produced two different pages.
- "migration 0001 applies and creates the schema" — proven: the runner printed the three tables, 12 settings rows, and the audit trigger.
- "settings persist in Postgres" — proven at the database level (12 rows written by SQL).
- "the app reads settings from Postgres over RLS" — NOT yet. Needs the anon key and a signed-in user. UNVERIFIED.
- "code is on GitHub" — proven: remote branch hash returned.
- "the site is live" — proven: production alias returned 200 now.
- "Vercel production has the Supabase env vars" — NOT DONE yet.
- "deployment protection status" — Vercel warned protection is on, yet the alias returned 200; treat as a setting to confirm in the Vercel dashboard.

## What I would tell the next person

1. Run the app with `npm.cmd run dev`; deploy with `npx.cmd vercel deploy --prod`.
2. `.env.local` (git-ignored) holds the Supabase URL, the DB connection string, and the Vercel token. Rotate the DB password and the Vercel token — both were shared in plain research chat.
3. To finish Step 1.1 as an end-to-end proof, add `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`, create the owner user in Supabase Auth, insert the matching `profiles` row with `role = 'owner'`, then log in and read the 12 settings.
4. `settings` RLS is authenticated-only by design; an anonymous read returns nothing. That is correct, not a bug.
5. Every reminder: no example business data is shown anywhere.
