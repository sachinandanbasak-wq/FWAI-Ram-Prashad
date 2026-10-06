"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { TricolourBar } from "@/components/Jet";
import { signOut } from "@/app/auth/actions";

/**
 * Responsive workspace frame. On wide screens the sidebar is fixed in flow; on
 * narrow screens it becomes an off-canvas drawer, so the page never scrolls
 * sideways.
 */
export function WorkspaceShell({
  companyName,
  email,
  role,
  children,
}: {
  companyName: string | null;
  email: string | null;
  role: string | null;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <TricolourBar className="h-1 w-full" />

      <div className="flex min-h-[calc(100vh-0.25rem)]">
        {open && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          />
        )}

        <div
          className={`fixed inset-y-0 left-0 z-40 w-60 transform bg-panel transition-transform duration-200 lg:static lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar companyName={companyName} onNavigate={() => setOpen(false)} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex flex-wrap items-center gap-2 border-b border-edge bg-panel/60 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="btn-ghost px-2 py-1 lg:hidden"
            >
              <span aria-hidden="true">☰</span>
            </button>

            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="truncate text-slate-300">
                {companyName ?? "Defence CRM"}
              </span>
              <span className="text-slate-600">/</span>
              <span className="font-medium text-slate-100">Operations</span>
            </div>

            <div className="ml-auto flex items-center gap-2 text-sm sm:gap-3">
              <Link href="/demo" className="nav-link hidden sm:inline-flex">
                Demo evaluator
              </Link>
              {email ? (
                <>
                  <span className="hidden max-w-[12rem] truncate text-slate-300 sm:inline">
                    {email}
                  </span>
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

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">{children}</main>

          <footer className="border-t border-edge px-4 py-3 text-xs text-slate-500 sm:px-6">
            Records marked SAMPLE are placeholders only. No business figures are
            shown unless they come from your own records.
          </footer>
        </div>
      </div>
    </div>
  );
}
