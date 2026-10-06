"use client";

import { useState } from "react";
import { createCustomer } from "@/app/masters/actions";

export function AddCustomerPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button type="button" onClick={() => setOpen((v) => !v)} className="btn-primary">
        {open ? "Close" : "Add Customer"}
      </button>

      {open && (
        <form action={createCustomer} className="card mt-4 grid gap-4 sm:grid-cols-2">
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
            <select name="source" defaultValue="" className="field">
              <option value="">Choose a source</option>
              <option value="Call">Call</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Referral">Referral</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-300">
            Follow-up date
            <input name="next_followup_date" type="date" className="field" />
          </label>
          <div className="flex items-end sm:col-span-2">
            <button type="submit" className="btn-primary">
              Save customer
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
