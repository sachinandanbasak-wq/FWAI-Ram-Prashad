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
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Products / Parts</h1>
          <p className="mt-1 text-sm text-slate-600">
            Part master. Unit of measure is per line, because the same part can be
            quoted in Nos or Mtrs.
          </p>
        </div>
        <a
          href="/masters/export/products"
          className="btn-ghost"
        >
          Export to Excel
        </a>
      </section>

      {params.error && (
        <p className="state-failed p-4 text-sm">{params.error}</p>
      )}
      {params.saved && (
        <p className="rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-sm text-green-200">
          {params.saved}
        </p>
      )}

      <form action={createProduct} className="card grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-300 sm:col-span-2">
          Description (required)
          <input name="description" required className="field" />
        </label>
        <label className="text-sm font-medium text-slate-300">
          Client part number
          <input name="client_part_number" className="field" />
        </label>
        <label className="text-sm font-medium text-slate-300">
          OEM part number
          <input name="oem_part_number" className="field" />
        </label>
        <label className="text-sm font-medium text-slate-300">
          Unit of measure
          <select name="uom" defaultValue="Nos" className="field">
            <option>Nos</option>
            <option>Mtrs</option>
            <option>Kg</option>
            <option>Sets</option>
            <option>Ltrs</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-300">
          HSN code
          <input name="hsn_code" className="field" />
        </label>
        <label className="text-sm font-medium text-slate-300">
          Category
          <input name="category" className="field" />
        </label>
        <label className="text-sm font-medium text-slate-300">
          Standard price (₹)
          <input name="standard_price" type="number" min="0" step="0.01" className="field" />
        </label>
        <div className="flex items-end">
          <button type="submit" className="btn-primary">
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
              <tr className="border-b border-edge text-left text-slate-500">
                <th className="py-2 pr-4">Description</th>
                <th className="py-2 pr-4">Client part no.</th>
                <th className="py-2 pr-4">OEM part no.</th>
                <th className="py-2 pr-4">UoM</th>
                <th className="py-2">Standard price</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b border-edge/70">
                  <td className="py-2 pr-4 font-medium text-slate-100">{row.description}</td>
                  <td className="py-2 pr-4 text-slate-300">{row.client_part_number ?? "—"}</td>
                  <td className="py-2 pr-4 text-slate-300">{row.oem_part_number ?? "—"}</td>
                  <td className="py-2 pr-4 text-slate-300">{row.uom}</td>
                  <td className="py-2 text-slate-300">
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
