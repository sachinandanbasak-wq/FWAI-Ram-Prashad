# PRD — Defence Contract Consultant CRM

**Status: DRAFT for approval.** This document answers: *what are we building, for whom, and what does "done" mean?*
It fixes the scope and the data, not the technology (see `TECH-STACK.md`).

**Owner:** Ram Prasad, defence contract consultant (trading / marketing intermediary — **not** a manufacturer).
**Currency:** INR (₹), Indian number format (1,25,000 = one lakh twenty-five thousand).
**Dates:** DD-MMM-YYYY. **Timezone:** Asia/Kolkata. **GST:** default 18%, configurable.

---

## 0. How to read this document

- Anything marked **[CONFIRM]** is a business decision not yet made by the owner. The system must ship with it as a **setting** (a value the owner can change on screen), never hard-coded.
- Anything marked **SAMPLE** is placeholder text for demos only. No real prices, part numbers, names or quantities are invented anywhere.
- Section 14 lists everything the finished system must pass before we call it done.

---

## 1. The problem

Defence and government agencies (HAL, BEL, BEML, DRDO and similar) send requirements as RFIs, tenders or enquiries. The owner fulfils them through a network of OEM suppliers and earns a commission from the OEM. Today the work runs on Excel, email and memory.

| What hurts today | What it costs |
|---|---|
| Quotation preparation | 3–4 days |
| OEM communication | 1–10 days |
| Document creation | about a week |
| Follow-ups | 3–4 hours every day |
| History in Excel / email / memory | every new quote starts from scratch |

**Volumes to design for now, with headroom for 5x growth:** 25–30 enquiries/month, ~20 quotations, ~10 orders, 20–25 active orders; up to **500 part numbers per requirement**.

**The central idea: one requirement, one record, one timeline.** The RFI / tender is the root record. Everything hangs off it — OEM sourcing, quote, PO, PDI, delivery, payment, commission.

**The one behaviour the system exists to prevent:** confidently promising the customer a quantity the OEMs have not firmly committed. (See Rule 9.)

---

## 2. Users and roles

Access is enforced **in the database**, not only on screen. Login by email + password (magic link optional). The Owner creates users and changes roles.

| Role | Can do | Cannot do |
|---|---|---|
| **Owner / Management** | Everything. All approvals. Margin, profitability, commission reports. | — |
| **Sales** | Create/edit requirements and draft quotes, assigned accounts only; submit quotes for approval. | See commission % or margin unless explicitly granted. |
| **Operations** | OEM sourcing, material readiness, PDI, delivery tracking, document uploads. | Approve quotes; see margin/commission. |
| **Finance** | Invoices, payments, commission invoices, TDS/GST views. | Approve quotes. |

A user may hold more than one role. An unassigned record is visible to Owner and Finance only.

---

## 3. Non-negotiable rules (the database must enforce these)

1. Every quotation comes from an RFI. No quote without a linked requirement.
2. Every PO maps to an **approved** quotation. No orphan PO — blocked by the database, not just the screen.
3. One requirement has many line items (up to 500). Never one big text box.
4. One PO has many invoices. One invoice has many delivery events.
5. Partial deliveries and partial payments are normal. Balances are always visible.
6. Quantity is tracked end-to-end: requested → quoted → committed → ready → inspected (cleared) → invoiced → delivered → accepted.
7. PDI "offered", "cleared" and "rejected" are three separate numbers.
8. A **firm commitment** is different from an **availability indication** or a **quote indication**. Only firm commitments count towards coverage.
9. The team must not be able to confidently commit a quantity the OEMs have not covered. Uncovered quantity shows a clear warning and **blocks "Submit quote"** unless the Owner approves with a written reason.
10. Commission follows an OEM-payment milestone. A commission invoice can be raised only after that milestone is reached.
11. Loss reasons are structured (dropdown), never free text only.
12. Document expiry is tracked and reminded.
13. Every material change is audited: what, old → new, who, when.
14. A failed or held PDI **blocks dispatch** and **locks invoice creation** until approved.

Additional database constraints: foreign keys everywhere; delivered ≤ invoiced ≤ cleared ≤ ready ≤ committed unless the Owner overrides with a reason; no hard deletes of business records (cancel/archive with reason instead).

---

## 4. Scope — the ten modules

Modules 1, 2 and 3 are the priority.

### Module 1 — Requirement / RFI / Tender (the root record)

**Header fields:** RFI tracking number (auto, e.g. `RFI/2026-27/0001`), project name, customer name → division → sub-division (from Customer Master), source of enquiry (GeM / client portal / direct / through OEM / through primary client), tender/enquiry reference number, GeM tender number (if any), received date, **submission deadline**, quotation validity required, bid type (single/double), submission type (hard/soft/both), staggered delivery (Y/N), approvals required (RCMA / CEMILAC / DGQA / LCSO / MIL / None — multi-select), assigned employee, remarks and internal discussion notes (these notes carry forward to Quote and PO), documents (RFQ, tender, drawings, technical specs — upload with **version history**).

**Line items (up to 500):** line number, part description, customer part number, OEM part number, quantity, **unit of measure per line** (Nos / Mtrs / Kg …), required delivery date, technical specification. Beside each line show "any current order or quotation pending against this part".

**Fast entry:** bulk paste from Excel, CSV import, editable grid, filter/sort/search within lines.

**Statuses:** Received → Qualifying → Quoted → Submitted → Won / Lost / Cancelled, plus **Pass** (decided not to bid). [CONFIRM] whether "Pass" is a status or a loss reason. If Pass: record reason and **regret letter date**.

**Alerts:** reminders before submission deadline (7 / 3 / 1 day, configurable) to the assigned employee and the Owner.

### Module 2 — OEM Master and Sourcing

**OEM record:** name, country of origin, brand/product category, product portfolio; multiple contacts (name, email, phone, role); capabilities, MOQ rules, typical lead time, pricing validity rules, freight terms, warranty terms, payment terms; **commission %** (per OEM, optional per-product override); standard price and currency; compliance certifications (RCMA / CEMILAC / DGQA / LCSO / MIL) with certificate number, issue date, **valid till**; approved / not-approved flag (**changing it needs an approval**); past performance auto-built (on-time delivery %, PDI pass %, response time, quotes won); NDA/agreement status, GST number, vendor code.

**Sourcing from a requirement:** for each line or the whole requirement the system **suggests** OEMs that supply that product, ranked by approved status, valid certificates, lead time, past performance. The user shortlists; **the system never selects an OEM by itself — a human approves the selection.** Per shortlisted OEM record: request sent (date, method), response received (date), response type, quoted price, lead time, quantity indicated, validity, attached files. An "OEM responses pending" counter and overdue reminders (no response in X days, configurable).

### Module 3 — Quantity coverage (the hard part)

Per line item:

| OEM | Type | Quantity | Date |
|---|---|---|---|
| OEM A | Firm commitment | 600 | … |
| OEM B | Firm commitment | 400 | … |
| OEM C | Availability indication only | 500 | … (not counted) |

Required 1,000, Covered 1,000, Uncovered 0.

- Entry type is `Firm commitment` / `Availability indication` / `Quote indication`. Only firm counts as covered. Indications show in grey with a clear label.
- Many OEMs and many **tranches/shipments** can cover one line, each with quantity and committed date.
- Show Required, Covered (firm), Indicated (not firm), Uncovered balance per line and per requirement, colour-coded: Fully covered / Partly covered / Not covered.
- **OEM capacity:** [CONFIRM] global vs per-order. Build as a setting: *Global capacity (default)* / *Per order*. Example: OEM A can supply 1,000, 700 already committed elsewhere → show only **300 available**. Capacity may have a time window.
- A commitment can be edited only with a logged reason. Withdrawn commitments stay in history.
- **Quantity lifecycle ledger per line:** Requested → Quoted → Committed → Ready → Inspected/Cleared → Invoiced → Delivered → Accepted, each with its balance, on one screen.

### Module 4 — Quotation and bid intelligence

**Built from the requirement:** auto-number ([CONFIRM] format; example `IB/01/Sep-26`), linked RFI, version number, date, validity; per line: OEM, quantity, OEM price, freight, taxes (GST), delivery terms (Ex-works / CIF / FOB / FOR), lead time, payment terms, discount, **target margin**, **recommended price** (a suggestion only); currency INR/USD/EUR with a manual exchange-rate field; margin shown only to Owner and permitted roles; technical compliance Y/N; commercial compliance Y/N.

**Price Negotiation Committee (PNC):** status, date, and price rounds — 1st rate → 2nd rate → price after PNC → final PO price. Competitor details and discounts tracked here.

**Versions** with side-by-side comparison. **Approval workflow before submission** (Sales prepares → Owner approves). **PDF quotation** from a template (logo, terms). Email sending is user-triggered.

**Comparable past bids panel, shown BEFORE pricing** for the same/similar part, OEM or customer: past quote date, quoted price, quantity, won/lost, winning or losing price, competitor, OEM used, margin, lead time. If none: show "No comparable history found" — never a blank panel.

**The system must not calculate or auto-set the final bid price.** It shows a recommended price and the numbers behind it, nothing more.

### Module 5 — Government response and follow-up

**Post-submission states:** Submitted → Clarification requested → Technical clarification → Commercial negotiation → Awaiting approval → Won / Lost / Cancelled.

Log each clarification: date, who asked, what, due date, reply, documents.

**Automatic follow-up tasks (rules configurable by Owner):** no response 7 days after submission; a document requested; quote validity expiring in X days; clarification due date approaching. Task list with owner, due date, status, snooze. A **Lost** opportunity requires a structured loss reason (Module 9).

### Module 6 — Order and PO

**"Convert to Order"** exists only on an **approved** quote. Full history (RFI, notes, documents, OEM responses, quote versions) travels with the order.

**PO fields:** client PO number, PO date, linked quotation, customer, OEM selected, supplier (OEM) PO number, product/part, quantity, unit price, PO value, taxes, delivery schedule/deadline, partial delivery allowed (Y/N), PDI required (Y/N), PDI mode (VC / physical), PDI inspector (OEM side and client), documentation required, special conditions, warranty, payment terms, status (Open / Processing / Completed), PO copy upload.

**PO amendment tracking** (version history). Compliance, inspection and PDI requirements captured here. **Multi-part shipment and backorder tracking.** [CONFIRM] whether one quote can produce several POs (default: generally one PO per quotation, many lines allowed).

### Module 7 — Fulfilment, material readiness, PDI and delivery

**Timeline per order** (each step has owner, expected date, actual date): OEM PO placed → Production started → Production done → PDI scheduled → PDI passed → Government inspection → Dispatch → Delivered → Accepted.

**Material readiness** (for critical/delayed dispatches): quantity ready, manufacturing status (In production / Ready), internal QC status, batch number, serial numbers, tentative PDI date.

**PDI / inspection** (separate record linked to PO and item): type (Physical / VC / third-party), agency (DGQA / client / internal), date, inspector; **quantity offered, cleared, rejected**, rejection reason, re-PDI required; test certificates and compliance documents as a mandatory checklist; status Pending / Passed / Failed; **dispatch clearance Approved / Hold**. Failed or held PDI **blocks dispatch and blocks invoice creation**.

**Delivery:** delivery reference, linked invoice, date, location, quantity delivered, status (In transit / Delivered), GRN number, material acceptance (Accepted / Rejected), signed POD upload, closure status. **Pending balance always visible; auto-close when fully delivered.**

**Delivery-risk flag:** compare expected completion against the committed deadline → Green / Amber / Red with the reason. Thresholds are settings. [CONFIRM] the amber threshold (e.g. 15 days to deadline with a step still pending).

### Module 8 — Invoices, payments, commission and documents

**[CONFIRM] the money flow before building.** Default (from the Odoo sheet) — OEM invoices the customer after PDI approval → customer pays the OEM → the consultant raises a **commission invoice** to the OEM within 7 days of OEM receipt. Invoice parties stay configurable.

**Invoice:** number, date, linked PO and PDI, quantity (full/partial), balance quantity, net, GST, gross, dispatch date, LR/AWB, courier, e-way bill, documents submitted, payment due date, status (Raised / Submitted / Approved / Paid). **Invoice creation only after approved PDI** (Rule 14).

**Payment tracking:** reference, amount received, balance outstanding, date, mode (RTGS / NEFT / Wire), proof (UTR / SWIFT copy), **deductions** (TDS, LD / liquidated damages, GST on LD), overdue days, follow-up status, status (Pending / Partial / Completed). Due-date reminders, overdue alerts, aging (0–30 / 31–60 / 61–90 / 90+), escalation.

**Commission:** commission % mapped OEM-wise, auto-calculated on base invoice value. Commission invoice: number, linked OEM invoice, base amount, commission amount, GST, TDS deducted (Y/N), due date, payment status, outstanding. **Raised only after the OEM payment milestone.** [CONFIRM] exactly when commission is "earned".

**Document and compliance vault:** document type, supplier (OEM) or customer, issue date, **expiry date**, linked product and requirement, file, status. Expiry reminders at 90 / 60 / 30 days (configurable). Approved item lists renew every 3–5 years: certificate number, validity, validity extensions, "to apply for renewal by" date, renewal number/date/valid-till. Approval workflow for documents. **Not a generic document generator.**

### Module 9 — Search, history and losses

**One search box** across all history: requirement, part number, OEM, customer, quote, PO, notes. A comparable-requirement search shows past OEM, price, delivery time, margin, documents, problems, outcome.

**Structured loss reasons** (starting list, editable in settings, [CONFIRM] actual labels): Price / Technical non-compliance / Delivery timeline / Competitor preference / Quantity or capacity / Cancelled / Not pursued / Other (free text required). Capture winning competitor and winning price when known. "Why did we lose?" report by reason, customer, OEM, product, month.

### Module 10 — Dashboard and plain-language questions

**Morning view (one screen):** open orders by stage; quotes awaiting response; orders at delivery risk (Red/Amber); payments pending/overdue; OEM responses pending; documents expiring soon; follow-up tasks due today; commission receivable.

**KPIs / reports:** tender conversion ratio, average quotation turnaround, delivery adherence, payment collection cycle, commission recovery time, OEM performance, client repeat business, employee closure rate, won vs lost, revenue by client/OEM/product, monthly trend, margin, GST summary, TDS summary, profitability, employee performance.

**"Ask in plain language" box.** It must answer e.g. "How many orders are there?", "How many contracts did we win this month?", "What did we lose?", "Why did we lose them?"

**How it is built safely:** answers come only from stored data through fixed, read-only, tested queries. The language model picks the right query and fills dates/filters; it **does not write free-form facts**. Every answer shows the number, the period used, and a link to the records behind it. If the question cannot be answered from the data: *"I can't answer that from the data stored."* Never guesses. Sales cannot ask for commission or margin figures.

---

## 5. Screen-level requirements

- **Requirement page = the hub.** Tabs: Overview, Line items, OEM sourcing, Coverage, Quote, Response, Order, Fulfilment, Payments, Documents, Notes, History. A **timeline** on the right shows every event.
- Notes and attachments entered at RFI stage remain visible at Quote and PO stage.
- **Fast entry** for the 500-line grid: keyboard friendly, paste from Excel, filter, sort, save draft.
- **Mobile-friendly** for dashboard, tasks and PDI updates. Desktop-first for data entry.
- **Separate three states on every screen** so nobody confuses them:
  1. **Missing** — data not entered yet (e.g. "No OEM response yet").
  2. **Empty** — nothing exists (e.g. "No orders this month").
  3. **Failed** — something went wrong (e.g. "Could not load, try again").
- Plain-English labels, no technical jargon on screen. Consistent colours: green = on track, amber = at risk, red = late/blocked, grey = indication only.

---

## 6. Data model (relationships the build must respect)

```
Customer ──< Requirement (RFI) ──< RequirementLine
                  │                     │
                  │                     ├──< OEMRequest/Response (per OEM, per line)
                  │                     ├──< QuantityCommitment (OEM, type, qty, tranche)
                  │                     └──< QuoteLine
                  ├──< Quotation (versions) ──< QuoteLine
                  └──< FollowUpTask / Clarification

Quotation (approved) ──1:N──> PurchaseOrder ──< POLine
PurchaseOrder ──< MaterialReadiness ──< PDI (offered/cleared/rejected)
PurchaseOrder ──< Invoice ──< Delivery (many deliveries per invoice)
Invoice ──< Payment (partial payments, deductions)
Invoice ──< CommissionInvoice (after OEM payment milestone)

OEM ──< OEMContact, OEMCertificate, OEMProduct (price, lead time, capacity)
Document (type, expiry, linked to OEM / product / requirement / PO)
AuditLog (entity, id, field, old, new, user, time)
Approval (entity, id, requester, approver, decision, comment, time)
```

**Product / Part Master:** client part number and OEM part number, description, HSN code, OEM mapping, UoM, category, technical specifications, compliance certifications, standard price.

**Competitor data:** competitor name, quoted prices, wins/losses.

**Constraints live in the database:** foreign keys; a PO must reference an *approved* quotation; quantity sums cannot exceed their parent (delivered ≤ invoiced ≤ cleared ≤ ready ≤ committed) unless the Owner overrides with a reason.

---

## 7. Status flows

| Record | Flow |
|---|---|
| Requirement | Received → Qualifying → Quoted → Submitted → Won / Lost / Cancelled (+ Pass) |
| Government response | Submitted → Clarification requested → Technical clarification → Commercial negotiation → Awaiting approval → Won / Lost / Cancelled |
| Quote | Draft → Pending approval → Approved → Submitted → Revised (new version) |
| PO | Open → Processing → Completed |
| PDI | Pending → Passed / Failed (→ Re-PDI) |
| Invoice | Raised → Submitted → Approved → Paid |
| Payment | Pending → Partial → Completed |
| Delivery | In transit → Delivered → Accepted / Rejected → Closed |

---

## 8. Automations and reminders (all configurable by Owner)

Auto numbering (RFI, quotation, material readiness, PDI, delivery, payment, commission invoice); submission-deadline and quote-validity reminders; "no response in 7 days" and OEM-response-overdue tasks; daily delivery-risk recalculation; payment due/overdue reminders and escalation; document and certificate expiry reminders. Email (in-app + email) is the baseline; WhatsApp is optional/later.

---

## 9. Reports and exports

Sales by client / OEM / product / month / year; pending quotations; PO tracking; delivery status; PDI status; invoice aging; outstanding payments; follow-up tracker; commission receivable; margin; GST summary; TDS summary; profitability; won vs lost with reasons. **Excel export on every list and report.** PDF for quotations and selected reports.

---

## 10. Excel import (the history is in Excel)

An **import wizard**: upload → map columns → **preview with errors flagged** → confirm. Never import silently. Every imported record is tagged with its source file and row so it can be traced.

**Honest data warning:** the supplied files are mostly **empty templates with sample rows** ("OEM A", "P1", quantity 123). **Do not build quote comparison or win/loss analytics on assumed data.** Import real history only after the owner confirms which columns are reliable. **[CONFIRM]** which columns are trustworthy; analytics run only on columns marked trusted.

Source files: Enquiries 26-27, Quotation 26-27, Orders 26-27, Sales 26-27, Payments 26-27, Master list of Approvals, Master list of OEM, Master list of Customers, Odoo Order Management sheet (field spec).

---

## 11. Integrations

| Baseline | Later / optional |
|---|---|
| Email send (quote, reminders) | WhatsApp notifications |
| PDF generation | GeM portal support (if feasible) |
| Excel import and export | Tally / GST tool export |
| Cloud file storage | Calendar sync for PDI dates |

---

## 12. Settings (every [CONFIRM] item ships as a configurable setting)

| # | Setting | Default until the owner decides |
|---|---|---|
| 1 | Company / brand name for screens and PDFs | Empty, shows "Company name not set" until entered |
| 2 | OEM capacity model | **Global capacity** (switch to per-order) |
| 3 | Money flow (who invoices whom, when commission is earned) | OEM invoices customer → customer pays OEM → commission invoice to OEM after OEM payment received |
| 4 | "Pass" handling | A separate requirement status, with reason + regret letter date |
| 5 | Loss-reason labels | Price / Technical non-compliance / Delivery timeline / Competitor preference / Quantity or capacity / Cancelled / Not pursued / Other — editable list |
| 6 | Quotation number format | `IB/NN/MMM-YY` with a live preview; editable pattern |
| 7 | Approval thresholds (quote value → approver) | Owner approves all quotes |
| 8 | Reminder days | Submission 7/3/1; expiry 90/60/30; no-response 7; OEM overdue 7 |
| 9 | Delivery-risk amber threshold | Amber at ≤15 days to deadline with a step still pending; Red when past/predicted late |
| 10 | GST rate | 18% |
| 11 | One quote → many POs? | No (one PO per quotation, many lines) |
| 12 | Trusted Excel columns | None until marked trusted |

---

## 13. Out of scope (do not build)

- No automatic legal or compliance judgement.
- No automatic final bid price (recommendation only).
- No OEM chosen without human approval.
- Not a full accounting/ERP replacement; not a GST filing tool (reports only).
- Not a generic document generator (only quotation PDF, commission invoice PDF and listed templates).
- No GeM portal automation, no auto-messaging as baseline. Email sending is user-triggered. Manual GeM number entry only.

---

## 14. Acceptance tests (must all pass)

1. Create a requirement with **500 lines** by pasting from Excel; filter and edit without lag.
2. Line needs 1,000. OEM A firm 600 + OEM B firm 400 → Covered 1,000, Uncovered 0.
3. Add OEM C *availability 500* → coverage unchanged (still 1,000; indication greyed).
4. Reduce OEM B to 300 → Uncovered 100, warning, "Submit quote" blocked without Owner override + reason.
5. OEM A capacity 1,000 and 700 committed on Order X → the new requirement shows **300 available** (global mode).
6. Quote without RFI → blocked. PO without approved quote → blocked.
7. Price screen → comparable past bids shown first; with no history → "No comparable history found".
8. Quote v2 supersedes v1; both viewable; approval required before submission.
9. 7 days after submission with no reply → follow-up task created automatically.
10. PO of 1,000: PDI offered 400, cleared 350, rejected 50 → only 350 invoiceable; failed PDI blocks dispatch.
11. One PO → 3 invoices; one invoice → 2 deliveries; balances correct at every level.
12. Invoice ₹10,00,000, payments ₹4,00,000 + ₹5,00,000 with ₹50,000 TDS and ₹50,000 LD → balance ₹0, status Completed.
13. Commission invoice cannot be raised until the OEM payment milestone is marked.
14. Expected finish after committed deadline → Red delivery risk on the dashboard.
15. Certificate expiring in 60 days → appears in "Documents expiring" and a reminder is sent.
16. Mark a quote Lost without a reason → blocked. With reason → appears in the "why did we lose" report.
17. "How many contracts did we win this month?" → correct number with period and list link. A question not in the data → "I can't answer that from the data stored."
18. Sales user cannot see margin or commission. Audit log shows who changed a price and when.

---

## 15. Open questions the owner must answer

The system ships with the Section 12 defaults so work is not blocked. Each answer changes a setting, not the architecture.

1. Business/brand name for screens and PDFs (and whether any of Inverbrass / Supreme Q / GAPL / IBEL may be used).
2. OEM capacity: global or per order? What is the capacity time window?
3. Confirm the money flow with one real transaction, and exactly when commission is earned.
4. What consumes the document week: generated from data, reused, obtained from OEM, or hand-prepared?
5. Which Excel columns are trustworthy enough for quote comparison and win/loss analytics?
6. Exact quotation number format; and is "Pass" a status or a loss reason? Regret letter handling?
7. Approval thresholds: who approves which quote value?
8. Delivery-risk amber threshold.

---

## 16. Roadmap (phases)

| Phase | Scope | Result |
|---|---|---|
| 1 | Login, roles, Customer/OEM/Product masters, Requirement + line items, Excel import | Every enquiry captured in one place |
| 2 | OEM sourcing + quantity coverage (firm vs indication, capacity) | The hard part works |
| 3 | Quotation versions, approvals, comparable past bids, PDF, loss reasons | Faster, history-driven quoting |
| 4 | Government response states, follow-up tasks, reminders | No more manual chasing |
| 5 | Order/PO, material readiness, PDI, delivery, risk flags | Full fulfilment tracking |
| 6 | Invoices, payments, commission, document vault + expiry | Cash and compliance under control |
| 7 | Dashboard, KPIs, reports, plain-language questions, global search, audit views | Management view |

A detailed, step-by-step `IMPLEMENTATION-PLAN.md` is written **after** approval of this PRD and `TECH-STACK.md`.

---

## 17. Definition of done

All Section 3 rules enforced in the database; all Section 14 tests passing; data persists after refresh and redeploy; roles verified; audit trail verified; no invented data anywhere; every [CONFIRM] item either answered or visibly set as a configurable default.

---

## 18. Assumptions

- One requirement can produce several quotations (versions) but only an approved quote can produce a PO.
- A requirement has one assigned employee; records can be reassigned with an audit entry.
- "Firm commitment" is a statement from an OEM that it will supply a stated quantity by a stated date; anything softer is an indication and does not count.
- Commission is a percentage of the base invoice value, per OEM, with optional per-product override.
- The system stores money to paise; GST and TDS are calculated on stored values and stored, not re-derived on display.
- All amounts are INR unless a quotation line explicitly carries a foreign currency and a manual exchange rate.
