-- 0002_settings_anon_read.sql
--
-- Settings are non-sensitive configuration (company name, GST rate, reminder
-- days, loss reasons). The app shell needs them before login, so allow an
-- anonymous SELECT on this one table.
--
-- Role-sensitive tables remain authenticated-only. When auth lands in Step 1.2,
-- this policy can stay: it exposes no business data, only configuration.

drop policy if exists settings_anon_read on public.settings;
create policy settings_anon_read on public.settings
  for select to anon using (true);
