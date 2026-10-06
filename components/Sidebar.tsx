"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/navigation";
import { Brand } from "@/components/Brand";
import { Jet, TricolourBar } from "@/components/Jet";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ companyName }: { companyName: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-edge bg-panel">
      <div className="border-b border-edge">
        <div className="flex items-center gap-2 px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/15 ring-1 ring-inset ring-accent/40">
            <Jet className="h-5 w-5 text-accent" />
          </span>
          <Brand name={companyName} />
        </div>
        <TricolourBar className="h-1 w-full" />
      </div>

      <div className="mx-3 mt-3 rounded-lg border border-edge bg-panel2 p-3">
        <p className="text-xs font-semibold text-slate-200">Operations workspace</p>
        <p className="mt-0.5 text-[11px] text-muted">Requirements to commission</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                if (!item.ready) {
                  return (
                    <li key={item.href}>
                      <span className="flex items-center justify-between rounded px-2 py-1.5 text-sm text-slate-500">
                        {item.label}
                        <span className="rounded bg-slate-700/40 px-1.5 py-0.5 text-[10px] text-slate-400">
                          Soon
                        </span>
                      </span>
                    </li>
                  );
                }
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={
                        active
                          ? "flex items-center rounded bg-accent/15 px-2 py-1.5 text-sm font-medium text-white ring-1 ring-inset ring-accent/40"
                          : "flex items-center rounded px-2 py-1.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                      }
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
