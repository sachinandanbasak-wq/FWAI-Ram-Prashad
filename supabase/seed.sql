-- seed.sql — SAMPLE rows only, for development and demos.
--
-- Every row is prefixed "SAMPLE" and carries "do not use". These are NOT real
-- business records and must never be presented as such. Real history is loaded
-- later through the Excel import wizard, tagged with its source file and row.

-- ---------------------------------------------------------------------------
-- Masters
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Requirements (SAMPLE) — one row each in the overview view
-- ---------------------------------------------------------------------------
insert into public.requirements (
  rfi_number, project_name, customer_id, source_of_enquiry, received_date, submission_deadline,
  quotation_validity_days, bid_type, submission_type, approvals_required,
  drawing_status, technical_requirement, missing_information, approval_status, compliance_status, status
)
select
  'RFI/2026-27/0001', 'SAMPLE - Control Assembly', c.id, 'Direct from customer', '2026-09-01', '2026-10-15',
  90, 'Double bid', 'Both', '{RCMA}',
  'Drawing received', 'SAMPLE - Test protocol 4.2', 'SAMPLE - Material grade confirmation',
  'Government approval', 'Review pending', 'Qualifying'
from public.customers c where c.name = 'SAMPLE - Customer A (do not use)'
on conflict (rfi_number) do nothing;

insert into public.requirements (
  rfi_number, project_name, customer_id, source_of_enquiry, received_date, submission_deadline,
  quotation_validity_days, bid_type, submission_type, approvals_required,
  drawing_status, technical_requirement, missing_information, approval_status, compliance_status, status
)
select
  'RFI/2026-27/0002', 'SAMPLE - Electronic Module 24V', c.id, 'GeM', '2026-09-03', '2026-10-10',
  60, 'Single bid', 'Soft copy', '{CEMILAC}',
  'Drawing received', 'SAMPLE - EMI compliance', null,
  'Type approval', 'Compliant', 'Qualifying'
from public.customers c where c.name = 'SAMPLE - Customer B (do not use)'
on conflict (rfi_number) do nothing;

insert into public.requirements (
  rfi_number, project_name, customer_id, source_of_enquiry, received_date, submission_deadline,
  quotation_validity_days, bid_type, submission_type, approvals_required,
  drawing_status, technical_requirement, missing_information, approval_status, compliance_status, status
)
select
  'RFI/2026-27/0003', 'SAMPLE - Interface Unit', c.id, 'Through OEM', '2026-09-05', '2026-09-30',
  90, 'Double bid', 'Hard copy', '{DGQA}',
  'Drawing missing', 'SAMPLE - Environmental testing', 'SAMPLE - Updated drawing',
  'Government approval', 'Blocked', 'Received'
from public.customers c where c.name = 'SAMPLE - Customer A (do not use)'
on conflict (rfi_number) do nothing;

insert into public.requirements (
  rfi_number, project_name, customer_id, source_of_enquiry, received_date, submission_deadline,
  quotation_validity_days, bid_type, submission_type, approvals_required,
  drawing_status, technical_requirement, missing_information, approval_status, compliance_status, status
)
select
  'RFI/2026-27/0004', 'SAMPLE - Signal Connector', c.id, 'Client portal', '2026-09-08', '2026-10-20',
  45, 'Single bid', 'Soft copy', '{}',
  'Drawing received', 'SAMPLE - Connector tolerance', null,
  'Not required', 'Compliant', 'Quoted'
from public.customers c where c.name = 'SAMPLE - Customer B (do not use)'
on conflict (rfi_number) do nothing;

insert into public.requirements (
  rfi_number, project_name, customer_id, source_of_enquiry, received_date, submission_deadline,
  quotation_validity_days, bid_type, submission_type, approvals_required,
  drawing_status, technical_requirement, missing_information, approval_status, compliance_status, status
)
select
  'RFI/2026-27/0005', 'SAMPLE - Power Converter', c.id, 'Direct from customer', '2026-09-10', '2026-10-05',
  90, 'Double bid', 'Both', '{RCMA,LCSO}',
  'Drawing pending', 'SAMPLE - Vibration qualification', 'SAMPLE - Test standard',
  'OEM certificate', 'Review pending', 'Qualifying'
from public.customers c where c.name = 'SAMPLE - Customer A (do not use)'
on conflict (rfi_number) do nothing;

-- One SAMPLE line per SAMPLE requirement (the grid arrives in the next step).
insert into public.requirement_lines (requirement_id, line_number, part_description, client_part_number, quantity, uom, technical_specification)
select id, 1, 'SAMPLE - Control Assembly Rev C (do not use)', 'SAMPLE-ABC-101', 10, 'Nos', 'SAMPLE - Test protocol 4.2'
from public.requirements where rfi_number = 'RFI/2026-27/0001'
on conflict (requirement_id, line_number) do nothing;

insert into public.requirement_lines (requirement_id, line_number, part_description, client_part_number, quantity, uom, technical_specification)
select id, 1, 'SAMPLE - Electronic Module 24V (do not use)', 'SAMPLE-XYZ-220', 25, 'Nos', 'SAMPLE - EMI compliance'
from public.requirements where rfi_number = 'RFI/2026-27/0002'
on conflict (requirement_id, line_number) do nothing;

insert into public.requirement_lines (requirement_id, line_number, part_description, client_part_number, quantity, uom, technical_specification)
select id, 1, 'SAMPLE - Interface Unit (do not use)', 'SAMPLE-CTL-440', 8, 'Nos', 'SAMPLE - Environmental testing'
from public.requirements where rfi_number = 'RFI/2026-27/0003'
on conflict (requirement_id, line_number) do nothing;

insert into public.requirement_lines (requirement_id, line_number, part_description, client_part_number, quantity, uom, technical_specification)
select id, 1, 'SAMPLE - Signal Connector (do not use)', 'SAMPLE-RF-085', 120, 'Nos', 'SAMPLE - Connector tolerance'
from public.requirements where rfi_number = 'RFI/2026-27/0004'
on conflict (requirement_id, line_number) do nothing;

insert into public.requirement_lines (requirement_id, line_number, part_description, client_part_number, quantity, uom, technical_specification)
select id, 1, 'SAMPLE - Power Converter (do not use)', 'SAMPLE-PWR-215', 40, 'Nos', 'SAMPLE - Vibration qualification'
from public.requirements where rfi_number = 'RFI/2026-27/0005'
on conflict (requirement_id, line_number) do nothing;
