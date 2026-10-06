import type { Metadata } from "next";
import "./globals.css";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Indian Defence CRM",
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
        <WorkspaceShell companyName={companyName} email={email} role={role}>
          {children}
        </WorkspaceShell>
      </body>
    </html>
  );
}
