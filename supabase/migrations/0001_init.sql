-- 0001_init.sql — the config store, the audit spine, and roles groundwork.
--
-- Rules live in the database (PRD §3). This migration creates the three things
-- every later table depends on:
--   1. settings      — every [CONFIRM] item, as data, never hard-coded
--   2. audit_log     — what changed, old -> new, who, when
--   3. profiles      — one row per user, carrying the role used by RLS
--
-- Run order: this file first, then 0002_* onward.
-- STATUS: UNVERIFIED against a live Supabase project (no project keys yet).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Settings
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid
);

-- Defaults from PRD §12. Changing any of these is an edit, not a rebuild.
insert into public.settings (key, value, description) values
  ('company_name', '""'::jsonb,
    'Company / brand name shown on screens and PDFs. Empty until the owner sets it.'),
  ('company_logo_url', '""'::jsonb,
    'Logo used on quotation and commission PDFs.'),
  ('oem_capacity_model', '"global"'::jsonb,
    'global = one capacity shared across orders (default); per_order = capacity per order.'),
  ('money_flow', '"oem_invoices_customer_then_commission_to_oem"'::jsonb,
    'Who invoices whom. Default: OEM invoices customer -> customer pays OEM -> consultant bills commission to OEM.'),
  ('pass_is_status', 'true'::jsonb,
    'true = Pass is a requirement status with reason + regret letter date; false = Pass is a loss reason.'),
  ('loss_reasons', '["Price","Technical non-compliance","Delivery timeline","Competitor preference","Quantity or capacity","Cancelled","Not pursued","Other"]'::jsonb,
    'Editable list of structured loss reasons.'),
  ('quote_number_pattern', '"IB/{NN}/{MMM}-{YY}"'::jsonb,
    'Quotation number pattern with a live preview; tokens {NN} {MMM} {YY} {YYYY}.'),
  ('owner_approves_all_quotes', 'true'::jsonb,
    'true until the owner sets value thresholds.'),
  ('reminder_days', '{"submission":[7,3,1],"expiry":[90,60,30],"no_response":7,"oem_overdue":7}'::jsonb,
    'Configurable reminder day-counts.'),
  ('delivery_risk_amber_days', '15'::jsonb,
    'Amber when <= this many days to the committed deadline with a step still pending.'),
  ('gst_rate', '18'::jsonb,
    'Default GST percentage.'),
  ('one_quote_many_pos', 'false'::jsonb,
    'false = one PO per quotation (many lines); true = a quotation may produce several POs.')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Profiles and roles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null,
  email      text not null,
  role       text not null check (role in ('owner', 'sales', 'operations', 'finance')),
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'owner'
      and p.is_active
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. Audit log and a reusable trigger
-- ---------------------------------------------------------------------------
create table if not exists public.audit_log (
  id         bigint generated always as identity primary key,
  entity     text not null,
  entity_id  text not null,
  field      text not null,
  old_value  jsonb,
  new_value  jsonb,
  changed_by uuid,
  changed_at timestamptz not null default now(),
  reason     text
);

create index if not exists audit_log_entity_idx on public.audit_log (entity, entity_id);
create index if not exists audit_log_changed_at_idx on public.audit_log (changed_at desc);

-- Generic row-change audit. Attach with:
--   create trigger audit_<table> after insert or update or delete on <table>
--   for each row execute function public.audit_row_change();
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_json jsonb;
  new_json jsonb;
  row_id   text;
  col      text;
begin
  if tg_op = 'INSERT' then
    new_json := to_jsonb(new);
    row_id := coalesce(new_json ->> 'id', new_json ->> 'key');
    insert into public.audit_log (entity, entity_id, field, old_value, new_value, changed_by)
    values (tg_table_name, row_id, '*', null, new_json, auth.uid());
    return new;
  elsif tg_op = 'UPDATE' then
    old_json := to_jsonb(old);
    new_json := to_jsonb(new);
    row_id := coalesce(new_json ->> 'id', new_json ->> 'key');
    for col in select jsonb_object_keys(new_json) loop
      if (old_json -> col) is distinct from (new_json -> col) then
        insert into public.audit_log (entity, entity_id, field, old_value, new_value, changed_by)
        values (tg_table_name, row_id, col, old_json -> col, new_json -> col, auth.uid());
      end if;
    end loop;
    return new;
  else -- DELETE
    old_json := to_jsonb(old);
    row_id := coalesce(old_json ->> 'id', old_json ->> 'key');
    insert into public.audit_log (entity, entity_id, field, old_value, new_value, changed_by)
    values (tg_table_name, row_id, '*', old_json, null, auth.uid());
    return old;
  end if;
end;
$$;

drop trigger if exists audit_settings on public.settings;
create trigger audit_settings
  after insert or update or delete on public.settings
  for each row execute function public.audit_row_change();

-- Keep updated_at honest on settings.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_settings on public.settings;
create trigger touch_settings
  before update on public.settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Row-level security
-- ---------------------------------------------------------------------------
alter table public.settings enable row level security;
alter table public.audit_log enable row level security;
alter table public.profiles enable row level security;

-- Settings: readable by any signed-in user, writable by the owner only.
drop policy if exists settings_read on public.settings;
create policy settings_read on public.settings
  for select to authenticated using (true);

drop policy if exists settings_owner_write on public.settings;
create policy settings_owner_write on public.settings
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- Audit log: read-only for the owner; nobody writes directly (the trigger does).
drop policy if exists audit_owner_read on public.audit_log;
create policy audit_owner_read on public.audit_log
  for select to authenticated using (public.is_owner());

-- Profiles: a user reads their own row; the owner reads and writes all.
drop policy if exists profiles_self_or_owner_read on public.profiles;
create policy profiles_self_or_owner_read on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_owner());

drop policy if exists profiles_owner_write on public.profiles;
create policy profiles_owner_write on public.profiles
  for all to authenticated using (public.is_owner()) with check (public.is_owner());
