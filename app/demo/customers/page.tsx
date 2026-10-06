"use client";

import { useEffect, useMemo, useState } from "react";
import { Jet } from "@/components/Jet";

type DemoCustomer = {
  id: string;
  name: string;
  phone: string;
  source: string;
  stage: string;
  next_followup_date: string;
};

const STAGES = ["New", "Contacted", "Quoted", "Won"];
const SOURCES = ["Call", "WhatsApp", "Referral"];
const KEY = "indian-defence-crm-demo-customers";

function todayInKolkata(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function seed(): DemoCustomer[] {
  const today = todayInKolkata();
  return [
    { id: crypto.randomUUID(), name: "SAMPLE - Customer A", phone: "+91-9000000001", source: "Call", stage: "Contacted", next_followup_date: today },
    { id: crypto.randomUUID(), name: "SAMPLE - Customer B", phone: "+91-9000000002", source: "WhatsApp", stage: "New", next_followup_date: today },
  ];
}

export default function DemoCustomersPage() {
  const [rows, setRows] = useState<DemoCustomer[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const today = useMemo(() => todayInKolkata(), []);

  // Load the started list, or seed it the first time.
  useEffect(() => {
    const stored = window.localStorage.getItem(KEY);
    setRows(stored ? (JSON.parse(stored) as DemoCustomer[]) : seed());
    setReady(true);
  }, []);

  // Persist every change, so stage changes survive a reload.
  useEffect(() => {
    if (ready) window.localStorage.setItem(KEY, JSON.stringify(rows));
  }, [rows, ready]);

  function addCustomer(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;
    const row: DemoCustomer = {
      id: crypto.randomUUID(),
      name,
      phone: String(formData.get("phone") ?? "").trim(),
      source: String(formData.get("source") ?? "").trim() || "—",
      stage: "New",
      next_followup_date: String(formData.get("next_followup_date") ?? "") || today,
    };
    setRows((current) => [row, ...current]);
    setOpen(false);
  }

  function setStage(id: string, stage: string) {
    setRows((current) => current.map((r) => (r.id === id ? { ...r, stage } : r)));
  }

  const followUps = rows.filter(
    (r) => r.next_followup_date && r.next_followup_date <= today && r.stage !== "Won",
  );

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Demo evaluator / Sample data
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-muted">
            Add a customer, then move them through the pipeline. Changes are kept
            in this browser so they survive a reload.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Jet className="h-12 w-12 text-accent/40" />
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">
            SAMPLE DATA — browser only
          </span>
        </div>
      </section>

      <section>
        <button type="button" onClick={() => setOpen((v) => !v)} className="btn-primary">
          {open ? "Close" : "Add Customer"}
        </button>

        {open && (
          <form action={addCustomer} className="card mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-300 sm:col-span-2">
              Name (required)
              <input name="name" required className="field" placeholder="Customer or agency name" />
            </label>
            <label className="text-sm font-medium text-slate-300">
              Phone
              <input name="phone" className="field" placeholder="+91 90000 00000" />
            </label>
            <label className="text-sm font-medium text-slate-300">
              Source
              <select name="source" defaultValue="Call" className="field">
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-300">
              Follow-up date
              <input name="next_followup_date" type="date" defaultValue={today} className="field" />
            </label>
            <div className="flex items-end sm:col-span-2">
              <button type="submit" className="btn-primary">
                Save customer
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-xl border border-edge bg-panel">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-edge/70">
                  <td className="px-4 py-3 font-medium text-slate-100">{row.name}</td>
                  <td className="px-4 py-3 text-slate-300">{row.phone || "—"}</td>
                  <td className="px-4 py-3 text-slate-300">{row.source}</td>
                  <td className="px-4 py-3">
                    <select
                      value={row.stage}
                      onChange={(event) => setStage(row.id, event.target.value)}
                      aria-label="Stage"
                      className="rounded-lg border border-edge bg-[#0b1220] px-2 py-1 text-xs text-slate-100 focus:border-accent focus:outline-none"
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{row.next_followup_date || "—"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted">
                    No customers yet. Use Add Customer above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Follow-ups Today</h2>
          <p className="mt-1 text-sm text-muted">
            Due today or earlier, not yet Won.
          </p>
        </div>

        <div className="rounded-xl border border-edge bg-panel">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-edge text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium">Stage</th>
                </tr>
              </thead>
              <tbody>
                {followUps.map((row) => (
                  <tr key={row.id} className="border-t border-edge/70">
                    <td className="px-4 py-3 font-medium text-slate-100">{row.name}</td>
                    <td className="px-4 py-3 text-slate-300">{row.phone || "—"}</td>
                    <td className="px-4 py-3 text-slate-300">{row.source}</td>
                    <td className="px-4 py-3">
                      <span className={row.next_followup_date < today ? "pill-late" : "pill-risk"}>
                        {row.next_followup_date < today ? "Overdue" : "Today"} · {row.next_followup_date}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={row.stage}
                        onChange={(event) => setStage(row.id, event.target.value)}
                        aria-label="Stage"
                        className="rounded-lg border border-edge bg-[#0b1220] px-2 py-1 text-xs text-slate-100 focus:border-accent focus:outline-none"
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {followUps.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted">
                      Nothing due today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <p className="text-xs text-slate-500">
        This demo keeps changes in this browser only. The real Customers and
        Follow-ups screens save to the database and need the owner sign-in.
      </p>
    </div>
  );
}
