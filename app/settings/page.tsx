import { loadSettings } from "@/lib/settings";
import { EmptyState, FailedState, MissingState } from "@/components/States";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const result = await loadSettings();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Every value marked CONFIRM in the PRD lives here as a setting, never
          hard-coded. Changing a setting changes behaviour without a rebuild.
        </p>
      </section>

      {result.status === "missing" && (
        <MissingState
          title="A setting is missing, so settings cannot be loaded"
          items={result.missing}
          hint="The database has not been connected yet. Copy .env.example to .env.local, fill in the two values, and restart the app."
        />
      )}

      {result.status === "failed" && (
        <FailedState
          title="Could not load settings"
          message={`${result.message}. Nothing was changed. Try again, or check the database connection.`}
        />
      )}

      {result.status === "empty" && (
        <EmptyState
          title="No settings found"
          message="The settings table exists but has no rows. Run supabase/migrations/0001_init.sql and supabase/seed.sql to create the defaults."
        />
      )}

      {result.status === "ok" && (
        <div className="card">
          <h2 className="text-lg font-semibold">Stored settings</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {Object.entries(result.settings).map(([key, value]) => (
              <li key={key} className="flex items-start justify-between gap-4 py-2">
                <code className="text-sm text-slate-700">{key}</code>
                <code className="max-w-[60%] break-all text-right text-sm text-slate-500">
                  {JSON.stringify(value)}
                </code>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
