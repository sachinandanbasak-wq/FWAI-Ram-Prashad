import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Defence Contract CRM",
  description: "One requirement, one record, one timeline.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-slate-500">
          Step 1.1 shell. No real data is shown anywhere; sample rows are always
          labelled SAMPLE.
        </footer>
      </body>
    </html>
  );
}
