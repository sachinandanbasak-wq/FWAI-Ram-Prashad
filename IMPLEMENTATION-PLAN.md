# IMPLEMENTATION-PLAN — Defence Contract Consultant CRM

**Status: DRAFT for approval.** This document answers: *in what order, and what is demonstrable at each step?*

Inputs: `PRD.md` (what and for whom) and `TECH-STACK.md` (what with). Build order follows PRD §16.

**Two rules stitched into every step:**
1. **A step ends in something you can open and look at** — a screen with a live address, or a command whose real output is pasted into `WORKLOG.md`. "Schema migrated" is not a step outcome; "I created an RFI on screen and saw it persist" is.
2. **A step is not done when it is built.** It is done when it is built **and** tested, with the test written next to the step. Tests are SQL constraint tests, unit tests (Vitest), and end-to-end tests (Playwright). A test that would pass even if the feature were wrong is a wrong test and must be fixed.

---

## Before Phase 1 — decisions and defaults (half a day, no code)

The PRD's [CONFIRM] items do not need a meeting; they need one-line answers. Until then we build the **defaults from PRD §12**, and every one of them is a value in a `settings` table — changing it is an edit, not a rewrite.

| Setting | Default we build with |
|---|---|
| Company name / logo | blank (screens show "Company name not set") |
| OEM capacity model | global |
| Money flow | OEM invoices customer → customer pays OEM → commission invoice to OEM after OEM payment received |
| "Pass" | separate requirement status with reason + regret letter date |
| Loss reasons | the starting list in PRD §4 Module 9, editable |
| Quote number format | `IB/NN/MMM-YY`, pattern editable with live preview |
| Approval threshold | Owner approves all quotes |
| Reminder days | submission 7/3/1, expiry 90/60/30, no-response 7, OEM overdue 7 |
| Delivery-risk amber | ≤15 days to deadline with a step pending |
| GST | 18% |
| One quote → many POs | No |

Also settled here: the **stack accounts** (Vercel, Supabase, Resend) and **who holds the keys**. Scheduled jobs are chosen in Phase 4; RLS from Phase 1.

---

## The engineering spine (created once, in Phase 1, reused by every phase)

- **One Next.js app at the project root** (`defence-crm/`), TypeScript, Tailwind, deployed to Vercel: preview on every push, production on merge.
- **`supabase/migrations/*.sql`** — every table, constraint, trigger, view and RLS policy is a versioned SQL file in the repo. No rules live only in application code.
- **`settings` table + a Settings screen** — every configurable value above is read from here.
- **Audit spine:** an `audit_log` table plus a trigger on each business table writing (entity, id, field, old, new, user, time). Turned on before the first business table is written to.
- **Status colour + three empty states** (Missing / Empty / Failed) are shared UI components used on every screen from the first screen onward.
- **Seed data** lives in `supabase/seed.sql`, every row prefixed `SAMPLE`, and is never mixed with real imports.
- **Test harness** wired up in Phase 1: Vitest for units, Playwright for the golden paths, and a `npm run test:rules` script that proves each database constraint by trying to violate it and expecting failure.

---

# Phase 1 — Capture every enquiry in one place

Maps to acceptance tests 1 and 6 (the RFI half).

### Step 1.1 — Live shell
- **Build:** Next.js app, Vercel pipeline, header, Settings screen (company name), the shared Missing/Empty/Failed state components.
- **See it:** production URL shows the shell; the Settings screen saves a company name and it survives a refresh.
- **Test:** fetch the production URL → `200`; change the company name, reload, value persists.

### Step 1.2 — Auth and roles
- **Build:** Supabase Auth (email + password); roles Owner / Sales / Operations / Finance; RLS policies on a first table; Owner-only user management.
- **See it:** log in as each role; the user menu shows the role.
- **Test:** a Sales session cannot read a row it does not own; a signed-out browser is redirected to login.

### Step 1.3 — Masters: Customer, OEM, Product/Part
- **Build:** CRUD for Customer (name → division → sub-division), OEM (with contacts and certificates), Product/Part (client part no, OEM part no, HSN, UoM, category, specs). SAMPLE seed rows.
- **See it:** each master list with search, add/edit, and Excel export.
- **Test:** creating an OEM with no name is rejected with a reason and saves nothing (edge validation rule).

### Step 1.4 — Requirement header
- **Build:** the RFI record and form with every PRD §4 Module 1 header field; auto-number `RFI/YYYY-YY/NNNN` from a settings pattern; status Received → Qualifying; document upload with version history.
- **See it:** create an RFI on screen, see its number, upload two versions of a document and see both.
- **Test:** two RFIs get sequential unique numbers; a blank submission saves nothing.

### Step 1.5 — Line items (the 500-line grid)
- **Build:** editable line grid (line no, description, customer part no, OEM part no, qty, UoM per line, required delivery date, spec), filter/sort/search, paste-from-Excel, CSV/XLSX bulk import, save draft.
- **See it:** paste 500 lines from a spreadsheet and scroll/filter without lag.
- **Test:** pasting 500 lines creates exactly 500 line rows (count checked in the database); a line with quantity 0 is flagged, not silently saved.

### Step 1.6 — "Pending against this part" + Excel import wizard
- **Build:** beside each line, show any open quotation/order for that part. Import wizard: upload → map columns → preview with flagged errors → confirm, each row tagged with source file + row number. Analytics untouched until columns are marked trusted.
- **See it:** import a real enquiry file, see flagged rows held back, commit the good ones.
- **Test:** a file with a bad date row is previewed as an error and that row is not committed; committed rows carry their source tag.

**Phase 1 done when:** every enquiry can be captured with its lines, documents and notes, by the right role, with the audit log recording creation, and acceptance tests 1 and the RFI half of 6 pass.
**Known gaps after Phase 1:** no sourcing, coverage, quoting, orders, money or dashboard yet. (Those are later phases.)

---

# Phase 2 — The hard part: OEM sourcing and quantity coverage

Maps to acceptance tests 2, 3, 4, 5.

### Step 2.1 — OEM requests and responses
- **Build:** per line (or whole requirement), suggested OEMs ranked by approved status, valid certificates, lead time, past performance. Shortlist, then record per-OEM request sent / response received / response type / price / lead time / quantity indicated / validity / files. Human approves the shortlist — the system never selects.
- **See it:** sourcing tab on the RFI; "OEM responses pending" counter.
- **Test:** no automatic OEM selection occurs; approving a shortlist writes an approval record.

### Step 2.2 — Coverage ledger (firm vs indication)
- **Build:** `quantity_commitment` rows typed Firm commitment / Availability indication / Quote indication. A database view computes per line and per requirement: Required, Covered (firm), Indicated (not firm), Uncovered, with colour status. Indications greyed.
- **See it:** the coverage table on screen; totals update live after each entry.
- **Test:** add 600 firm + 400 firm for a 1,000 line → Covered 1,000, Uncovered 0 (test 2). Add a 500 availability indication → numbers unchanged, indication shown (test 3).

### Step 2.3 — Uncovered-quantity block and Owner override
- **Build:** "Submit quote" blocked when Uncovered > 0; Owner override requires a written reason, recorded in the approval and audit tables.
- **See it:** the warning on screen and the block on the Submit button.
- **Test:** reduce OEM B to 300 → Uncovered 100 and Submit is blocked (test 4). Owner override with reason unblocks and is audited.

### Step 2.4 — OEM capacity
- **Build:** per OEM/product capacity with an optional time window; global (default) or per-order mode from settings. Available = capacity − already committed in the window.
- **See it:** a 1,000-capacity OEM with 700 committed shows 300 available on a new requirement.
- **Test:** the 300-available case (test 5); switching the setting to per-order changes the number.

### Step 2.5 — Commitment edit with reason + quantity lifecycle ledger
- **Build:** editing or withdrawing a commitment requires a logged reason; withdrawn commitments stay in history. The per-line lifecycle ledger (Requested → Quoted → Committed → Ready → Inspected/Cleared → Invoiced → Delivered → Accepted) on one screen.
- **See it:** the ledger on the Coverage tab.
- **Test:** a withdrawn commitment disappears from Covered but remains visible in history with its reason.

**Phase 2 done when:** sourcing and coverage work end-to-end and tests 2–5 pass. **Gap:** quoting still absent.

---

# Phase 3 — Faster, history-driven quoting

Maps to acceptance tests 6 (PO half comes later), 7, 8, 16, 18.

### Step 3.1 — Quote from the requirement
- **Build:** approved quote workflow (Draft → Pending approval → Approved → Submitted), auto-number from the settings pattern, versioning (v1, v2 …), per-line pricing (OEM price, freight, GST, delivery terms, lead time, payment terms, discount, target margin, recommended price), currency + manual exchange rate, technical/commercial compliance flags. Margin visible only to permitted roles.
- **See it:** a quote built from an RFI, with versions side by side.
- **Test:** creating a quote without an RFI is impossible (test 6); Sales cannot see the margin field (test 18a).

### Step 3.2 — PNC and bid intelligence
- **Build:** PNC status/date and price rounds (1st rate → 2nd rate → after PNC → final PO price); competitor details and discounts. The **recommended price is a suggestion only** — the system never sets the final bid.
- **See it:** PNC panel and the comparable-past-bids panel shown **before** pricing.
- **Test:** with no history the panel shows "No comparable history found"; with history it shows price, won/lost, competitor (test 7).

### Step 3.3 — Approval workflow + structured losses
- **Build:** Owner approval before submission, with requester/approver/decision/comment/time. Structured loss reasons (editable list) mandatory for a Lost outcome; winning competitor and price captured when known.
- **See it:** approve a quote; mark one Lost.
- **Test:** Lost without a reason is blocked; with a reason it appears in the "why did we lose" report (test 16). Auditor sees who changed a price and when (test 18b).

### Step 3.4 — Quotation PDF + send
- **Build:** branded PDF from stored data (company name/logo from settings, Indian number format, paginates at 500 lines); user-triggered email send with a sent/failed record.
- **See it:** download the PDF; send it to a test address.
- **Test:** a 500-line quote PDF generates and paginates; the send is logged.

**Phase 3 done when:** quoting, versions, approvals, comparable history, losses and PDF work and tests 6, 7, 8, 16, 18 pass. **Gap:** no post-submission follow-up or orders yet.

---

# Phase 4 — Stop chasing by hand

Maps to acceptance test 9.

- **Step 4.1 — Response states and clarifications:** Submitted → Clarification requested → Technical clarification → Commercial negotiation → Awaiting approval → Won/Lost/Cancelled; log clarifications (date, who, what, due date, reply, documents).
- **Step 4.2 — Follow-up task engine:** the configurable rules (no response 7 days, document requested, validity expiring, clarification due) create a task with owner/due date/status/snooze. Runs on `pg_cron` daily; also listed in-app; optional email.
- **Step 4.3 — Reminders:** submission-deadline (7/3/1) and quote-validity reminders, in-app + email.

**Test (9):** a submitted quote with no reply for 7 days has a follow-up task created automatically.
**Phase 4 done when:** test 9 passes and task rules are editable in Settings.

---

# Phase 5 — Full fulfilment tracking

Maps to acceptance tests 10, 11, 14.

- **Step 5.1 — Convert to Order:** enabled only on an approved quote; the PO record carries the full history; PO amendment versioning; PO status Open → Processing → Completed.
- **Step 5.2 — Material readiness** per order (qty ready, manufacturing status, QC status, batch/serial numbers, tentative PDI date).
- **Step 5.3 — PDI:** separate record linked to PO/item; offered/cleared/rejected as three numbers; rejected reason; re-PDI; certificate checklist; status Pending/Passed/Failed; **dispatch clearance Approved/Hold**.
- **Step 5.4 — Delivery:** one PO → many invoices → many deliveries; delivery reference, GRN, acceptance, POD; pending balance always visible; auto-close when fully delivered.
- **Step 5.5 — Delivery-risk flag:** daily recalculation of expected completion vs committed deadline → Green/Amber/Red with reason; thresholds from settings.

**Tests:** PO without an approved quote is blocked (test 6). PDI offered 400 / cleared 350 / rejected 50 → only 350 invoiceable and a failed/held PDI blocks dispatch (test 10). One PO → 3 invoices → one invoice → 2 deliveries, balances correct (test 11). Finish after deadline → Red (test 14).
**Phase 5 done when:** these pass with the quantity-sum constraints enforced in the database.

---

# Phase 6 — Cash and compliance under control

Maps to acceptance tests 12, 13, 15.

- **Step 6.1 — Invoices:** created only after approved PDI; full/partial quantity; net, GST, gross; dispatch details; status Raised → Submitted → Approved → Paid.
- **Step 6.2 — Payments:** partial payments, deductions (TDS, LD, GST on LD), UTR/SWIFT proof, overdue days, aging buckets (0–30/31–60/61–90/90+), reminders and escalation.
- **Step 6.3 — Commission:** OEM-wise commission %, commission invoice on base value with GST/TDS, raised **only after the OEM payment milestone is marked**; outstanding tracked.
- **Step 6.4 — Document vault + expiry:** document type, party, issue/expiry dates, linked product/requirement/PO, file, status; expiry reminders at 90/60/30 days; certificate renewal tracking (validity extensions, "apply by", renewal number/date/valid-till); document approval workflow.

**Tests:** invoice ₹10,00,000 with ₹4,00,000 + ₹5,00,000 payments, ₹50,000 TDS, ₹50,000 LD → balance ₹0, Completed (test 12). Commission invoice blocked before the milestone (test 13). Certificate expiring in 60 days appears in "Documents expiring" and a reminder is sent (test 15).

---

# Phase 7 — Management view

Maps to acceptance test 17.

- **Step 7.1 — Morning dashboard:** the eight counters from PRD §4 Module 10.
- **Step 7.2 — Reports and KPIs:** conversion ratio, quote turnaround, delivery adherence, collection cycle, commission recovery, OEM performance, repeat business, closure rate, won vs lost, revenue by client/OEM/product, monthly trend, margin, GST, TDS, profitability, employee performance. Excel export everywhere.
- **Step 7.3 — Global search + comparable-requirement history.**
- **Step 7.4 — Plain-language question box:** fixed read-only queries; the model only picks a query and fills dates; every answer shows number + period + record link; unknown questions get "I can't answer that from the data stored." Sales cannot ask margin/commission.
- **Step 7.5 — Audit explorer:** read-only, filterable by record/user/date.

**Test (17):** "How many contracts did we win this month?" returns the right number with period and a list link; a question outside the data returns the fixed refusal.

---

## Cross-cutting verification (runs in every phase)

- `npm run test:rules` — each database constraint proven by attempting a violation and expecting failure.
- `npm run test` — unit tests (money, dates, coverage math, number formatting).
- `npm run test:e2e` — Playwright golden paths per phase.
- `WORKLOG.md` — one line per slice: what I did → the command I ran → what it actually printed.
- `REPORT.md` — status per part with real command output; anything unproven marked `UNVERIFIED`.

## Sequencing note

Phases are ordered so that **Modules 1–3 are usable first** (the brief says they matter most) and later phases depend only on earlier ones. If the build slips, Phases 1–3 still leave a working enquiry-to-quote system. Each phase ends with a demo script, a test checklist and a known-gaps list, and I ask before moving to the next phase.
