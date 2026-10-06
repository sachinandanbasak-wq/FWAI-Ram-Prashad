import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EmptyState, FailedState, MissingState } from "@/components/States";
import { RequirementsTable, type RequirementRow } from "@/components/RequirementsTable";
import { readConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function RequirementsPage() {
  const config = readConfig();
  const supabase = await createSupabaseServerClient();

  if (!config.configured || !supabase) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Requirements</h1>
        <MissingState
          title="A setting is missing, so requirements cannot be loaded"
          items={config.configured ? [] : config.missing}
        />
      </div>
    );
  }

  const { data, error } = await supabase
    .from("v_requirement_overview")
    .select(
      "rfi_number, project_name, primary_part_number, primary_part_description, drawing_status, technical_requirement, missing_information, approval_status, compliance_status, status",
    )
    .order("rfi_number", { ascending: false });

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Operations / Sample data
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Requirements</h1>
        <p className="mt-1 text-sm text-muted">
          Review specifications, drawings, approvals and missing technical
          information before quoting.
        </p>
      </section>

      {error && <FailedState title="Could not load requirements" message={error.message} />}

      {!error && (!data || data.length === 0) && (
        <EmptyState
          title="No requirements yet"
          message="Once you capture an enquiry it appears here. Nothing is shown until you enter it."
        />
      )}

      {!error && data && data.length > 0 && (
        <RequirementsTable rows={data as unknown as RequirementRow[]} />
      )}

      <p className="text-xs text-slate-500">
        Missing information must be resolved before technical acceptance.
        Government follow-up remains a human decision.
      </p>
    </div>
  );
}
