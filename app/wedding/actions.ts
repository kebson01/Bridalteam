"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export type PublicWedding = {
  partner_one: string | null;
  partner_two: string | null;
  event_date: string | null;
  venue: string | null;
  city: string | null;
  region: string | null;
  welcome_message: string | null;
  /** Hero photo for the guest page, uploaded by the couple. */
  cover_image_url: string | null;
};

export type Rsvp = {
  id: string;
  guest_name: string;
  attending: boolean;
  party_size: number;
  meal: string | null;
  note: string | null;
  created_at: string;
};

export type RegistryLink = { id: string; label: string; url: string };

function normalizeUrl(raw: string): string | null {
  const s = raw?.trim();
  if (!s) return null;
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Public wedding site data by slug (published only). No auth required. */
export async function getPublicWedding(slug: string): Promise<PublicWedding | null> {
  if (!slug) return null;
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("get_public_wedding", { p_slug: slug });
  if (error) {
    console.error("getPublicWedding failed:", error.message);
    return null;
  }
  const row = (data as PublicWedding[] | null)?.[0];
  return row ?? null;
}

/** A guest submits an RSVP to a published wedding. No auth required. */
export async function submitRsvp(input: {
  slug: string;
  name: string;
  attending: boolean;
  partySize?: number;
  meal?: string;
  note?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!input.slug) return { ok: false, error: "Something went wrong." };
  if (!input.name?.trim()) return { ok: false, error: "Please enter your name." };
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("submit_rsvp", {
    p_slug: input.slug,
    p_name: input.name,
    p_attending: input.attending,
    p_party_size: input.partySize ?? 1,
    p_meal: input.meal || null,
    p_note: input.note || null,
  });
  if (error) {
    console.error("submitRsvp failed:", error.message);
    return { ok: false, error: "Couldn't submit your RSVP. Please try again." };
  }
  return { ok: true };
}

function slugify(a: string | null, b: string | null): string {
  const base =
    [a, b]
      .filter(Boolean)
      .join("-")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "our-wedding";
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const suffix = Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `${base}-${suffix}`;
}

/** Publish/unpublish or update a wedding's guest site. Edit permission enforced in the RPC. */
export async function setWeddingWebsite(input: {
  weddingId: string;
  published: boolean;
  welcome: string;
}): Promise<{ ok: boolean; slug?: string; published?: boolean; error?: string }> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sign_in" };

  // Candidate slug from the couple's names (only used on first publish).
  const { data: w } = await supabase
    .from("weddings")
    .select("partner_one, partner_two")
    .eq("id", input.weddingId)
    .maybeSingle();
  const candidate = slugify(w?.partner_one ?? null, w?.partner_two ?? null);

  const { data, error } = await supabase.rpc("set_wedding_website", {
    p_wid: input.weddingId,
    p_published: input.published,
    p_welcome: input.welcome?.slice(0, 2000) || null,
    p_slug: candidate,
  });
  if (error) {
    console.error("setWeddingWebsite failed:", error.message);
    return { ok: false, error: "Couldn't save your site. Please try again." };
  }
  const row = (data as { public_slug: string; website_published: boolean }[] | null)?.[0];
  revalidatePath(`/w/${input.weddingId}/website`);
  return { ok: true, slug: row?.public_slug, published: row?.website_published };
}

/** RSVP responses for a wedding (members only, via RLS). */
export async function listRsvps(weddingId: string): Promise<Rsvp[]> {
  if (!weddingId) return [];
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("rsvps")
    .select("id, guest_name, attending, party_size, meal, note, created_at")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("listRsvps failed:", error.code, error.message);
    return [];
  }
  return (data ?? []) as Rsvp[];
}

/** Registry links for a wedding (members only, via RLS). */
export async function listRegistryLinks(weddingId: string): Promise<RegistryLink[]> {
  if (!weddingId) return [];
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("registry_links")
    .select("id, label, url")
    .eq("wedding_id", weddingId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("listRegistryLinks failed:", error.code, error.message);
    return [];
  }
  return (data ?? []) as RegistryLink[];
}

/** Add a registry link (edit permission enforced by RLS). */
export async function addRegistryLink(input: {
  weddingId: string;
  label: string;
  url: string;
}): Promise<{ ok: boolean; link?: RegistryLink; error?: string }> {
  const label = input.label?.trim().slice(0, 80);
  const url = normalizeUrl(input.url);
  if (!label) return { ok: false, error: "Add a name (e.g. Amazon)." };
  if (!url) return { ok: false, error: "Enter a valid link." };
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("registry_links")
    .insert({ wedding_id: input.weddingId, label, url })
    .select("id, label, url")
    .single();
  if (error || !data) {
    console.error("addRegistryLink failed:", error?.code, error?.message);
    return { ok: false, error: "Couldn't add that link." };
  }
  revalidatePath(`/w/${input.weddingId}/website`);
  return { ok: true, link: data as RegistryLink };
}

/** Remove a registry link (edit permission enforced by RLS). */
export async function deleteRegistryLink(id: string): Promise<{ ok: boolean }> {
  if (!id) return { ok: false };
  const supabase = await supabaseServer();
  const { error } = await supabase.from("registry_links").delete().eq("id", id);
  if (error) {
    console.error("deleteRegistryLink failed:", error.code, error.message);
    return { ok: false };
  }
  return { ok: true };
}

/** Public registry links for a published wedding site (no auth). */
export async function getPublicRegistry(slug: string): Promise<RegistryLink[]> {
  if (!slug) return [];
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("list_public_registry", { p_slug: slug });
  if (error) {
    console.error("getPublicRegistry failed:", error.message);
    return [];
  }
  // RPC returns {label, url}; synthesize a stable key for rendering.
  return ((data as { label: string; url: string }[] | null) ?? []).map((r, i) => ({
    id: `${i}`,
    label: r.label,
    url: r.url,
  }));
}

/**
 * Sets or clears the wedding page's hero photo.
 *
 * The file itself is uploaded straight to storage from the browser (where the
 * bucket policy checks can_edit_wedding on the folder); this only records the
 * resulting URL. Passing null clears it. RLS on `weddings` decides whether the
 * write lands, so there's no ownership check here.
 */
export async function setWeddingCover(
  weddingId: string,
  url: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("weddings")
    .update({ cover_image_url: url, updated_at: new Date().toISOString() })
    .eq("id", weddingId)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("setWeddingCover failed:", error.code, error.message);
    return { ok: false, error: "Couldn’t save that photo." };
  }
  if (!data) return { ok: false, error: "You don’t have permission to edit this wedding." };

  revalidatePath(`/w/${weddingId}/website`);
  return { ok: true };
}
