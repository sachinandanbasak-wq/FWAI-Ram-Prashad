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
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-slate-600">
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

      {params.error && (
        <p className="state-failed mt-4 rounded-lg border p-4 text-sm">
          {params.error}
        </p>
      )}

      <form action={signIn} className="card mt-4 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded bg-ink px-3 py-2 text-sm font-medium text-white"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
