import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FailedState, MissingState } from "@/components/States";
import { readConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

const MASTERS = [
  { table: "customers", label: "Customers", href: "/masters/customers", blurb: "Agencies that send requirements, with division and sub-division." },
  { table: "oems", label: "OEM suppliers", href: "/masters/oems", blurb: "Manufacturers you source from, with commission % and approval status." },
  { table: "products", label: "Products / Parts", href: "/masters/products", blurb: "Part numbers (client and OEM), UoM, HSN and standard price." },
] as const;

export default async function MastersPage() {
  const config = readConfig();
  const supabase = await createSupabaseServerClient();

  if (!config.configured || !supabase) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Masters</h1>
        <MissingState
          title="A setting is missing, so masters cannot be loaded"
          items={config.configured ? [] : config.missing}
        />
      </div>
    );
  }

  const counts: Record<string, number | string> = {};
  for (const master of MASTERS) {
    const { count, error } = await supabase
      .from(master.table)
      .select("*", { count: "exact", head: true });
    counts[master.table] = error ? error.message : count ?? 0;
  }

  const failed = Object.values(counts).some((value) => typeof value === "string");

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Data / Masters
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Masters</h1>
        <p className="mt-1 text-sm text-muted">
          The lists every requirement points at. Records marked SAMPLE are
          placeholders only and are never used in reports.
        </p>
      </section>

      {failed && (
        <FailedState
          title="Could not load one or more masters"
          message={Object.entries(counts)
            .filter(([, value]) => typeof value === "string")
            .map(([table, message]) => `${table}: ${message}`)
            .join(" | ")}
        />
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        {MASTERS.map((master) => (
          <Link key={master.table} href={master.href} className="card block hover:border-accent/50">
            <p className="text-sm font-semibold text-slate-100">{master.label}</p>
            <p className="mt-3 text-3xl font-semibold text-accent">{counts[master.table]}</p>
            <p className="mt-2 text-xs text-muted">{master.blurb}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
