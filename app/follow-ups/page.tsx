import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EmptyState, FailedState, MissingState } from "@/components/States";
import { StageSelect } from "@/components/StageSelect";
import { readConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

/** Today in the business timezone (Asia/Kolkata), as YYYY-MM-DD. */
function todayInKolkata(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export default async function FollowUpsPage() {
  const config = readConfig();
  const supabase = await createSupabaseServerClient();

  if (!config.configured || !supabase) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Follow-ups Today</h1>
        <MissingState
          title="A setting is missing, so follow-ups cannot be loaded"
          items={config.configured ? [] : config.missing}
        />
      </div>
    );
  }

  const today = todayInKolkata();

  const { data, error } = await supabase
    .from("customers")
    .select("id, name, phone, source, stage, next_followup_date")
    .lte("next_followup_date", today)
    .neq("stage", "Won")
    .order("next_followup_date", { ascending: true });

  const rows = data ?? [];
  const overdue = rows.filter((r) => r.next_followup_date && r.next_followup_date < today).length;
  const dueToday = rows.length - overdue;

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Intelligence / Today
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Follow-ups Today</h1>
        <p className="mt-1 text-sm text-muted">
          Everyone due today or earlier who is not yet Won. Change the stage here
          to move them along; it saves straight away.
        </p>
      </section>

      {error && <FailedState title="Could not load follow-ups" message={error.message} />}

      {!error && rows.length > 0 && (
        <div className="flex flex-wrap gap-4">
          <div className="card">
            <p className="text-xs text-muted">Due today</p>
            <p className="mt-1 text-2xl font-semibold text-accent">{dueToday}</p>
          </div>
          <div className="card">
            <p className="text-xs text-muted">Overdue</p>
            <p className="mt-1 text-2xl font-semibold text-late">{overdue}</p>
          </div>
          <div className="card">
            <p className="text-xs text-muted">Total to action</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">{rows.length}</p>
          </div>
        </div>
      )}

      {!error && rows.length === 0 && (
        <EmptyState
          title="Nothing due today"
          message="No customer is due for follow-up today or earlier. Set a follow-up date when you add or update a customer."
        />
      )}

      {!error && rows.length > 0 && (
        <div className="rounded-xl border border-edge bg-panel">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-edge text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium">Stage</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isOverdue = row.next_followup_date && row.next_followup_date < today;
                  return (
                    <tr key={row.id} className="border-t border-edge/70">
                      <td className="px-4 py-3 font-medium text-slate-100">{row.name}</td>
                      <td className="px-4 py-3 text-slate-300">{row.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-300">{row.source ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={isOverdue ? "pill-late" : "pill-risk"}>
                          {isOverdue ? "Overdue" : "Today"} · {row.next_followup_date}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StageSelect id={row.id} stage={row.stage ?? "New"} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
