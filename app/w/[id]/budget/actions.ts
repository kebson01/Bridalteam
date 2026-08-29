"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { failWith } from "@/lib/flash";
import { BUDGET_TEMPLATE } from "@/lib/budget-template";

// All of these run as the signed-in user; RLS enforces edit access, so there's
// no permission check in application code.

function toCents(dollars: number) {
  if (!Number.isFinite(dollars) || dollars < 0) return 0;
  return Math.round(dollars * 100);
}

export async function seedBudget(weddingId: string) {
  if (!weddingId) return;
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("seed_wedding_budget", {
    p_wedding_id: weddingId,
    p_template: BUDGET_TEMPLATE,
  });
  if (error) failWith(`/w/${weddingId}/budget`, "Couldn’t build your starter budget. Please try again.", error);
  revalidatePath(`/w/${weddingId}/budget`);
}

export async function addBudgetItem(
  weddingId: string,
  category: string,
  label: string,
  estimatedDollars: number,
) {
  const cat = category.trim().slice(0, 80);
  const name = label.trim().slice(0, 120);
  if (!weddingId || !cat || !name) return;

  const supabase = await supabaseServer();
  const { data: last } = await supabase
    .from("budget_items")
    .select("position")
    .eq("wedding_id", weddingId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("budget_items").insert({
    wedding_id: weddingId,
    category: cat,
    label: name,
    estimated_cents: toCents(estimatedDollars),
    position: (last?.position ?? 0) + 1,
  });
  if (error) failWith(`/w/${weddingId}/budget`, "Couldn’t add that line item. Please try again.", error);
  revalidatePath(`/w/${weddingId}/budget`);
}

export async function updateBudgetItem(
  id: string,
  weddingId: string,
  estimatedDollars: number,
  paidDollars: number,
) {
  if (!id || !weddingId) return;
  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("budget_items")
    .update({ estimated_cents: toCents(estimatedDollars), paid_cents: toCents(paidDollars) })
    .eq("id", id);
  if (error) failWith(`/w/${weddingId}/budget`, "Couldn’t save that amount. Please try again.", error);
  revalidatePath(`/w/${weddingId}/budget`);
}

export async function deleteBudgetItem(id: string, weddingId: string) {
  if (!id || !weddingId) return;
  const supabase = await supabaseServer();
  const { error } = await supabase.from("budget_items").delete().eq("id", id);
  if (error) failWith(`/w/${weddingId}/budget`, "Couldn’t delete that line item. Please try again.", error);
  revalidatePath(`/w/${weddingId}/budget`);
}
