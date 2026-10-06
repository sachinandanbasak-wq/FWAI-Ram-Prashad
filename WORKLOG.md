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

## Phase 1, Step 1.3b — Excel export

Chose exceljs over SheetJS -> `npm.cmd install exceljs` -> `added 96 packages in 24s`; edited TECH-STACK.md §8 to record the change and the reason (the npm `xlsx` build is unmaintained)

Wrote the export layer -> `write lib/export.ts, app/masters/export/[entity]/route.ts, scripts/export-check.mjs`; added "Export to Excel" links to the three lists

Proved the export on real rows -> `node --env-file=.env.local scripts/export-check.mjs` -> `rows read from database: 2`, `bytes: 6671`, `reopened sheet: Customers`, `reopened rows (including header): 3`, `first header cell: Name`

Build failed on one cast -> `npm.cmd run build` -> `Type error: ... route.ts:40 Conversion of type ... may be a mistake`; fixed by casting through `unknown`, re-ran

Build passed -> `npm.cmd run build` -> `✓ Compiled successfully`, route `/masters/export/[entity]` listed

Tested export route protection -> `GET /masters/export/customers -> 307`, `/oems -> 307`, `/products -> 307`

## Dark workspace (requested from the reference screenshot)

Rebuilt the shell -> `write` tailwind.config.ts (dark palette), app/globals.css, lib/navigation.ts, components/Sidebar.tsx, app/layout.tsx -> dark theme, left module sidebar, top bar; modules not yet built show a "Soon" tag instead of a dead link

Wrote migration 0004 -> `write supabase/migrations/0004_requirements.sql` -> requirements + requirement_lines, CHECK rules, unique rfi_number and line numbers, `v_requirement_overview` view (security_invoker), audit triggers, RLS (read signed-in, write Owner/Sales)

Extended the rule tests -> `node --env-file=.env.local scripts/test-rules.mjs` -> 17 bad-data cases rejected (incl. blank RFI, bad status, deadline before receipt, quantity 0, duplicate line number), 5 good accepted, `ALL RULES PASS`, exit 0

Applied and seeded -> `scripts/apply-migration.mjs 0004_requirements.sql` then `supabase/seed.sql` -> tables now include requirements, requirement_lines, v_requirement_overview; 5 SAMPLE requirements seeded

Built the Requirements workspace -> `write components/RequirementsTable.tsx, app/requirements/page.tsx` -> search, status filter, record count, and an added "Next action" column (an improvement over the reference)

Added a public demo evaluator -> `write app/demo/page.tsx` -> `/demo` needs no login and shows only embedded SAMPLE rows, so the workspace can be reviewed before auth is set up

Built and verified -> `npm.cmd run build` -> routes `/demo`, `/requirements`, `/masters/*`, `/settings`; then `GET /demo -> 200 len=31463` with 5 distinct SAMPLE RFIs, SAMPLE DATA badge, red missing-information, status pills, and the sidebar; `GET /requirements -> 307`, `/settings -> 307`, `/masters -> 307`

## Branding: Indian Defence CRM + jet + tricolour

Wrote a reusable setting updater -> `write scripts/set-setting.mjs` -> sets one settings row as JSON

Wrote the defence motif -> `write components/Jet.tsx` (fighter-jet SVG + TricolourBar), `components/Brand.tsx` (first word painted saffron -> white -> green)

Set the company name -> `node --env-file=.env.local scripts/set-setting.mjs company_name "Indian Defence CRM"` -> `set company_name = "Indian Defence CRM"`

Wired the motif in -> sidebar brand shows the jet + tricolour name + a flag bar; a tricolour bar runs along the top of every page; the dashboard hero and the demo header carry a jet silhouette

Dev crashed on the OneDrive `.next` again -> `next dev` -> `EINVAL ... readlink '.next\\diagnostics'` (a production build had just created `.next`); fixed by clearing `.next` before `next dev`

Verified the branding -> `GET http://localhost:3000/demo -> 200 len=34526`; `company name present: True`, `saffron gradient on Indian: True`, `green flag colour present: True`, `jet svg present: True`, 5 sample rows

## Floating Indian flag

Added an animated flag after the company name -> `write components/IndianFlag.tsx` + `.flag-float` keyframes in globals.css -> an SVG flag (saffron/white/green + 24-spoke Ashoka Chakra) warped by an animating SVG turbulence filter and floated by CSS (pivot at the left edge, continuous lift/tilt)

Verified the markup -> `GET http://localhost:3000/demo -> 200 len=38239`; `flag-float: True`, `feTurbulence: True`, animated `baseFrequency: True`, `viewBox 0 0 60 40: True`, 24 chakra spokes, `aria-label="Indian flag"`

Reworked it to blow instead of shake -> `write components/IndianFlag.tsx` + `.flag-float` in globals.css -> removed the morphing noise filter and the rotate/skew tilt; the flag is now clipped to a travelling wave (`clipPath` + animated `d`, `calcMode="spline"`) anchored at the pole edge, with only a slow 1.5px lift outside

Verified the calmer version -> `GET /demo -> 200 len=38453`; `flag-float: True`, `clipPath flagCloth: True`, `animated path d: True`, `keySplines: True`, `old noise filter gone: True`, 24 chakra spokes

## Customer pipeline, Follow-ups Today, responsive fix

Added customer fields -> `write supabase/migrations/0005_customer_pipeline.sql` -> phone, source (Call|WhatsApp|Referral), stage (New|Contacted|Quoted|Won), next_followup_date; CHECK constraints; also removed duplicate SAMPLE rows

Checked counts before fixing -> `node scripts/counts.mjs` -> customers 4, oem_contacts 2, oem_certificates 2, products 4 (the seed had repeated itself)

Made the seed idempotent -> `write supabase/seed.sql` (NOT EXISTS guards + pipeline fields) -> re-ran seed and `counts.mjs` -> customers 2, oem_contacts 1, oem_certificates 1, products 2 (no duplicates)

Added the actions -> `app/masters/actions.ts` -> createCustomer (name/phone/source/follow-up) and updateCustomerStage, both with `revalidatePath`

Built the UI -> `components/AddCustomerPanel.tsx` (Add Customer button + Save), `components/StageSelect.tsx` (saves on change), rewrote `app/masters/customers/page.tsx`, added `app/follow-ups/page.tsx`, set Follow-ups `ready: true`

Fixed the mobile overflow -> `components/WorkspaceShell.tsx` -> the sidebar is an off-canvas drawer under `lg`, header wraps, `min-w-0`/`overflow-x-hidden` on the frame

Extended the rule tests -> `node scripts/test-rules.mjs` -> now 24 cases (added bad source, bad stage, valid pipeline), `ALL RULES PASS`, exit 0

Proved the flow in a real browser at 375px -> puppeteer on `/demo/customers` -> `form fields: {saveButton:true, sources:[Call,WhatsApp,Referral]}`, `row added -> true`, `stage after reload -> Won`, and `scrollWidth 375 = clientWidth 375` on `/demo/customers`, `/demo` and `/` (sideways scroll 0px, was 180px)
