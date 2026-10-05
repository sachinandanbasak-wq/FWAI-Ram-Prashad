# WORKLOG

## Planning (Steps 1-3, approved)

Read the harness rules before work -> `read AGENTS.md` -> 135 lines; rule 3b: read PRD.md, TECH-STACK.md, IMPLEMENTATION-PLAN.md before writing code

Checked the workspace for existing plan docs -> `Get-ChildItem` -> only `fwai-starter` present; its PRD/TECH-STACK/IMPLEMENTATION-PLAN are titled "Pharma HR Enquiry Follow-up Board", a different project, so they were not overwritten

Created a dedicated project folder -> `New-Item -ItemType Directory defence-crm` -> `Test-Path` True

Wrote Step 1 (PRD) -> `write PRD.md` -> 28289 bytes

Wrote Step 2 (tech stack) -> `write TECH-STACK.md` -> 11087 bytes

Wrote Step 3 (implementation plan) -> `write IMPLEMENTATION-PLAN.md` -> 16526 bytes (after user approval of Steps 1-2)

## Phase 1, Step 1.1 — live shell

Checked tooling -> `node --version` / `npm.cmd --version` / registry HEAD -> `v24.19.0`, `11.17.0`, `200`; `npm.ps1` blocked by execution policy, so `npm.cmd` is used throughout

Wrote the app config and shell -> `write` package.json, tsconfig.json, next.config.mjs, postcss.config.mjs, tailwind.config.ts, .gitignore, .env.example, app/layout.tsx, app/page.tsx, app/settings/page.tsx, components/States.tsx, lib/config.ts, lib/supabase.ts, lib/settings.ts -> all created

Wrote migration 0001 -> `write supabase/migrations/0001_init.sql` -> settings + audit spine + profiles/roles + RLS

Installed dependencies -> `npm.cmd install --no-audit --no-fund` -> `added 150 packages in 3m`; npm 11 blocked esbuild's postinstall (Vitest only), to resolve when tests start

Started the dev server -> `npm.cmd run dev` -> ready on port 3000

Fetched the dashboard -> `Invoke-WebRequest http://localhost:3000/` -> `GET / -> 200 len=32929`; `Morning view: True`, `A setting is missing: True`, both env var names present, `No data yet: True`

Fetched the settings screen -> `GET /settings -> 200 len=18953`; `Missing state: True`, `Failed state absent: True`

Proved the Failed state is distinct -> temporary `.env.local` pointing at `http://127.0.0.1:9` -> `GET /settings -> 200 len=17385`; `Could not load settings: True`, `Nothing was changed: True`; then deleted the temporary file -> `Test-Path` False

Build failed twice on types -> `npm.cmd run build` -> first `./lib/config.ts:21` ("string | undefined"), fixed the guard so both values narrow; then `./lib/settings.ts:22` ("missing" not on the configured type), replaced the impossible branch with a failure message

Production build passed -> `npm.cmd run build` -> `✓ Compiled successfully in 7.5s`, pages 4/4, routes `/` (static) and `/settings` (dynamic)

## Phase 1, Step 1.1 — database, Git, deploy

Wrote a migration runner -> `write scripts/apply-migration.mjs` -> connects with DATABASE_URL and prints the resulting schema

Installed pg -> `npm.cmd install pg --save-dev` -> `added 14 packages in 9s`

Applied migration 0001 to the live Supabase database -> `node --env-file=.env.local scripts/apply-migration.mjs 0001_init.sql` -> `connected: ok`, `applied: 0001_init.sql`, `public tables: audit_log, profiles, settings`, `settings rows: 12`, `audit_settings trigger: 1`

Checked git identity and remote -> `git -C fwai-starter config user.name/user.email` reused, `git ls-remote <repo>` -> exit 0 with no refs (empty repo)

Initialised and staged -> `git init -b main` / `git add -A` -> `.env.local` and `node_modules` confirmed ignored; only `.env.example` (no secrets) matched the env pattern

Committed -> `git commit -m "Phase 1.1: app shell, settings, audit spine, migration 0001"` -> exit 0

Pushed -> `git remote add origin ... / git push -u origin main` -> `* [new branch] main -> main`, exit 0

Verified the remote branch -> `git ls-remote --heads origin` -> `564643b80888495b38b161d609069d4065301c0c refs/heads/main`

Deployed to Vercel -> `npx.cmd vercel deploy --prod --yes` -> `✓ Ready in 43s`, production alias `https://defence-crm-alpha.vercel.app`, exit 0

Fetched the live site -> `Invoke-WebRequest https://defence-crm-alpha.vercel.app/` -> `GET / -> 200`, `Morning view: True`

Added the Supabase URL to Vercel production -> `vercel env add NEXT_PUBLIC_SUPABASE_URL production` -> `✓ Added NEXT_PUBLIC_SUPABASE_URL`, environments Production

Allowed anonymous read of the non-sensitive settings table -> `node --env-file=.env.local scripts/apply-migration.mjs 0002_settings_anon_read.sql` -> `applied: 0002_settings_anon_read.sql`

Printed the real schema and policies -> `node --env-file=.env.local scripts/db-status.mjs` -> `settings rows: 12`; policies listed including `settings.settings_anon_read [SELECT] roles={anon}` and `settings.settings_read [SELECT] roles={authenticated}`

Added the publishable key and read settings through the API -> `GET http://localhost:3000/settings` -> `200 len=32722`, `Stored settings: True`, `company_name: True`, `gst_rate: True`, `Missing state absent: True`

Added the key to Vercel and redeployed -> `vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production` + `vercel deploy --prod --yes` -> `✓ Added`, `✓ Ready in 43s`, alias `https://defence-crm-alpha.vercel.app`

Verified the live site reads the database -> `GET https://defence-crm-alpha.vercel.app/settings` -> `200 len=15002`, `Stored settings: True`, `company_name: True`, `gst_rate: True`

## Phase 1, Step 1.2 — login, roles, route protection

Installed the auth helper -> `npm.cmd install @supabase/ssr` -> `added 2 packages in 5s`

Wrote the auth layer -> `write` lib/supabase/server.ts, lib/supabase/client.ts, middleware.ts, app/login/actions.ts, app/auth/actions.ts, app/login/page.tsx, app/layout.tsx, app/settings/page.tsx -> created

Build failed on a OneDrive symlink -> `npm.cmd run build` -> `EINVAL: invalid argument, readlink '...\.next\server\vendor-chunks'`; guessed the dev server was holding `.next` while the build wrote to it

Stopped the dev server and cleared `.next`, rebuilt -> `Remove-Item .next` + `npm.cmd run build` -> `✓ Compiled successfully in 29.6s`, routes `/`, `/login`, `/settings`, `Middleware 94.8 kB`

Restarted and tested the signed-out flows -> `Invoke-WebRequest` -> `GET /login -> 200 len=19053` with the email field; `GET /settings -> 307` (redirect to login); `GET / -> 200` with a "Sign in" link

## Phase 1, Step 1.3 — masters

Wrote migration 0003 -> `write supabase/migrations/0003_masters.sql` -> customers, oems, oem_contacts, oem_certificates, products; CHECK rules, FKs, audit triggers, RLS (read for any signed-in user, write for Owner/Operations)

Wrote the rule-test harness -> `write scripts/test-rules.mjs` -> tries to insert bad data and asserts each is rejected, all inside rolled-back transactions

Applied the migration -> `node --env-file=.env.local scripts/apply-migration.mjs 0003_masters.sql` -> `applied: 0003_masters.sql`, tables now include customers, oem_certificates, oem_contacts, oems, products

Seeded SAMPLE rows -> `node --env-file=.env.local scripts/apply-migration.mjs supabase/seed.sql` -> applied; every row prefixed "SAMPLE ... (do not use)"

Proved the database rules -> `node --env-file=.env.local scripts/test-rules.mjs` -> 12 bad-data cases rejected (`23514` check, `23503` foreign key), 3 good-data cases accepted, `ALL RULES PASS`, exit 0

Wrote the masters UI -> `write` app/masters/page.tsx, app/masters/{customers,oems,products}/page.tsx, app/masters/actions.ts; protected `/masters` in middleware; added the nav link

Built with the new routes -> `npm.cmd run build` -> `✓ Compiled successfully in 32.5s`, routes `/masters`, `/masters/customers`, `/masters/oems`, `/masters/products` all present

Tested route protection -> `Invoke-WebRequest -MaximumRedirection 0` -> `GET /masters -> 307`, `/masters/customers -> 307`, `/masters/oems -> 307`, `/masters/products -> 307`; `GET / -> 200` with a Masters link
