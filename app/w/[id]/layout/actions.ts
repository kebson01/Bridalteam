"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { failWith } from "@/lib/flash";
import { SUPABASE_URL } from "@/lib/supabase";
import { FLOOR_SOURCES, cleanDimension, sanitizeItems, tableKey, type FloorSource } from "@/lib/venue-layout";

// RLS enforces edit access: venue_layouts writes are can_edit_wedding(wedding_id).

export interface VenueLayout {
  id: string;
  name: string;
  base_image_url: string | null;
  floor_source: FloorSource | null;
  width_ft: number;
  length_ft: number;
  items: unknown;
  updated_at: string;
}

const COLUMNS = "id, name, base_image_url, floor_source, width_ft, length_ft, items, updated_at";

export async function listLayouts(weddingId: string): Promise<VenueLayout[] | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("venue_layouts")
    .select(COLUMNS)
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("listLayouts failed:", error.code, error.message);
    return null;
  }
  return (data ?? []).map(normalize);
}

export async function getLayout(weddingId: string, layoutId: string): Promise<VenueLayout | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("venue_layouts")
    .select(COLUMNS)
    .eq("wedding_id", weddingId)
    .eq("id", layoutId)
    .maybeSingle();
  if (error) console.error("getLayout failed:", error.code, error.message);
  return data ? normalize(data) : null;
}

// numeric columns come back from PostgREST as strings.
function normalize(r: Record<string, unknown>): VenueLayout {
  return {
    ...(r as unknown as VenueLayout),
    width_ft: Number(r.width_ft),
    length_ft: Number(r.length_ft),
  };
}

/**
 * How many people are seated at each table, keyed by tableKey(), so the
 * editor can show "7 / 8" on a table labelled "4" for guests at "Table 4".
 * Null when it couldn't be read — the layout still works without it.
 */
export async function seatedByTable(weddingId: string): Promise<Record<string, number> | null> {
  const supabase = await supabaseServer();
  const { data: guests, error } = await supabase
    .from("wedding_guests")
    .select("id")
    .eq("wedding_id", weddingId);
  if (error) {
    console.error("seatedByTable guests failed:", error.message);
    return null;
  }
  if (!guests?.length) return {};
  const { data: rows, error: aErr } = await supabase
    .from("guest_attendees")
    .select("table_name")
    .in("guest_id", guests.map((g) => g.id as string))
    .not("table_name", "is", null);
  if (aErr) {
    console.error("seatedByTable attendees failed:", aErr.message);
    return null;
  }
  const counts: Record<string, number> = {};
  for (const r of rows ?? []) {
    const k = tableKey((r.table_name as string) ?? "");
    if (k) counts[k] = (counts[k] ?? 0) + 1;
  }
  return counts;
}

export async function createLayout(weddingId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 80) || "Reception";
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("venue_layouts")
    .insert({ wedding_id: weddingId, name })
    .select("id")
    .single();
  if (error || !data) failWith(`/w/${weddingId}/layout`, "Couldn’t create that layout. Please try again.", error);
  revalidatePath(`/w/${weddingId}/layout`);
  redirect(`/w/${weddingId}/layout/${data.id}`);
}

export async function deleteLayout(weddingId: string, layoutId: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase.from("venue_layouts").delete().eq("id", layoutId).eq("wedding_id", weddingId);
  if (error) failWith(`/w/${weddingId}/layout`, "Couldn’t delete that layout. Please try again.", error);
  revalidatePath(`/w/${weddingId}/layout`);
  redirect(`/w/${weddingId}/layout`);
}

export interface LayoutPatch {
  name?: string;
  /** A public URL in our own wedding-media bucket, or null to remove the picture. */
  base_image_url?: string | null;
  floor_source?: FloorSource | null;
  width_ft?: number;
  length_ft?: number;
  items?: unknown;
}

/**
 * The editor's autosave. Called with the whole layout after each change
 * settles, so every field is re-validated here rather than trusted: the items
 * go through sanitizeItems, and the picture must be one uploaded into THIS
 * wedding's folder — anything else could make the page load an image from an
 * arbitrary host for everyone on the team.
 */
export async function saveLayout(
  weddingId: string,
  layoutId: string,
  patch: LayoutPatch,
): Promise<{ ok: boolean; error?: string; updated_at?: string }> {
  if (!weddingId || !layoutId) return { ok: false, error: "Missing layout." };

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) update.name = patch.name.trim().slice(0, 80) || "Reception";

  if (patch.base_image_url !== undefined) {
    const prefix = `${SUPABASE_URL}/storage/v1/object/public/wedding-media/${weddingId}/`;
    if (patch.base_image_url !== null && !patch.base_image_url.startsWith(prefix)) {
      return { ok: false, error: "That picture can’t be used." };
    }
    update.base_image_url = patch.base_image_url;
  }

  if (patch.floor_source !== undefined) {
    update.floor_source = FLOOR_SOURCES.includes(patch.floor_source as FloorSource) ? patch.floor_source : null;
  }

  const supabase = await supabaseServer();

  // Items are clamped to the floor, so they need the room size — the new one
  // if it's changing in this same save, otherwise what's stored.
  let width = patch.width_ft !== undefined ? cleanDimension(patch.width_ft, 60) : undefined;
  let length = patch.length_ft !== undefined ? cleanDimension(patch.length_ft, 40) : undefined;
  if (width !== undefined) update.width_ft = width;
  if (length !== undefined) update.length_ft = length;

  if (patch.items !== undefined) {
    if (width === undefined || length === undefined) {
      const { data: cur } = await supabase
        .from("venue_layouts")
        .select("width_ft, length_ft")
        .eq("id", layoutId)
        .maybeSingle();
      if (!cur) return { ok: false, error: "That layout no longer exists." };
      width ??= Number(cur.width_ft);
      length ??= Number(cur.length_ft);
    }
    update.items = sanitizeItems(patch.items, width, length);
  }

  const { data, error } = await supabase
    .from("venue_layouts")
    .update(update)
    .eq("id", layoutId)
    .eq("wedding_id", weddingId)
    .select("updated_at")
    .maybeSingle();
  if (error) {
    console.error("saveLayout failed:", error.code, error.message);
    return { ok: false, error: "Couldn’t save. Check your connection and try again." };
  }
  if (!data) return { ok: false, error: "You don’t have permission to edit this layout." };

  revalidatePath(`/w/${weddingId}/layout`);
  return { ok: true, updated_at: data.updated_at as string };
}
