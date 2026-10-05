-- 0003_masters.sql — Customer, OEM and Product/Part masters.
--
-- These are the tables every requirement will point at. The rules that matter
-- are enforced here, in the database, not only on screen:
--   * a name/description of only spaces is rejected (CHECK + btrim)
--   * an OEM commission outside 0..100 is rejected
--   * a certification outside the approved list is rejected
--   * a foreign key ties certificates, contacts and products to an OEM
--   * every change is written to audit_log by the 0001 trigger function
--
-- STATUS: applied and verified with scripts/test-rules.mjs.

-- Helper: does the signed-in user hold one of these roles?
create or replace function public.has_role(roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.is_active
      and p.role = any(roles)
  );
$$;

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(btrim(name)) > 0),
  division     text,
  sub_division text,
  location     text,
  address      text,
  gst_number   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- OEMs
-- ---------------------------------------------------------------------------
create table if not exists public.oems (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null unique check (char_length(btrim(name)) > 0),
  country_of_origin      text,
  brand_category         text,
  product_portfolio      text,
  moq_rules              text,
  typical_lead_time_days integer check (typical_lead_time_days is null or typical_lead_time_days >= 0),
  payment_terms          text,
  freight_terms          text,
  warranty_terms         text,
  commission_percent     numeric(5,2) check (commission_percent is null or (commission_percent >= 0 and commission_percent <= 100)),
  standard_currency      text not null default 'INR',
  gst_number             text,
  vendor_code            text,
  nda_status             text,
  is_approved            boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table if not exists public.oem_contacts (
  id         uuid primary key default gen_random_uuid(),
  oem_id     uuid not null references public.oems (id) on delete cascade,
  name       text not null check (char_length(btrim(name)) > 0),
  email      text,
  phone      text,
  role       text,
  created_at timestamptz not null default now()
);

create table if not exists public.oem_certificates (
  id                 uuid primary key default gen_random_uuid(),
  oem_id             uuid not null references public.oems (id) on delete cascade,
  certification      text not null check (certification in ('RCMA', 'CEMILAC', 'DGQA', 'LCSO', 'MIL')),
  certificate_number text,
  issue_date         date,
  valid_till         date,
  created_at         timestamptz not null default now(),
  check (valid_till is null or issue_date is null or valid_till >= issue_date)
);

-- ---------------------------------------------------------------------------
-- Products / Part master
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id                      uuid primary key default gen_random_uuid(),
  description             text not null check (char_length(btrim(description)) > 0),
  client_part_number      text,
  oem_part_number         text,
  hsn_code                text,
  uom                     text not null default 'Nos' check (char_length(btrim(uom)) > 0),
  category                text,
  technical_specification text,
  standard_price          numeric(14,2) check (standard_price is null or standard_price >= 0),
  oem_id                  uuid references public.oems (id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists products_client_part_number_idx on public.products (client_part_number);
create index if not exists products_oem_part_number_idx on public.products (oem_part_number);
create index if not exists oem_certificates_oem_idx on public.oem_certificates (oem_id);

-- ---------------------------------------------------------------------------
-- Audit + updated_at triggers
-- ---------------------------------------------------------------------------
drop trigger if exists audit_customers on public.customers;
create trigger audit_customers after insert or update or delete on public.customers
  for each row execute function public.audit_row_change();

drop trigger if exists audit_oems on public.oems;
create trigger audit_oems after insert or update or delete on public.oems
  for each row execute function public.audit_row_change();

drop trigger if exists audit_oem_contacts on public.oem_contacts;
create trigger audit_oem_contacts after insert or update or delete on public.oem_contacts
  for each row execute function public.audit_row_change();

drop trigger if exists audit_oem_certificates on public.oem_certificates;
create trigger audit_oem_certificates after insert or update or delete on public.oem_certificates
  for each row execute function public.audit_row_change();

drop trigger if exists audit_products on public.products;
create trigger audit_products after insert or update or delete on public.products
  for each row execute function public.audit_row_change();

drop trigger if exists touch_customers on public.customers;
create trigger touch_customers before update on public.customers
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_oems on public.oems;
create trigger touch_oems before update on public.oems
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_products on public.products;
create trigger touch_products before update on public.products
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row-level security: read for any signed-in user, write for Owner/Operations.
-- ---------------------------------------------------------------------------
alter table public.customers enable row level security;
alter table public.oems enable row level security;
alter table public.oem_contacts enable row level security;
alter table public.oem_certificates enable row level security;
alter table public.products enable row level security;

drop policy if exists customers_read on public.customers;
create policy customers_read on public.customers for select to authenticated using (true);
drop policy if exists customers_write on public.customers;
create policy customers_write on public.customers for all to authenticated
  using (public.has_role(array['owner', 'operations']))
  with check (public.has_role(array['owner', 'operations']));

drop policy if exists oems_read on public.oems;
create policy oems_read on public.oems for select to authenticated using (true);
drop policy if exists oems_write on public.oems;
create policy oems_write on public.oems for all to authenticated
  using (public.has_role(array['owner', 'operations']))
  with check (public.has_role(array['owner', 'operations']));

drop policy if exists oem_contacts_read on public.oem_contacts;
create policy oem_contacts_read on public.oem_contacts for select to authenticated using (true);
drop policy if exists oem_contacts_write on public.oem_contacts;
create policy oem_contacts_write on public.oem_contacts for all to authenticated
  using (public.has_role(array['owner', 'operations']))
  with check (public.has_role(array['owner', 'operations']));

drop policy if exists oem_certificates_read on public.oem_certificates;
create policy oem_certificates_read on public.oem_certificates for select to authenticated using (true);
drop policy if exists oem_certificates_write on public.oem_certificates;
create policy oem_certificates_write on public.oem_certificates for all to authenticated
  using (public.has_role(array['owner', 'operations']))
  with check (public.has_role(array['owner', 'operations']));

drop policy if exists products_read on public.products;
create policy products_read on public.products for select to authenticated using (true);
drop policy if exists products_write on public.products;
create policy products_write on public.products for all to authenticated
  using (public.has_role(array['owner', 'operations']))
  with check (public.has_role(array['owner', 'operations']));
