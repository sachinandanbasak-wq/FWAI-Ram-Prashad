import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EmptyState, FailedState } from "@/components/States";
import { AddCustomerPanel } from "@/components/AddCustomerPanel";
import { StageSelect } from "@/components/StageSelect";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("customers")
    .select("id, name, phone, source, stage, next_followup_date, location")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Data / Customers
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-100">Customers</h1>
          <p className="mt-1 text-sm text-muted">
            Add a customer and move them through the pipeline. Stage changes save
            straight away.
          </p>
        </div>
        <a href="/masters/export/customers" className="btn-ghost">
          Export to Excel
        </a>
      </section>

      {params.error && <p className="state-failed p-4 text-sm">{params.error}</p>}
      {params.saved && (
        <p className="rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-sm text-green-200">
          {params.saved}
        </p>
      )}

      <AddCustomerPanel />

      {error && <FailedState title="Could not load customers" message={error.message} />}

      {!error && (!data || data.length === 0) && (
        <EmptyState
          title="No customers yet"
          message="Use Add Customer above. Nothing is shown until you enter it."
        />
      )}

      {!error && data && data.length > 0 && (
        <div className="rounded-xl border border-edge bg-panel">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-edge text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Stage</th>
                  <th className="px-4 py-3 font-medium">Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id} className="border-t border-edge/70">
                    <td className="px-4 py-3 font-medium text-slate-100">
                      {row.name}
                      {row.location && (
                        <span className="ml-2 text-xs text-muted">{row.location}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{row.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-300">{row.source ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StageSelect id={row.id} stage={row.stage ?? "New"} />
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {row.next_followup_date ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
