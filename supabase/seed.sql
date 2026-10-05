-- seed.sql — SAMPLE rows only, for development and demos.
--
-- Every row is prefixed "SAMPLE" and carries "do not use". These are NOT real
-- business records and must never be presented as such. Real history is loaded
-- later through the Excel import wizard, tagged with its source file and row.

insert into public.customers (name, division, sub_division, location, gst_number)
values ('SAMPLE - Customer A (do not use)', 'SAMPLE Division', 'SAMPLE Sub-division', 'SAMPLE City', 'SAMPLE-GST-0001')
on conflict do nothing;

insert into public.customers (name, division, sub_division, location)
values ('SAMPLE - Customer B (do not use)', 'SAMPLE Division 2', null, 'SAMPLE City 2')
on conflict do nothing;

insert into public.oems (name, country_of_origin, brand_category, commission_percent, is_approved, vendor_code, gst_number)
values ('SAMPLE - OEM A (do not use)', 'SAMPLE Country', 'SAMPLE category', 5.00, true, 'SAMPLE-VC-001', 'SAMPLE-GST-1001')
on conflict (name) do nothing;

insert into public.oems (name, country_of_origin, brand_category, commission_percent, is_approved, vendor_code)
values ('SAMPLE - OEM B (do not use)', 'SAMPLE Country 2', 'SAMPLE category 2', 7.50, false, 'SAMPLE-VC-002')
on conflict (name) do nothing;

insert into public.oem_contacts (oem_id, name, email, phone, role)
select id, 'SAMPLE - Contact Person (do not use)', 'sample.contact@example.invalid', '+91-0000000000', 'Sales'
from public.oems where name = 'SAMPLE - OEM A (do not use)'
on conflict do nothing;

insert into public.oem_certificates (oem_id, certification, certificate_number, issue_date, valid_till)
select id, 'RCMA', 'SAMPLE-CERT-0001', '2022-01-01', '2027-01-01'
from public.oems where name = 'SAMPLE - OEM A (do not use)'
on conflict do nothing;

insert into public.products (description, client_part_number, oem_part_number, hsn_code, uom, category, standard_price, oem_id)
select 'SAMPLE - Part P1 (do not use)', 'SAMPLE-P1', 'SAMPLE-OEM-P1', 'SAMPLE-HSN', 'Nos', 'SAMPLE category', 123.45, id
from public.oems where name = 'SAMPLE - OEM A (do not use)'
on conflict do nothing;

insert into public.products (description, client_part_number, uom, category, standard_price)
values ('SAMPLE - Part P2 by metre (do not use)', 'SAMPLE-P2', 'Mtrs', 'SAMPLE category', 67.89)
on conflict do nothing;
