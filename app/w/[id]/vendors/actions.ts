"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

// RLS enforces edit access; no permission checks in application code.

const STATUSES = new Set(["considering", "contacted", "booked", "declined"]);

export async function addVendor(weddingId: string, name: string, category: string) {
  const n = name.trim().slice(0, 160);
  if (!weddingId || !n) return;

  const supabase = await supabaseServer();
  const { data: last } = await supabase
    .from("wedding_vendors")
    .select("position")
    .eq("wedding_id", weddingId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("wedding_vendors").insert({
    wedding_id: weddingId,
    name: n,
    category: category.trim().slice(0, 80) || null,
    position: (last?.position ?? 0) + 1,
  });
  if (error) console.error("addVendor failed:", error.code, error.message);
  revalidatePath(`/w/${weddingId}/vendors`);
}

export interface VendorPatch {
  name?: string;
  category?: string;
  status?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  costDollars?: number;
  paidDollars?: number;
  next_payment_date?: string;
  contract_signed?: boolean;
  next_appointment?: string;
  notes?: string;
}

function cents(n: number | undefined) {
  if (n == null || !Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}
function text(v: string | undefined, max: number) {
  if (v == null) return undefined;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

export async function updateVendor(id: string, weddingId: string, patch: VendorPatch) {
  if (!id || !weddingId) return;

  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = text(patch.name, 160) ?? "Unnamed";
  if (patch.category !== undefined) update.category = text(patch.category, 80);
  if (patch.status !== undefined && STATUSES.has(patch.status)) update.status = patch.status;
  if (patch.contact_name !== undefined) update.contact_name = text(patch.contact_name, 120);
  if (patch.email !== undefined) update.email = text(patch.email, 200);
  if (patch.phone !== undefined) update.phone = text(patch.phone, 40);
  if (patch.website !== undefined) update.website = text(patch.website, 200);
  if (patch.costDollars !== undefined) update.cost_cents = cents(patch.costDollars);
  if (patch.paidDollars !== undefined) update.paid_cents = cents(patch.paidDollars);
  if (patch.next_payment_date !== undefined) update.next_payment_date = patch.next_payment_date || null;
  if (patch.contract_signed !== undefined) update.contract_signed = Boolean(patch.contract_signed);
  if (patch.next_appointment !== undefined) update.next_appointment = patch.next_appointment || null;
  if (patch.notes !== undefined) update.notes = text(patch.notes, 2000);

  if (Object.keys(update).length === 0) return;

  const supabase = await supabaseServer();
  const { error } = await supabase.from("wedding_vendors").update(update).eq("id", id);
  if (error) console.error("updateVendor failed:", error.code, error.message);
  revalidatePath(`/w/${weddingId}/vendors`);
}

export async function deleteVendor(id: string, weddingId: string) {
  if (!id || !weddingId) return;
  const supabase = await supabaseServer();
  const { error } = await supabase.from("wedding_vendors").delete().eq("id", id);
  if (error) console.error("deleteVendor failed:", error.code, error.message);
  revalidatePath(`/w/${weddingId}/vendors`);
}
