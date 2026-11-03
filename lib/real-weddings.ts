import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Real Weddings: true stories of weddings that happened, told with the couple's
 * permission and their photographer credited. See
 * supabase/migrations/20261103120000_real_weddings_and_seed_content.sql and
 * the real-wedding-stories skill in plugins/bridalteam.
 *
 * Every read here uses the public key, and RLS only exposes published stories,
 * so a draft can't leak even if a filter is dropped.
 */

export interface RealWeddingPhoto {
  url: string;
  alt: string;
}

export interface RealWeddingVendor {
  role: string;
  name: string;
  url?: string;
}

export interface RealWedding {
  id: string;
  slug: string;
  couple_names: string;
  wedding_date: string;
  city: string;
  venue: string | null;
  title: string;
  summary: string | null;
  story: string;
  cover_url: string | null;
  photos: RealWeddingPhoto[];
  vendors: RealWeddingVendor[];
  photographer: string | null;
  published_at: string | null;
}

export const REAL_WEDDING_COLUMNS =
  "id, slug, couple_names, wedding_date, city, venue, title, summary, story, cover_url, photos, vendors, photographer, published_at";

/** Published stories, most recent wedding first. Never throws. */
export async function listRealWeddings(supabase: SupabaseClient): Promise<RealWedding[]> {
  const { data, error } = await supabase
    .from("real_weddings")
    .select(REAL_WEDDING_COLUMNS)
    .eq("status", "published")
    .order("wedding_date", { ascending: false });
  if (error) return [];
  return (data ?? []) as RealWedding[];
}

export async function getRealWedding(supabase: SupabaseClient, slug: string): Promise<RealWedding | null> {
  const { data, error } = await supabase
    .from("real_weddings")
    .select(REAL_WEDDING_COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) return null;
  return (data as RealWedding | null) ?? null;
}

/** Whether to link to /real-weddings at all. False until a story is published. */
export async function hasPublishedRealWeddings(supabase: SupabaseClient): Promise<boolean> {
  const { count, error } = await supabase
    .from("real_weddings")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  return !error && (count ?? 0) > 0;
}

/** "May 5, 2012" from "2012-05-05", without a timezone shifting the day. */
export function formatWeddingDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Story text to paragraphs: blank lines separate them. */
export function storyParagraphs(story: string): string[] {
  return story
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
