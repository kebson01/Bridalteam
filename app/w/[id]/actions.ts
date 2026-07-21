"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { PLAN_TEMPLATE } from "@/lib/plan-template";

/**
 * Fills an empty wedding with the expert starter plan (milestones, deliverables,
 * tasks and tips), with deadlines computed from the couple's date. The RPC
 * refuses to seed over an existing plan, so this is safe to call more than once.
 */
export async function seedExpertPlan(formData: FormData) {
  const weddingId = String(formData.get("wedding_id") ?? "");
  if (!weddingId) return;

  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("seed_wedding_plan", {
    p_wedding_id: weddingId,
    p_template: PLAN_TEMPLATE,
  });

  if (error) console.error("seedExpertPlan failed:", error.code, error.message);
  revalidatePath(`/w/${weddingId}`);
}

/**
 * Task mutations for a wedding workspace.
 *
 * None of these check permissions in application code — RLS does it. An update
 * the user isn't allowed to make simply matches zero rows, and an insert is
 * rejected outright. That keeps one enforcement point rather than two that can
 * drift apart.
 */

export async function toggleTask(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const weddingId = String(formData.get("wedding_id") ?? "");
  const completed = formData.get("completed") === "true";
  if (!id || !weddingId) return;

  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("tasks")
    .update({ completed_at: completed ? null : new Date().toISOString() })
    .eq("id", id);

  if (error) console.error("toggleTask failed:", error.code, error.message);
  revalidatePath(`/w/${weddingId}`);
}

export async function addTask(formData: FormData) {
  const weddingId = String(formData.get("wedding_id") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 300);
  const dueDate = String(formData.get("due_date") ?? "").trim();
  if (!weddingId || !title) return;

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Append to the end of the list.
  const { data: last } = await supabase
    .from("tasks")
    .select("position")
    .eq("wedding_id", weddingId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("tasks").insert({
    wedding_id: weddingId,
    title,
    due_date: dueDate || null,
    created_by: user?.id ?? null,
    position: (last?.position ?? 0) + 1,
  });

  if (error) console.error("addTask failed:", error.code, error.message);
  revalidatePath(`/w/${weddingId}`);
}

export async function deleteTask(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const weddingId = String(formData.get("wedding_id") ?? "");
  if (!id || !weddingId) return;

  // Soft delete — the task moves to "Recently deleted" and can be restored, so
  // an accidental tap isn't permanent.
  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) console.error("deleteTask failed:", error.code, error.message);
  revalidatePath(`/w/${weddingId}`);
}

/** Brings a soft-deleted task back into the checklist. */
export async function restoreTask(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const weddingId = String(formData.get("wedding_id") ?? "");
  if (!id || !weddingId) return;

  const supabase = await supabaseServer();
  const { error } = await supabase.from("tasks").update({ deleted_at: null }).eq("id", id);
  if (error) console.error("restoreTask failed:", error.code, error.message);
  revalidatePath(`/w/${weddingId}`);
}

/** Permanently removes a task (only offered from the "Recently deleted" view). */
export async function purgeTask(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const weddingId = String(formData.get("wedding_id") ?? "");
  if (!id || !weddingId) return;

  const supabase = await supabaseServer();
  // Guard with a not-null on deleted_at so this can never hit a live task.
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .not("deleted_at", "is", null);
  if (error) console.error("purgeTask failed:", error.code, error.message);
  revalidatePath(`/w/${weddingId}`);
}
