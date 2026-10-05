# Defence Contract CRM — Phase 1, Step 1.1 report

## Status per part

Planning documents (Steps 1-3): DONE
  evidence: PRD.md (28289 bytes), TECH-STACK.md (11087 bytes), IMPLEMENTATION-PLAN.md (16526 bytes); user approved both gates.

Phase 1 — Step 1.1 live shell: DONE
  evidence: `npm.cmd run dev` ready on port 3000;
            `GET http://localhost:3000/ -> 200 len=32929`, contains "Morning view" and the eight morning-view tiles;
            `GET http://localhost:3000/settings -> 200 len=18953`.

Three distinct screen states: 2 of 3 VERIFIED
  missing setting: DONE — with no .env.local, both pages show "A setting is missing" naming NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
  failed call:     DONE — with a temporary .env.local pointing at http://127.0.0.1:9, /settings returned 200 with "Could not load settings" and "Nothing was changed".
  empty table:     IMPLEMENTED, UNVERIFIED — needs a real database with the settings table present and zero rows.

Production build: DONE
  evidence: `npm.cmd run build` -> "Compiled successfully in 7.5s", "Generating static pages (4/4)",
            routes `/` (static) and `/settings` (dynamic).

Database migration 0001_init.sql: WRITTEN, UNVERIFIED
  evidence: file `supabase/migrations/0001_init.sql` created.
  Cannot be applied or proven without a Supabase project and keys.

Phase 1 — Steps 1.2 to 1.6 (auth/roles, masters, RFI + line grid, import): BLOCKED
  evidence: no Supabase project or keys exist in this environment, so no table can be created and no persistence can be proven.

## What broke and how I fixed it

- `npm.ps1` is blocked by the machine execution policy. Fixed by using `npm.cmd` for every npm command.
- First production build failed: `lib/config.ts:21` — TypeScript could not narrow `string | undefined` from a `missing.length` check. Fixed by making the guard `if (!url || !key)` so both values narrow; this also forced the second error out.
- Second build failed: `lib/settings.ts:22` — after the `configured` guard, `config.missing` no longer exists on the type. Fixed by returning an honest failure state ("The database client could not be created.") instead of reading a field that cannot be there.
- npm 11 blocked `esbuild`'s postinstall script. It is only needed by Vitest, which is not used yet; to be resolved with `npm approve-scripts` when tests begin.

## Claims ledger

- "the app runs and serves the dashboard at localhost:3000" — proven: `GET / -> 200`, content checks listed above.
- "the Missing state names both settings" — proven: `/` and `/settings` both contain the two env var names with no .env.local.
- "the Failed state is distinct from Missing" — proven: temporary bad env produced "Could not load settings"; Missing text was absent.
- "changes build in production mode" — proven: `next build` compiled and generated 4/4 pages.
- "data persists in Postgres" — NOT PROVEN. No database is connected. UNVERIFIED.
- "migration 0001 applies cleanly" — NOT PROVEN. UNVERIFIED.
- "the app is deployed to a public URL" — NOT DONE. No Vercel login available in this environment.

## What I would tell the next person

1. The app lives at the project root (`defence-crm/`); run it with `npm.cmd run dev` (use `npm.cmd`, not `npm`).
2. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, then run `supabase/migrations/0001_init.sql` in the SQL editor. That unblocks Step 1.2.
3. The service-role key (needed for the first user creation and migrations) must live only in a server-side variable, never `NEXT_PUBLIC_`, and never in the repo.
4. The three states are deliberate and must stay visually distinct: amber Missing, neutral Empty, red Failed.
5. No example business data is shown anywhere; the dashboard tiles carry an em dash and "No data yet".
