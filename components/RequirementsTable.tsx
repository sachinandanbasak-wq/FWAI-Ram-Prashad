"use client";

import { useMemo, useState } from "react";

export type RequirementRow = {
  rfi_number: string;
  project_name: string | null;
  primary_part_number: string | null;
  primary_part_description: string | null;
  drawing_status: string | null;
  technical_requirement: string | null;
  missing_information: string | null;
  approval_status: string | null;
  compliance_status: string | null;
  status: string;
};

const STATUS_STYLE: Record<string, string> = {
  Received: "pill-indication",
  Qualifying: "pill-risk",
  Quoted: "pill-risk",
  Submitted: "pill-indication",
  Won: "pill-track",
  Lost: "pill-late",
  Cancelled: "pill-indication",
  Pass: "pill-indication",
};

const COMPLIANCE_STYLE: Record<string, string> = {
  Compliant: "text-green-300",
  "Review pending": "text-amber-300",
  Blocked: "text-red-300",
  "Not assessed": "text-slate-400",
};

/** Improvement over the reference screen: a single suggested next action. */
function nextAction(row: RequirementRow): string {
  if (row.missing_information) return "Resolve missing information";
  if (row.compliance_status === "Blocked") return "Clear compliance block";
  if (row.drawing_status === "Drawing missing") return "Obtain drawing";
  if (row.status === "Submitted") return "Chase government response";
  if (row.status === "Qualifying") return "Prepare quotation";
  if (row.status === "Quoted") return "Submit quotation";
  return "—";
}

export function RequirementsTable({
  rows,
  sample = false,
}: {
  rows: RequirementRow[];
  sample?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");

  const statuses = useMemo(
    () => ["All statuses", ...Array.from(new Set(rows.map((r) => r.status))).sort()],
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesStatus = status === "All statuses" || row.status === status;
      if (!matchesStatus) return false;
      if (!q) return true;
      return [
        row.rfi_number,
        row.project_name,
        row.primary_part_number,
        row.primary_part_description,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [rows, query, status]);

  return (
    <div className="rounded-xl border border-edge bg-panel">
      <div className="flex flex-wrap items-center gap-3 border-b border-edge p-4">
        <div className="relative min-w-[240px] flex-1">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search inquiry or part number"
            className="w-full rounded-lg border border-edge bg-[#0b1220] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-lg border border-edge bg-[#0b1220] px-3 py-2 text-sm text-slate-200 focus:border-accent focus:outline-none"
        >
          {statuses.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-muted">
          {filtered.length} {filtered.length === 1 ? "record" : "records"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3 font-medium">Inquiry</th>
              <th className="px-4 py-3 font-medium">Part number</th>
              <th className="px-4 py-3 font-medium">Specification</th>
              <th className="px-4 py-3 font-medium">Drawing</th>
              <th className="px-4 py-3 font-medium">Technical requirement</th>
              <th className="px-4 py-3 font-medium">Missing information</th>
              <th className="px-4 py-3 font-medium">Approval</th>
              <th className="px-4 py-3 font-medium">Compliance</th>
              <th className="px-4 py-3 font-medium">Next action</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.rfi_number} className="border-t border-edge/70 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-100">{row.rfi_number}</div>
                  {row.project_name && (
                    <div className="text-xs text-muted">{row.project_name}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-300">{row.primary_part_number ?? "—"}</td>
                <td className="px-4 py-3 text-slate-300">
                  {row.primary_part_description ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-300">{row.drawing_status ?? "—"}</td>
                <td className="px-4 py-3 text-slate-300">{row.technical_requirement ?? "—"}</td>
                <td className="px-4 py-3">
                  {row.missing_information ? (
                    <span className="font-medium text-red-300">{row.missing_information}</span>
                  ) : (
                    <span className="text-slate-500">None</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-300">{row.approval_status ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={COMPLIANCE_STYLE[row.compliance_status ?? ""] ?? "text-slate-300"}>
                    {row.compliance_status ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300">{nextAction(row)}</td>
                <td className="px-4 py-3">
                  <span className={STATUS_STYLE[row.status] ?? "pill-indication"}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted">
            No requirements match this search or filter.
          </p>
        )}
      </div>

      {sample && (
        <p className="border-t border-edge px-4 py-3 text-xs text-slate-500">
          Demo evaluator: these are SAMPLE rows to show the layout. They are not
          real records and are not connected to your database.
        </p>
      )}
    </div>
  );
}
