import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EmptyState, FailedState } from "@/components/States";
import { createCustomer } from "@/app/masters/actions";

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
    .select("id, name, division, sub_division, location, gst_number")
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-slate-600">
            Agencies that send requirements. A name is required; everything else can
            be filled in later.
          </p>
        </div>
        <a
          href="/masters/export/customers"
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

      <form action={createCustomer} className="card grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Name (required)
          <input name="name" required className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Division
          <input name="division" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Sub-division
          <input name="sub_division" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Location
          <input name="location" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          GST number
          <input name="gst_number" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <div className="flex items-end">
          <button type="submit" className="rounded bg-ink px-4 py-2 text-sm font-medium text-white">
            Add customer
          </button>
        </div>
      </form>

      {error && <FailedState title="Could not load customers" message={error.message} />}

      {!error && (!data || data.length === 0) && (
        <EmptyState title="No customers yet" message="Add the first agency above. Nothing is shown until you enter it." />
      )}

      {!error && data && data.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Division</th>
                <th className="py-2 pr-4">Sub-division</th>
                <th className="py-2 pr-4">Location</th>
                <th className="py-2">GST</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium text-slate-800">{row.name}</td>
                  <td className="py-2 pr-4 text-slate-600">{row.division ?? "—"}</td>
                  <td className="py-2 pr-4 text-slate-600">{row.sub_division ?? "—"}</td>
                  <td className="py-2 pr-4 text-slate-600">{row.location ?? "—"}</td>
                  <td className="py-2 text-slate-600">{row.gst_number ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
