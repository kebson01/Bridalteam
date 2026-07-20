/**
 * Inspiration gallery data — the modern stand-in for the old "Wedfolio".
 *
 * Images are real wedding photos hotlinked from Pexels (pexels.com), whose
 * license permits commercial use with no attribution required. Each photo was
 * sourced from a theme-specific Pexels search (e.g. "rustic wedding"), so the
 * `theme` tag reflects what the photo actually shows. The `colors` tags are an
 * approximate palette per theme for the color filter — refine them, or swap in
 * your own photography, whenever you curate this for real. All swap points live
 * in this one file; the gallery component doesn't need to change.
 */

export const COLORS = [
  "Blush",
  "Coral",
  "Sage",
  "Navy",
  "Champagne",
  "Burgundy",
] as const;

export const THEMES = [
  "Rustic",
  "Modern",
  "Garden",
  "Coastal",
  "Bohemian",
  "Classic",
] as const;

export type Color = (typeof COLORS)[number];
export type Theme = (typeof THEMES)[number];

export interface InspirationItem {
  id: string;
  img: string;
  title: string;
  theme: Theme;
  colors: Color[];
}

// Canonical Pexels hotlink for a photo id, cropped to the gallery's 4:5 tile.
const pexels = (photoId: number) =>
  `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop`;

export const INSPIRATION: InspirationItem[] = [
  // Rustic — from a "rustic wedding" search.
  { id: "rus1", img: pexels(9816194), title: "Barn & candlelight", theme: "Rustic", colors: ["Burgundy", "Champagne"] },
  { id: "rus2", img: pexels(16625608), title: "Dried florals", theme: "Rustic", colors: ["Champagne", "Coral"] },
  { id: "rus3", img: pexels(4403775), title: "Vineyard warmth", theme: "Rustic", colors: ["Burgundy", "Sage"] },

  // Modern — from a "modern wedding" search.
  { id: "mod1", img: pexels(32705154), title: "Clean lines", theme: "Modern", colors: ["Champagne"] },
  { id: "mod2", img: pexels(17529930), title: "Statement florals", theme: "Modern", colors: ["Blush"] },
  { id: "mod3", img: pexels(13111870), title: "Monochrome tablescape", theme: "Modern", colors: ["Navy"] },

  // Garden — from a "garden wedding" search.
  { id: "gar1", img: pexels(37828118), title: "Greenhouse ceremony", theme: "Garden", colors: ["Sage", "Blush"] },
  { id: "gar2", img: pexels(18322558), title: "Garden party", theme: "Garden", colors: ["Coral", "Sage"] },
  { id: "gar3", img: pexels(1271397), title: "Blooms & greenery", theme: "Garden", colors: ["Blush", "Sage"] },

  // Coastal — from a "beach wedding" search.
  { id: "coa1", img: pexels(27442593), title: "Seaside vows", theme: "Coastal", colors: ["Navy"] },
  { id: "coa2", img: pexels(9470486), title: "Beach neutrals", theme: "Coastal", colors: ["Champagne", "Blush"] },
  { id: "coa3", img: pexels(2549004), title: "Ocean breeze", theme: "Coastal", colors: ["Navy", "Champagne"] },

  // Bohemian — from a "bohemian wedding" search.
  { id: "boh1", img: pexels(9816190), title: "Desert bohemian", theme: "Bohemian", colors: ["Coral", "Burgundy"] },
  { id: "boh2", img: pexels(29774686), title: "Macramé & pampas", theme: "Bohemian", colors: ["Champagne"] },
  { id: "boh3", img: pexels(10619761), title: "Free-spirited florals", theme: "Bohemian", colors: ["Coral", "Blush"] },

  // Classic — from an "elegant wedding ballroom" search.
  { id: "cla1", img: pexels(13834493), title: "Black-tie ballroom", theme: "Classic", colors: ["Navy", "Champagne"] },
  { id: "cla2", img: pexels(29624022), title: "Timeless elegance", theme: "Classic", colors: ["Champagne"] },
  { id: "cla3", img: pexels(12689009), title: "Grand & formal", theme: "Classic", colors: ["Navy", "Burgundy"] },
];
