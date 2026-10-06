import Link from "next/link";
import { readConfig } from "@/lib/config";
import { EmptyState, MissingState } from "@/components/States";
import { Jet } from "@/components/Jet";

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
      <section className="card flex items-center justify-between gap-6 overflow-hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Operations / Morning view
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            The live figures arrive in Phase 7. The tiles below are placeholders and
            carry no numbers.
          </p>
        </div>
        <Jet className="h-24 w-24 shrink-0 text-accent/30" />
      </section>

      {!config.configured && (
        <MissingState
          title="A setting is missing"
          items={config.missing}
          hint="Add these to .env.local (see .env.example) and restart."
        />
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MORNING_VIEW.map((tile) => (
          <div key={tile} className="card">
            <p className="text-sm font-medium text-slate-200">{tile}</p>
            <p className="mt-3 text-2xl font-semibold text-slate-600">—</p>
            <p className="mt-1 text-xs text-muted">No data yet</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100">Try it</h2>
        <p className="mb-3 mt-1 text-sm text-muted">
          Open the Requirements workspace, or the demo evaluator with SAMPLE rows.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/requirements" className="btn-primary">
            Requirements
          </Link>
          <Link href="/demo" className="btn-ghost">
            Demo evaluator
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100">Requirements</h2>
        <p className="mb-3 mt-1 text-sm text-muted">
          The requirement is the root record. Everything else hangs off it.
        </p>
        <EmptyState
          title="No requirements loaded"
          message="Sign in to see your real requirements, or open the demo evaluator to see SAMPLE rows."
        />
      </section>
    </div>
  );
}
