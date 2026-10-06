-- 0005_customer_pipeline.sql — customer contact + pipeline fields.
--
-- Adds what the enquiry/follow-up screens need:
--   phone            contact number
--   source           how they reached us: Call | WhatsApp | Referral
--   stage            pipeline stage: New | Contacted | Quoted | Won
--   next_followup_date  when to chase next (drives "Follow-ups Today")
--
-- STATUS: applied and verified with scripts/test-rules.mjs.

alter table public.customers add column if not exists phone text;
alter table public.customers add column if not exists source text;
alter table public.customers add column if not exists stage text not null default 'New';
alter table public.customers add column if not exists next_followup_date date;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'customers_source_check') then
    alter table public.customers
      add constraint customers_source_check
      check (source is null or source in ('Call', 'WhatsApp', 'Referral'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'customers_stage_check') then
    alter table public.customers
      add constraint customers_stage_check
      check (stage in ('New', 'Contacted', 'Quoted', 'Won'));
  end if;
end $$;

create index if not exists customers_stage_idx on public.customers (stage);
create index if not exists customers_followup_idx on public.customers (next_followup_date);

-- The seed file repeated itself, leaving duplicate SAMPLE rows. Keep the oldest
-- of each. This touches placeholders only (names beginning SAMPLE), never real
-- records; the seed file is made idempotent in the same change.
delete from public.customers extra
using public.customers keep
where extra.name like 'SAMPLE%'
  and extra.name = keep.name
  and extra.ctid > keep.ctid;

delete from public.products extra
using public.products keep
where extra.description like 'SAMPLE%'
  and extra.description = keep.description
  and extra.ctid > keep.ctid;

delete from public.oem_contacts extra
using public.oem_contacts keep
where extra.name like 'SAMPLE%'
  and extra.oem_id = keep.oem_id
  and extra.name = keep.name
  and extra.ctid > keep.ctid;

delete from public.oem_certificates extra
using public.oem_certificates keep
where extra.certificate_number like 'SAMPLE%'
  and extra.oem_id = keep.oem_id
  and extra.certificate_number = keep.certificate_number
  and extra.ctid > keep.ctid;
