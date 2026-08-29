"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { failWith } from "@/lib/flash";

// RLS enforces edit access.

const KINDS = new Set(["lodging", "transport", "info"]);

export async function addTravelItem(weddingId: string, kind: string, title: string) {
  const t = title.trim().slice(0, 160);
  const k = KINDS.has(kind) ? kind : "lodging";
  if (!weddingId || !t) return;

  const supabase = await supabaseServer();
  const { data: last } = await supabase
    .from("travel_items")
    .select("position")
    .eq("wedding_id", weddingId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("travel_items").insert({
    wedding_id: weddingId,
    kind: k,
    title: t,
    position: (last?.position ?? 0) + 1,
  });
  if (error) failWith(`/w/${weddingId}/travel`, "Couldn’t add that. Please try again.", error);
  revalidatePath(`/w/${weddingId}/travel`);
}

export interface TravelPatch {
  title?: string;
  location?: string;
  url?: string;
  code?: string;
  reserve_by?: string;
  rateDollars?: number;
  detail?: string;
}

function text(v: string | undefined, max: number) {
  if (v == null) return undefined;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

export async function updateTravelItem(id: string, weddingId: string, patch: TravelPatch) {
  if (!id || !weddingId) return;

  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = text(patch.title, 160) ?? "Untitled";
  if (patch.location !== undefined) update.location = text(patch.location, 200);
  if (patch.url !== undefined) update.url = text(patch.url, 300);
  if (patch.code !== undefined) update.code = text(patch.code, 80);
  if (patch.reserve_by !== undefined) update.reserve_by = patch.reserve_by || null;
  if (patch.rateDollars !== undefined)
    update.rate_cents =
      Number.isFinite(patch.rateDollars) && patch.rateDollars! > 0
        ? Math.round(patch.rateDollars! * 100)
        : null;
  if (patch.detail !== undefined) update.detail = text(patch.detail, 2000);

  if (Object.keys(update).length === 0) return;

  const supabase = await supabaseServer();
  const { error } = await supabase.from("travel_items").update(update).eq("id", id);
  if (error) failWith(`/w/${weddingId}/travel`, "Couldn’t save that change. Please try again.", error);
  revalidatePath(`/w/${weddingId}/travel`);
}

export async function deleteTravelItem(id: string, weddingId: string) {
  if (!id || !weddingId) return;
  const supabase = await supabaseServer();
  const { error } = await supabase.from("travel_items").delete().eq("id", id);
  if (error) failWith(`/w/${weddingId}/travel`, "Couldn’t delete that. Please try again.", error);
  revalidatePath(`/w/${weddingId}/travel`);
}
