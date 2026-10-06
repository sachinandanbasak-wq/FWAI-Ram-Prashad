import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
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
  let companyName: string | null = null;

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

    const { data: setting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "company_name")
      .maybeSingle();
    const value = (setting as { value?: unknown } | null)?.value;
    if (typeof value === "string" && value.trim().length > 0) {
      companyName = value;
    }
  }

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Sidebar companyName={companyName} />

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center justify-between border-b border-edge bg-panel/60 px-6 py-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-300">
                  {companyName ?? "Defence CRM"}
                </span>
                <span className="text-slate-600">/</span>
                <span className="font-medium text-slate-100">Operations</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Link href="/demo" className="nav-link">
                  Demo evaluator
                </Link>
                {email ? (
                  <>
                    <span className="text-slate-300">{email}</span>
                    <span className="pill-indication">{role ?? "no role"}</span>
                    <form action={signOut}>
                      <button type="submit" className="btn-ghost">
                        Sign out
                      </button>
                    </form>
                  </>
                ) : (
                  <Link href="/login" className="btn-primary">
                    Sign in
                  </Link>
                )}
              </div>
            </header>

            <main className="flex-1 px-6 py-6">{children}</main>

            <footer className="border-t border-edge px-6 py-3 text-xs text-slate-500">
              Records marked SAMPLE are placeholders only. No business figures are
              shown unless they come from your own records.
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
