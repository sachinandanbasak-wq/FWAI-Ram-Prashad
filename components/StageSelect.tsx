"use client";

import { useRef } from "react";
import { updateCustomerStage } from "@/app/masters/actions";

const STAGES = ["New", "Contacted", "Quoted", "Won"];

/** A stage dropdown that saves the moment it changes, so the new stage survives a reload. */
export function StageSelect({ id, stage }: { id: string; stage: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={updateCustomerStage} className="inline-block">
      <input type="hidden" name="id" value={id} />
      <select
        name="stage"
        defaultValue={stage}
        aria-label="Stage"
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-lg border border-edge bg-[#0b1220] px-2 py-1 text-xs text-slate-100 focus:border-accent focus:outline-none"
      >
        {STAGES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="btn-ghost ml-1 text-xs">
          Save
        </button>
      </noscript>
    </form>
  );
}
