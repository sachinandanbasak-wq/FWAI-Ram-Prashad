# TECH-STACK — Defence Contract Consultant CRM

**Status: DRAFT for approval.** This document answers one question: *what do we build it with, and why that?*
It takes `PRD.md` as the requirement and assumes the volumes stated there (25–30 enquiries/month, ~25 active orders, up to 500 lines per requirement, designed for 5x growth).

---

## 0. Size first (do this before believing any architecture)

The real numbers decide what is over-engineering.

- **Users:** under 20 people across four roles. A handful online at once.
- **Scale:** 5x growth ≈ 150 enquiries/month, ~50 active orders. Even 10 years of history is tens of thousands of requirement lines, not billions. Text and numbers only.
- **Storage:** tenders, drawings, certificates and PODs are the only large items — gigabytes over years, not terabytes.
- **Read/write pattern:** read-heavy dashboards and lists, occasional writes. Reminders run once a day. No streaming, no heavy compute.
- **The hard part is correctness** — quantity coverage, money, dates, permissions — **not scale.** Every "big company" tool below (queues, caches, sharding, microservices, an event bus) is rejected because this size does not create the problem it solves.

**Consequence:** pick the cheapest stack that makes the hard part hard to get wrong. Put the rules in the database so they cannot be bypassed by a screen bug.

---

## 1. Recommendation in one line

**Next.js + TypeScript on Vercel, Supabase (Postgres + Auth + Storage + scheduled jobs), email via Resend, PDF via server-side HTML-to-PDF.** All on free/low tiers to start; each piece has a paid step that is a setting, not a rewrite.

---

## 2. Front end — the screens

**Choice: Next.js (React) + TypeScript, App Router.**

Constraint that forced it: the Requirement hub is a heavy interactive screen (500-row grid, filters, tabs, a right-hand timeline) **and** it needs server-side logic for permissions and rules. One framework gives us both, plus the deploy.

Rejected alternatives:
- *Lovable / v0 / no-code builders* — very fast for a demo, but the coverage rules, database constraints and role security this brief demands are exactly what those tools fight. Good for the prototype of Module 1; not for the enforced rules.
- *Plain HTML + jQuery* — cannot carry a 500-row editable grid or live totals without a lot of pain.
- *A separate React SPA + a separate API server* — two things to build and deploy for no benefit at this size.
- *SvelteKit / Remix* — capable and arguably nicer; rejected only because Next.js has the broadest free hosting path and the most available help. A tie broken on the free tier.

UI building blocks: **Tailwind CSS** for styling, **TanStack Table** (or AG Grid Community) for the 500-line grid, **React Hook Form + Zod** for validated forms (Zod schemas mirror the database constraints).

---

## 3. Database and rules — the most important decision

**Choice: PostgreSQL, hosted on Supabase, with row-level security (RLS) by role.**

PostgreSQL is chosen because the brief's hardest requirements are *database* requirements:
- **Foreign keys** so a PO cannot exist without an approved quotation.
- **CHECK constraints and triggers** so `delivered ≤ invoiced ≤ cleared ≤ ready ≤ committed`, so PDI offered/cleared/rejected stay consistent, and so a commission invoice cannot be raised before the OEM payment milestone.
- **Views** for the per-line coverage ledger (required / covered / indicated / uncovered) and the quantity lifecycle, so every screen reads the same truth.
- **Transactions** so multi-row updates (e.g. editing a commitment with a reason) are all-or-nothing.

Row-level security is what makes "enforced in the database, not only on screen" true: a Sales user's database session simply cannot read margin or commission columns, even if a future screen has a bug.

Supabase vs the alternatives:
- **Supabase** — Postgres, Auth, Storage and scheduled jobs in one place, generous free tier, RLS built in. **Recommended.**
- **Neon (Postgres) + a separate auth provider (e.g. Clerk) + separate file storage** — excellent Postgres, but you assemble three vendors and pay three bills for the same result.
- **Firebase / Firestore** — fast to start, but it is not relational and does not express the foreign-key and sum constraints this brief depends on. Rejected on correctness grounds, not on quality.

---

## 4. File storage

**Choice: Supabase Storage**, with private buckets and signed, time-limited links.

Constraint: certificates, tenders, drawings and PODs are sensitive and some are customer-visible. Files must never be public by guessable URL, and access must follow the same role rules as the database. Supabase Storage integrates directly with the same auth and RLS.

Rejected: putting files in the database (bloats backups); a public S3 bucket (wrong default for defence documents).

**Version history** for requirement documents is modelled in the database (each upload is a new row with a version number); the file itself sits in Storage.

---

## 5. Background jobs (reminders and daily recalculation)

**Choice: Supabase scheduled jobs (`pg_cron` + Edge Functions) running daily, plus an in-app task list.**

Constraint: reminders (deadline 7/3/1, document expiry 90/60/30, no-response 7 days, payment overdue) and the delivery-risk recalculation must run even when nobody has the app open, and must be reliable and logged.

Rejected: browser timers (only fire when a page is open); a full queue system like Redis/BullMQ (no queue-scale problem exists here, and it adds a server to run).

Every reminder creates **both** an in-app task and an email, so nothing is missed if an email bounces. Rules and day-counts are settings (PRD §12).

---

## 6. Email

**Choice: Resend** (transactional email), sending only on user action (quotation send, reminder, escalation).

Constraint: quotation emails and reminders must arrive reliably and be traceable (sent / failed), while the brief explicitly excludes auto-messaging. Resend has a simple API and a usable free tier.

Rejected: sending from a personal Gmail account (not traceable, poor deliverability); WhatsApp Business API (explicitly "later / optional", and it needs a business verification cycle we should not block Phase 1 on).

---

## 7. PDF generation

**Choice: server-side HTML-to-PDF** (a print stylesheet rendered by a headless browser, e.g. Puppeteer/Playwright, or a hosted render service).

Constraint: the quotation PDF and commission-invoice PDF must be branded (company name/logo from settings), paginate cleanly for 500 lines, and be reproducible from stored data. HTML+CSS is the easiest way to design a template that a non-programmer can tweak, and it keeps Indian number formatting consistent with the screens.

Rejected: a client-side JS PDF library (font/₹ formatting and pagination problems); a Word/Excel template engine (the brief says not a generic document generator).

---

## 8. Excel import and export

**Choice: `xlsx` (SheetJS) on the server** for both import and export.

Constraint: the import wizard needs upload → map columns → preview with flagged errors → confirm, and the history lives in `.xlsx` files. Every list/report needs an Excel export.

The wizard **never imports silently** (PRD §10): rows with errors are shown and held back; good rows can be committed and tagged with source file + row number. Analytics only run on columns the owner marks "trusted".

---

## 9. Deployment, secrets and persistence

- **Vercel** hosts the Next.js app: preview URL on every change, production on merge.
- **Supabase** hosts the database, auth and files. Data lives in Postgres, so it survives a refresh, a redeploy and a browser change. **No business data is kept only in the browser.**
- Every secret (database service key, email key) lives in **server-side environment variables** (Vercel + local `.env.local`, which is git-ignored). Only public keys ever reach the browser.
- The database schema and all rules ship as versioned SQL migrations in the repo, so the rules are reviewable and reproducible.

---

## 10. The plain-language question box — kept safe

**Choice: a small set of fixed, read-only, tested SQL views/functions, with an LLM only choosing which one to run and filling the dates.**

Constraint (from the brief): the assistant must never invent facts. So the model does **not** write SQL and does **not** phrase its own numbers. It maps a question to one of a fixed catalogue of queries, passes validated filter values, and returns the number plus the period plus a link to the matching records. Unmatched questions get the fixed reply *"I can't answer that from the data stored."* Role rules (Sales cannot ask for margin/commission) are enforced by the same RLS the screens use.

---

## 11. MVP vs production — what is a setting and what is a rewrite

| Concern | MVP | Production step | Setting or rewrite? |
|---|---|---|---|
| Database | Supabase free tier | Paid tier when storage/compute grows | Setting / plan change |
| Auth | Email + password | Add magic link, 2FA | Setting |
| Email | Resend free tier | Verified domain, higher quota | Setting |
| PDF | Local headless render | Hosted render service if serverless limits bite | Setting |
| Jobs | `pg_cron` daily | More frequent or per-event jobs | Setting |
| Files | Supabase Storage | Lifecycle/archival rules | Setting |
| Frameworks | Next.js, Postgres, Tailwind | unchanged | — |

No architectural decision here needs to be undone at this size; the expensive choices (database, auth, hosting) are all one config change away from a bigger plan.

---

## 12. What was deliberately not chosen, and why

- **No microservices / Kubernetes / message queue** — no scale problem to solve.
- **No Redis cache** — the data is small and Postgres is fast enough; a cache adds a staleness bug against the "always show the true balance" rule.
- **No offline-first / local-only storage** — the brief requires persistence server-side and shared roles.
- **No mobile app** — the brief asks for mobile-friendly *viewing* of dashboard/tasks/PDI; a responsive web app covers it.
- **No automatic GeM portal integration** — explicitly out of scope.

---

## 13. Cost shape (indicative, to be confirmed at build time)

Free tiers cover development and early production. The first real costs appear only with growth: Supabase paid tier (storage/compute), a verified email domain, and Vercel Pro if team features are needed. Because the design is standard Postgres + Next.js, there is no vendor lock that forces a rebuild.

---

## 14. Open technical questions for the owner

These do not block the PRD but should be answered before Phase 1 lock-in:

1. **Company name and logo** for screens and PDFs (default: blank until entered).
2. **Who will run the deploy** — Vercel/Supabase accounts under whose login, and who holds the keys.
3. **Email "from" address** and domain for quotation sending.
4. **Where the real Excel history lives**, and which columns are trusted (feeds the import wizard).
