import { RequirementsTable, type RequirementRow } from "@/components/RequirementsTable";
import { Jet } from "@/components/Jet";

// Public demo. Uses embedded SAMPLE rows only — no database, no login, no real
// records. This is what lets the workspace be evaluated before the owner signs in.
const SAMPLE_REQUIREMENTS: RequirementRow[] = [
  {
    rfi_number: "RFI/2026-27/0041",
    project_name: "SAMPLE - Control Assembly",
    primary_part_number: "SAMPLE-ABC-101",
    primary_part_description: "SAMPLE - Control Assembly Rev C",
    drawing_status: "Drawing received",
    technical_requirement: "SAMPLE - Test protocol 4.2",
    missing_information: "SAMPLE - Material grade confirmation",
    approval_status: "Government approval",
    compliance_status: "Review pending",
    status: "Qualifying",
  },
  {
    rfi_number: "RFI/2026-27/0040",
    project_name: "SAMPLE - Electronic Module",
    primary_part_number: "SAMPLE-XYZ-220",
    primary_part_description: "SAMPLE - Electronic Module 24V",
    drawing_status: "Drawing received",
    technical_requirement: "SAMPLE - EMI compliance",
    missing_information: null,
    approval_status: "Type approval",
    compliance_status: "Compliant",
    status: "Quoted",
  },
  {
    rfi_number: "RFI/2026-27/0039",
    project_name: "SAMPLE - Interface Unit",
    primary_part_number: "SAMPLE-CTL-440",
    primary_part_description: "SAMPLE - Interface Unit",
    drawing_status: "Drawing missing",
    technical_requirement: "SAMPLE - Environmental testing",
    missing_information: "SAMPLE - Updated drawing",
    approval_status: "Government approval",
    compliance_status: "Blocked",
    status: "Received",
  },
  {
    rfi_number: "RFI/2026-27/0038",
    project_name: "SAMPLE - Signal Connector",
    primary_part_number: "SAMPLE-RF-085",
    primary_part_description: "SAMPLE - Signal Connector",
    drawing_status: "Drawing received",
    technical_requirement: "SAMPLE - Connector tolerance",
    missing_information: null,
    approval_status: "Not required",
    compliance_status: "Compliant",
    status: "Quoted",
  },
  {
    rfi_number: "RFI/2026-27/0035",
    project_name: "SAMPLE - Power Converter",
    primary_part_number: "SAMPLE-PWR-215",
    primary_part_description: "SAMPLE - Power Converter",
    drawing_status: "Drawing pending",
    technical_requirement: "SAMPLE - Vibration qualification",
    missing_information: "SAMPLE - Test standard",
    approval_status: "OEM certificate",
    compliance_status: "Review pending",
    status: "Qualifying",
  },
];

export default function DemoPage() {
  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Demo evaluator / Sample data
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Requirements</h1>
          <p className="mt-1 text-sm text-muted">
            Review specifications, drawings, approvals and missing technical
            information before quoting.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Jet className="h-12 w-12 text-accent/40" />
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">
            SAMPLE DATA — no login required
          </span>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <a href="/demo/customers" className="btn-primary">
          Customers &amp; Follow-ups demo
        </a>
      </div>

      <RequirementsTable rows={SAMPLE_REQUIREMENTS} sample />

      <p className="text-xs text-slate-500">
        Missing information must be resolved before technical acceptance.
        Government follow-up remains a human decision.
      </p>
    </div>
  );
}
