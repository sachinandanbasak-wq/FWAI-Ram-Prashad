"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const CUSTOMER_STAGES = ["New", "Contacted", "Quoted", "Won"];

/** Redirect back to a masters list with a message. Declared `never` so the
 *  compiler knows control does not continue past a validation failure. */
function back(path: string, params: Record<string, string>): never {
  redirect(`${path}?${new URLSearchParams(params).toString()}`);
}

function friendly(message: string, code?: string): string {
  if (code === "23505") return "That name already exists. Choose another.";
  if (code === "23514") return "That value is not allowed. Check it and try again.";
  if (code === "23503") return "That reference does not exist.";
  return message;
}

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

function numberOrNull(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (raw.length === 0) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export async function createCustomer(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) back("/masters/customers", { error: "Customer name is required." });

  const supabase = await createSupabaseServerClient();
  if (!supabase) back("/masters/customers", { error: "A setting is missing, so nothing was saved." });

  const { error } = await supabase.from("customers").insert({
    name,
    phone: text(formData, "phone"),
    source: text(formData, "source"),
    next_followup_date: text(formData, "next_followup_date"),
    stage: "New",
  });

  if (error) back("/masters/customers", { error: friendly(error.message, error.code) });

  revalidatePath("/masters/customers");
  back("/masters/customers", { saved: `Customer "${name}" saved.` });
}

export async function updateCustomerStage(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const stage = String(formData.get("stage") ?? "").trim();

  if (!id || !CUSTOMER_STAGES.includes(stage)) return;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  const { error } = await supabase.from("customers").update({ stage }).eq("id", id);
  if (error) return;

  revalidatePath("/masters/customers");
  revalidatePath("/follow-ups");
}

export async function createOem(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) back("/masters/oems", { error: "OEM name is required." });

  const supabase = await createSupabaseServerClient();
  if (!supabase) back("/masters/oems", { error: "A setting is missing, so nothing was saved." });

  const { error } = await supabase.from("oems").insert({
    name,
    country_of_origin: text(formData, "country_of_origin"),
    brand_category: text(formData, "brand_category"),
    payment_terms: text(formData, "payment_terms"),
    commission_percent: numberOrNull(formData, "commission_percent"),
    is_approved: formData.get("is_approved") !== null,
  });

  if (error) back("/masters/oems", { error: friendly(error.message, error.code) });
  back("/masters/oems", { saved: `OEM "${name}" saved.` });
}

export async function createProduct(formData: FormData): Promise<void> {
  const description = String(formData.get("description") ?? "").trim();
  if (!description) back("/masters/products", { error: "Part description is required." });

  const supabase = await createSupabaseServerClient();
  if (!supabase) back("/masters/products", { error: "A setting is missing, so nothing was saved." });

  const { error } = await supabase.from("products").insert({
    description,
    client_part_number: text(formData, "client_part_number"),
    oem_part_number: text(formData, "oem_part_number"),
    hsn_code: text(formData, "hsn_code"),
    uom: text(formData, "uom") ?? "Nos",
    category: text(formData, "category"),
    technical_specification: text(formData, "technical_specification"),
    standard_price: numberOrNull(formData, "standard_price"),
  });

  if (error) back("/masters/products", { error: friendly(error.message, error.code) });
  back("/masters/products", { saved: `Part "${description}" saved.` });
}
