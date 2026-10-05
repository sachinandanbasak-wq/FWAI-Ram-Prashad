import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

export const metadata: Metadata = {
  title: "Defence Contract CRM",
  description: "One requirement, one record, one timeline.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();

  let email: string | null = null;
  let role: string | null = null;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      email = user.email ?? null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      role = (profile as { role?: string } | null)?.role ?? null;
    }
  }

  return (
    <html lang="en">
      <body>
        <header className="bg-ink text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-base font-semibold tracking-tight">
              Defence Contract CRM
            </Link>
            <nav className="flex items-center gap-1">
              <Link href="/" className="nav-link">
                Dashboard
              </Link>
              <Link href="/settings" className="nav-link">
                Settings
              </Link>
              {email ? (
                <div className="ml-2 flex items-center gap-2 border-l border-white/20 pl-3">
                  <span className="text-xs text-slate-300">
                    {email}
                    <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5">
                      {role ?? "no role"}
                    </span>
                  </span>
                  <form action={signOut}>
                    <button type="submit" className="nav-link">
                      Sign out
                    </button>
                  </form>
                </div>
              ) : (
                <Link href="/login" className="nav-link">
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-slate-500">
          Sample rows are always labelled SAMPLE. No business figures are shown
          unless they come from your own records.
        </footer>
      </body>
    </html>
  );
}
