import Link from "next/link";
import { readConfig } from "@/lib/config";
import { EmptyState, MissingState } from "@/components/States";

const MORNING_VIEW = [
  "Open orders by stage",
  "Quotes awaiting a response",
  "Orders at delivery risk (Red / Amber)",
  "Payments pending and overdue",
  "OEM responses pending",
  "Documents expiring soon",
  "Follow-up tasks due today",
  "Commission receivable",
];

export default function DashboardPage() {
  const config = readConfig();

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Morning view</h1>
        <p className="mt-1 text-sm text-slate-600">
          The working dashboard is built in Phase 7. This shell is Step 1.1 of
          Phase 1, so the tiles below are placeholders and carry no figures.
        </p>
      </section>

      {!config.configured && (
        <MissingState
          title="A setting is missing"
          items={config.missing}
          hint="Add these to .env.local (see .env.example) and restart. Until then the database cannot be reached."
        />
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MORNING_VIEW.map((tile) => (
          <div key={tile} className="card">
            <p className="text-sm font-medium text-slate-800">{tile}</p>
            <p className="mt-3 text-2xl font-semibold text-slate-300">—</p>
            <p className="mt-1 text-xs text-slate-500">No data yet</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Requirements</h2>
        <p className="mb-3 mt-1 text-sm text-slate-600">
          The requirement is the root record. Everything else hangs off it.
        </p>
        <EmptyState
          title="No requirements yet"
          message="Once Phase 1 is connected to the database, every enquiry you capture appears here. Nothing is shown until you enter it — no example rows."
        />
      </section>

      <p className="text-sm text-slate-600">
        Next: check the{" "}
        <Link href="/settings" className="font-medium text-track underline">
          Settings
        </Link>{" "}
        screen.
      </p>
    </div>
  );
}
