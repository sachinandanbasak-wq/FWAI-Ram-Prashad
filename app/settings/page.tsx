import { loadSettings } from "@/lib/settings";
import { EmptyState, FailedState, MissingState } from "@/components/States";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const result = await loadSettings();

  const supabase = await createSupabaseServerClient();
  let role: string | null = null;
  let fullName: string | null = null;
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .maybeSingle();
      role = (profile as { role?: string } | null)?.role ?? null;
      fullName = (profile as { full_name?: string } | null)?.full_name ?? null;
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Data / Settings
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Every value marked CONFIRM in the PRD lives here as a setting, never
          hard-coded. Changing a setting changes behaviour without a rebuild.
        </p>
      </section>

      {fullName && (
        <p className="rounded-lg border border-edge bg-panel px-4 py-2 text-sm text-slate-300">
          Signed in as <strong className="text-slate-100">{fullName}</strong> — role{" "}
          <span className="pill-indication">{role ?? "no role assigned"}</span>. Only
          the Owner can change these settings.
        </p>
      )}

      {result.status === "missing" && (
        <MissingState
          title="A setting is missing, so settings cannot be loaded"
          items={result.missing}
          hint="Copy .env.example to .env.local, fill in the two values, and restart."
        />
      )}

      {result.status === "failed" && (
        <FailedState
          title="Could not load settings"
          message={`${result.message}. Nothing was changed.`}
        />
      )}

      {result.status === "empty" && (
        <EmptyState
          title="No settings found"
          message="Run supabase/migrations/0001_init.sql to create the defaults."
        />
      )}

      {result.status === "ok" && (
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-100">
            Stored settings ({Object.keys(result.settings).length})
          </h2>
          <ul className="mt-3 divide-y divide-edge">
            {Object.entries(result.settings).map(([key, value]) => (
              <li key={key} className="flex items-start justify-between gap-4 py-2">
                <code className="text-sm text-slate-200">{key}</code>
                <code className="max-w-[60%] break-all text-right text-sm text-muted">
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
