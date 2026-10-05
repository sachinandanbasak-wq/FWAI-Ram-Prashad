import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EmptyState, FailedState } from "@/components/States";
import { createProduct } from "@/app/masters/actions";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("products")
    .select("id, description, client_part_number, oem_part_number, uom, category, standard_price")
    .order("description", { ascending: true });

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products / Parts</h1>
          <p className="mt-1 text-sm text-slate-600">
            Part master. Unit of measure is per line, because the same part can be
            quoted in Nos or Mtrs.
          </p>
        </div>
        <a
          href="/masters/export/products"
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

      <form action={createProduct} className="card grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Description (required)
          <input name="description" required className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Client part number
          <input name="client_part_number" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          OEM part number
          <input name="oem_part_number" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Unit of measure
          <select name="uom" defaultValue="Nos" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm">
            <option>Nos</option>
            <option>Mtrs</option>
            <option>Kg</option>
            <option>Sets</option>
            <option>Ltrs</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          HSN code
          <input name="hsn_code" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Category
          <input name="category" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Standard price (₹)
          <input name="standard_price" type="number" min="0" step="0.01" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <div className="flex items-end">
          <button type="submit" className="rounded bg-ink px-4 py-2 text-sm font-medium text-white">
            Add part
          </button>
        </div>
      </form>

      {error && <FailedState title="Could not load parts" message={error.message} />}

      {!error && (!data || data.length === 0) && (
        <EmptyState title="No parts yet" message="Add the first part above, or import a list later." />
      )}

      {!error && data && data.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-4">Description</th>
                <th className="py-2 pr-4">Client part no.</th>
                <th className="py-2 pr-4">OEM part no.</th>
                <th className="py-2 pr-4">UoM</th>
                <th className="py-2">Standard price</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium text-slate-800">{row.description}</td>
                  <td className="py-2 pr-4 text-slate-600">{row.client_part_number ?? "—"}</td>
                  <td className="py-2 pr-4 text-slate-600">{row.oem_part_number ?? "—"}</td>
                  <td className="py-2 pr-4 text-slate-600">{row.uom}</td>
                  <td className="py-2 text-slate-600">
                    {row.standard_price === null ? "—" : `₹ ${row.standard_price}`}
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
