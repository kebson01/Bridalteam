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
  /** Pixel size, recorded by scripts/real-wedding.mjs so rows lay out before the photo loads. */
  width?: number;
  height?: number;
}

/** Width over height. Stories uploaded before sizes were recorded count as 3:2. */
export function photoRatio(photo: RealWeddingPhoto): number {
  return photo.width && photo.height ? photo.width / photo.height : 1.5;
}

/** Wider than this (a panorama) gets a row to itself. */
const WIDE = 1.7;

/**
 * Groups photos into rows of two, keeping their order. Both photos in a row
 * are shown at the same height, so nothing is cropped and there are no gaps.
 * A panorama gets its own row.
 */
export function photoRows(photos: RealWeddingPhoto[]): RealWeddingPhoto[][] {
  const rows: RealWeddingPhoto[][] = [];
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    const next = photos[i + 1];
    if (photoRatio(p) < WIDE && next && photoRatio(next) < WIDE) {
      rows.push([p, next]);
      i++;
    } else {
      rows.push([p]);
    }
  }
  return rows;
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
  /** YouTube or Vimeo link, embedded as a player on the story page. */
  video_url: string | null;
  photos: RealWeddingPhoto[];
  vendors: RealWeddingVendor[];
  photographer: string | null;
  published_at: string | null;
}

export const REAL_WEDDING_COLUMNS =
  "id, slug, couple_names, wedding_date, city, venue, title, summary, story, cover_url, video_url, photos, vendors, photographer, published_at";

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

const isPhotography = (role: string) => /^photo(graph(y|er))?s?$/i.test(role.trim());

/**
 * Who took the photos, and their website if known. The link comes from a
 * vendors entry whose role is Photography; that entry is then left out of the
 * vendor list so the photographer isn't credited twice.
 */
export function photographerCredit(story: Pick<RealWedding, "photographer" | "vendors">): {
  credit: RealWeddingVendor | null;
  otherVendors: RealWeddingVendor[];
} {
  const photoVendor = story.vendors.find((v) => isPhotography(v.role));
  const otherVendors = story.vendors.filter((v) => v !== photoVendor);
  const name = story.photographer?.trim() || photoVendor?.name;
  if (!name) return { credit: null, otherVendors };
  const sameBusiness = photoVendor && (!story.photographer || photoVendor.name.toLowerCase() === name.toLowerCase());
  if (photoVendor && !sameBusiness) return { credit: { role: "Photography", name }, otherVendors: story.vendors };
  return { credit: { role: "Photography", name, url: photoVendor?.url }, otherVendors };
}

/** Story text to paragraphs: blank lines separate them. */
export function storyParagraphs(story: string): string[] {
  return story
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
