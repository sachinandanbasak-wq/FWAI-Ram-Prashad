-- 0004_requirements.sql — the root record: Requirement / RFI / Tender, and its lines.
--
-- The RFI is the hub. Everything else (sourcing, coverage, quote, PO, PDI,
-- delivery, payment, commission) hangs off it. Rules enforced here:
--   * rfi_number is unique and not blank
--   * status is one of the agreed flow
--   * a line's quantity is greater than zero
--   * line numbers are unique within a requirement
--   * documents/notes are fields on the record, not a free-text dump
--
-- STATUS: applied and verified with scripts/test-rules.mjs.

create table if not exists public.requirements (
  id                     uuid primary key default gen_random_uuid(),
  rfi_number             text not null unique check (char_length(btrim(rfi_number)) > 0),
  project_name           text,
  customer_id            uuid references public.customers (id) on delete set null,
  source_of_enquiry      text check (source_of_enquiry is null or source_of_enquiry in
                           ('GeM', 'Client portal', 'Direct from customer', 'Through OEM', 'Through primary client')),
  tender_reference       text,
  gem_tender_number      text,
  received_date          date,
  submission_deadline    date,
  quotation_validity_days integer check (quotation_validity_days is null or quotation_validity_days >= 0),
  bid_type               text check (bid_type is null or bid_type in ('Single bid', 'Double bid')),
  submission_type        text check (submission_type is null or submission_type in ('Hard copy', 'Soft copy', 'Both')),
  staggered_delivery     boolean not null default false,
  approvals_required     text[] not null default '{}',
  assigned_employee      uuid references public.profiles (id) on delete set null,
  remarks                text,
  internal_notes         text,
  -- qualification / readiness fields used by the Requirements workspace
  drawing_status         text check (drawing_status is null or drawing_status in
                           ('Drawing received', 'Drawing missing', 'Drawing pending')),
  technical_requirement  text,
  missing_information    text,
  approval_status        text,
  compliance_status      text check (compliance_status is null or compliance_status in
                           ('Compliant', 'Review pending', 'Blocked', 'Not assessed')),
  status                 text not null default 'Received' check (status in
                           ('Received', 'Qualifying', 'Quoted', 'Submitted', 'Won', 'Lost', 'Cancelled', 'Pass')),
  pass_reason            text,
  regret_letter_date     date,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  check (submission_deadline is null or received_date is null or submission_deadline >= received_date)
);

create table if not exists public.requirement_lines (
  id                      uuid primary key default gen_random_uuid(),
  requirement_id          uuid not null references public.requirements (id) on delete cascade,
  line_number             integer not null check (line_number > 0),
  part_description        text not null check (char_length(btrim(part_description)) > 0),
  client_part_number      text,
  oem_part_number         text,
  quantity                numeric(14,3) not null check (quantity > 0),
  uom                     text not null default 'Nos' check (char_length(btrim(uom)) > 0),
  required_delivery_date  date,
  technical_specification text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (requirement_id, line_number)
);

create index if not exists requirement_lines_requirement_idx on public.requirement_lines (requirement_id);
create index if not exists requirements_status_idx on public.requirements (status);
create index if not exists requirements_deadline_idx on public.requirements (submission_deadline);

-- One row per requirement for list screens, carrying the first line's part
-- details. security_invoker makes the view obey the caller's row-level security.
create or replace view public.v_requirement_overview
with (security_invoker = true) as
select
  r.id,
  r.rfi_number,
  r.project_name,
  r.status,
  r.drawing_status,
  r.technical_requirement,
  r.missing_information,
  r.approval_status,
  r.compliance_status,
  r.approvals_required,
  r.submission_deadline,
  r.received_date,
  r.assigned_employee,
  r.created_at,
  l.client_part_number  as primary_part_number,
  l.part_description    as primary_part_description,
  l.technical_specification as primary_technical_specification,
  l.uom                 as primary_uom,
  l.quantity            as primary_quantity,
  c.name                as customer_name,
  (select count(*) from public.requirement_lines rl where rl.requirement_id = r.id) as line_count
from public.requirements r
left join public.customers c on c.id = r.customer_id
left join lateral (
  select * from public.requirement_lines rl
  where rl.requirement_id = r.id
  order by rl.line_number asc
  limit 1
) l on true;

-- Audit + updated_at
drop trigger if exists audit_requirements on public.requirements;
create trigger audit_requirements after insert or update or delete on public.requirements
  for each row execute function public.audit_row_change();

drop trigger if exists audit_requirement_lines on public.requirement_lines;
create trigger audit_requirement_lines after insert or update or delete on public.requirement_lines
  for each row execute function public.audit_row_change();

drop trigger if exists touch_requirements on public.requirements;
create trigger touch_requirements before update on public.requirements
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_requirement_lines on public.requirement_lines;
create trigger touch_requirement_lines before update on public.requirement_lines
  for each row execute function public.touch_updated_at();

-- RLS: read for any signed-in user; write for Owner and Sales.
alter table public.requirements enable row level security;
alter table public.requirement_lines enable row level security;

drop policy if exists requirements_read on public.requirements;
create policy requirements_read on public.requirements for select to authenticated using (true);
drop policy if exists requirements_write on public.requirements;
create policy requirements_write on public.requirements for all to authenticated
  using (public.has_role(array['owner', 'sales']))
  with check (public.has_role(array['owner', 'sales']));

drop policy if exists requirement_lines_read on public.requirement_lines;
create policy requirement_lines_read on public.requirement_lines for select to authenticated using (true);
drop policy if exists requirement_lines_write on public.requirement_lines;
create policy requirement_lines_write on public.requirement_lines for all to authenticated
  using (public.has_role(array['owner', 'sales']))
  with check (public.has_role(array['owner', 'sales']));
