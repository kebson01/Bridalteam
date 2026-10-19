import { describe, it, expect } from "vitest";
import { initials, tint, monogram, MONOGRAM_INK } from "@/lib/monogram";

/** WCAG relative luminance, so the contrast claim is computed, not asserted. */
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const channel = (i: number) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("initials", () => {
  it("takes the first letter of the first two significant words", () => {
    expect(initials("Jonathan Fanning Studio & Gallery")).toBe("JF");
    expect(initials("Good Food Events + Catering")).toBe("GF");
    expect(initials("Kristen Marie Photography")).toBe("KM");
  });

  it("drops a leading article so the initials mean something", () => {
    // "The Collection Bridal" as TC would be the article, not the business.
    expect(initials("The Collection Bridal")).toBe("CB");
    expect(initials("The Barn at Crescent Lake")).toBe("BC");
  });

  it("keeps a leading A, which is part of these names", () => {
    expect(initials("A Beautiful Ceremony")).toBe("AB");
    expect(initials("A Chair Affair")).toBe("AC");
  });

  it("keeps a multi-digit opening as the number people say", () => {
    // 717 Parking is "seven-seventeen", so 7P would be unreadable.
    expect(initials("717 Parking")).toBe("717");
    expect(initials("954 Catering")).toBe("954");
  });

  it("pairs a single leading digit with the next initial", () => {
    expect(initials("3 C's Catering")).toBe("3C");
    expect(initials("5 Star Premier")).toBe("5S");
  });

  it("treats an alphanumeric first word as a word", () => {
    expect(initials("4R Bakery and Specialty Cakes")).toBe("4B");
  });

  it("copes with punctuation, one-word names and nothing at all", () => {
    expect(initials("G. Elliot's Catering")).toBe("GE");
    expect(initials("Celebrations24")).toBe("C");
    expect(initials("")).toBe("?");
    expect(initials(null)).toBe("?");
    expect(initials("   ")).toBe("?");
  });

  it("never returns more than three characters", () => {
    for (const n of ["717 Parking", "A Bride, A Groom, A Notary", "3 C's Catering"]) {
      expect(initials(n).length).toBeLessThanOrEqual(3);
    }
  });

  it("does not drop the only word when that word is an article", () => {
    expect(initials("The")).toBe("T");
  });
});

describe("tint", () => {
  it("is stable for the same name", () => {
    expect(tint("Jade Bridal")).toBe(tint("Jade Bridal"));
  });

  it("spreads names that share a first letter across tints", () => {
    // A sum-of-char-codes hash would bunch these; FNV-1a should not.
    const names = [
      "Alessi Bakery", "Alora Transportation", "Awesome Jewelry", "Awey Photography",
      "Albelo's Flowers", "Amore Events II", "Antone's Photography", "Aktion Productions",
    ];
    expect(new Set(names.map(tint)).size).toBeGreaterThan(2);
  });

  it("only ever returns a tint that clears AA against the ink", () => {
    const names = ["3 C's Catering", "717 Parking", "The Glass Knife", "Jade Bridal",
                   "DEMM Photo Booths", "Tampa Calligraphy", "LC Rings", "Gabro Event Services",
                   "Ella's Alterations", "Snapshot Media", "Be Glam Photo Booth", "WDT Limo"];
    for (const n of names) {
      const ratio = contrast(MONOGRAM_INK, tint(n));
      expect(ratio, `${n}: ${tint(n)} vs ${MONOGRAM_INK} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("monogram", () => {
  it("returns the text, background and colour together", () => {
    expect(monogram("Jade Bridal")).toEqual({
      text: "JB",
      background: tint("Jade Bridal"),
      color: MONOGRAM_INK,
    });
  });

  it("still returns a usable tile for a nameless row", () => {
    const m = monogram(null);
    expect(m.text).toBe("?");
    expect(contrast(m.color, m.background)).toBeGreaterThanOrEqual(4.5);
  });
});
