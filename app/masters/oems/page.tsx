import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EmptyState, FailedState } from "@/components/States";
import { createOem } from "@/app/masters/actions";

export const dynamic = "force-dynamic";

export default async function OemsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("oems")
    .select("id, name, country_of_origin, brand_category, commission_percent, is_approved")
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">OEM suppliers</h1>
          <p className="mt-1 text-sm text-slate-600">
            The manufacturers you source from. Commission % is per OEM and can be
            overridden per product later. Approval status needs an approval to change.
          </p>
        </div>
        <a
          href="/masters/export/oems"
          className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
        >
          Export to Excel
        </a>
      </section>

      {params.error && (
        <p className="state-failed rounded-lg border p-4 text-sm">{params.error}</p>
      )}
      {params.saved && (
        <p className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-900">
          {params.saved}
        </p>
      )}

      <form action={createOem} className="card grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          OEM name (required)
          <input name="name" required className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Country of origin
          <input name="country_of_origin" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Brand / category
          <input name="brand_category" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Commission % (0–100)
          <input
            name="commission_percent"
            type="number"
            min="0"
            max="100"
            step="0.01"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Payment terms
          <input name="payment_terms" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="flex items-center gap-2 self-end text-sm font-medium text-slate-700">
          <input name="is_approved" type="checkbox" />
          Approved OEM
        </label>
        <div className="flex items-end">
          <button type="submit" className="rounded bg-ink px-4 py-2 text-sm font-medium text-white">
            Add OEM
          </button>
        </div>
      </form>

      {error && <FailedState title="Could not load OEMs" message={error.message} />}

      {!error && (!data || data.length === 0) && (
        <EmptyState title="No OEMs yet" message="Add the first manufacturer above." />
      )}

      {!error && data && data.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Origin</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Commission %</th>
                <th className="py-2">Approved</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium text-slate-800">{row.name}</td>
                  <td className="py-2 pr-4 text-slate-600">{row.country_of_origin ?? "—"}</td>
                  <td className="py-2 pr-4 text-slate-600">{row.brand_category ?? "—"}</td>
                  <td className="py-2 pr-4 text-slate-600">
                    {row.commission_percent === null ? "—" : `${row.commission_percent}%`}
                  </td>
                  <td className="py-2">
                    {row.is_approved ? (
                      <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800">Approved</span>
                    ) : (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">Not approved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
