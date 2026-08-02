"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export type SpaceItem = {
  id?: string;
  source_image_url: string;
  label: string | null;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  z: number;
};

export type Space = {
  id: string;
  owner_id: string;
  title: string;
  base_image_url: string;
  base_type: "photo" | "video";
  is_public: boolean;
  updated_at: string;
};

/** Create a new space from an uploaded base photo. Returns its id. */
export async function createSpace(
  baseImageUrl: string,
  baseType: "photo" | "video",
  title?: string,
): Promise<{ id?: string; error?: string }> {
  const url = baseImageUrl?.trim();
  if (!url) return { error: "Add a photo of your space first." };

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "sign_in" };

  const { data, error } = await supabase
    .from("spaces")
    .insert({
      owner_id: user.id,
      title: title?.trim().slice(0, 120) || "Untitled space",
      base_image_url: url,
      base_type: baseType === "video" ? "video" : "photo",
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("createSpace failed:", error?.code, error?.message);
    return { error: "Couldn't create that space. Please try again." };
  }
  revalidatePath("/spaces");
  return { id: data.id };
}

/** The signed-in user's spaces, newest first. */
export async function listMySpaces(): Promise<Space[]> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("spaces")
    .select("id, owner_id, title, base_image_url, base_type, is_public, updated_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("listMySpaces failed:", error.code, error.message);
    return [];
  }
  return (data ?? []) as Space[];
}

/**
 * Replace a space's placed items with the given set. RLS restricts writes to
 * the owner. Also bumps the space's updated_at.
 */
export async function saveItems(
  spaceId: string,
  items: SpaceItem[],
): Promise<{ ok: boolean; error?: string }> {
  if (!spaceId) return { ok: false, error: "Missing space." };
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sign_in" };

  const { error: delErr } = await supabase.from("space_items").delete().eq("space_id", spaceId);
  if (delErr) {
    console.error("saveItems delete failed:", delErr.code, delErr.message);
    return { ok: false, error: "Couldn't save. Please try again." };
  }

  const clean = (items ?? []).slice(0, 100).map((it, i) => ({
    space_id: spaceId,
    source_image_url: String(it.source_image_url).slice(0, 1000),
    label: it.label ? String(it.label).slice(0, 160) : null,
    x: clamp(it.x, 0, 1),
    y: clamp(it.y, 0, 1),
    scale: clamp(it.scale, 0.02, 2),
    rotation: ((Number(it.rotation) || 0) % 360),
    z: Number.isFinite(it.z) ? Math.trunc(it.z) : i,
  }));

  if (clean.length > 0) {
    const { error: insErr } = await supabase.from("space_items").insert(clean);
    if (insErr) {
      console.error("saveItems insert failed:", insErr.code, insErr.message);
      return { ok: false, error: "Couldn't save. Please try again." };
    }
  }

  await supabase.from("spaces").update({ updated_at: new Date().toISOString() }).eq("id", spaceId);
  revalidatePath(`/spaces/${spaceId}`);
  return { ok: true };
}

export async function renameSpace(spaceId: string, title: string): Promise<{ ok: boolean }> {
  if (!spaceId) return { ok: false };
  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("spaces")
    .update({ title: title.trim().slice(0, 120) || "Untitled space" })
    .eq("id", spaceId);
  if (error) return { ok: false };
  revalidatePath(`/spaces/${spaceId}`);
  return { ok: true };
}

export async function setSpacePublic(spaceId: string, isPublic: boolean): Promise<{ ok: boolean }> {
  if (!spaceId) return { ok: false };
  const supabase = await supabaseServer();
  const { error } = await supabase.from("spaces").update({ is_public: isPublic }).eq("id", spaceId);
  if (error) return { ok: false };
  revalidatePath(`/spaces/${spaceId}`);
  return { ok: true };
}

export async function deleteSpace(spaceId: string): Promise<{ ok: boolean }> {
  if (!spaceId) return { ok: false };
  const supabase = await supabaseServer();
  const { error } = await supabase.from("spaces").delete().eq("id", spaceId);
  if (error) return { ok: false };
  revalidatePath("/spaces");
  return { ok: true };
}

function clamp(n: number, lo: number, hi: number): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return lo;
  return Math.min(hi, Math.max(lo, v));
}
