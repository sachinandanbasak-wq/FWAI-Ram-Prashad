import { signIn } from "./actions";
import { MissingState } from "@/components/States";
import { readConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const config = readConfig();

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Sign in</h1>
      <p className="mt-1 text-sm text-muted">
        Use the email and password the Owner created for you.
      </p>

      {!config.configured && (
        <div className="mt-4">
          <MissingState
            title="A setting is missing, so sign-in is unavailable"
            items={config.missing}
            hint="Add these to .env.local and restart."
          />
        </div>
      )}

      {params.error && <p className="state-failed mt-4 p-4 text-sm">{params.error}</p>}

      <form action={signIn} className="card mt-4 space-y-4">
        <label className="block text-sm font-medium text-slate-300">
          Email
          <input name="email" type="email" autoComplete="email" required className="field" />
        </label>
        <label className="block text-sm font-medium text-slate-300">
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="field"
          />
        </label>
        <button type="submit" className="btn-primary w-full">
          Sign in
        </button>
      </form>
    </div>
  );
}
