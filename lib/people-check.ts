import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Does a photo show people? Asked of the same Claude service lib/moderation.ts
 * uses, and stored on inspiration_images.has_people. The homepage mosaic only
 * rotates in photos with has_people = false (the owner's homepage rule is no
 * recognisable faces), so this is what lets a new feed photo reach the
 * homepage without anyone editing code.
 *
 * Fails CLOSED, the opposite of moderation: no key, an unfetchable image, an
 * API error or an unreadable answer all return null ("not checked"), which
 * keeps the photo off the homepage until the daily check
 * (app/api/cron/people-check) gets a clear answer. A missed photo costs
 * nothing; a face on the homepage is what the rule is there to prevent.
 */

const SYSTEM_PROMPT = `You check photos for a wedding website. Decide whether the photo shows any person.

Answer "people": true if ANY human or part of a human is visible: a face, a body, a silhouette, hands, arms, legs, or people in the background, however small, blurred or far away. Photos of a couple, guests, a wedding party, a bartender's hands, or a crowd are all true.

Answer "people": false only when no part of any person is visible: decor, flowers, cakes, food, drinks, table settings, stationery, rings, shoes, signs, venues, empty ceremony sites, landscapes.

If you are unsure, answer true.

Respond with ONLY a JSON object and nothing else: {"people": true} or {"people": false}`;

function extractJson(text: string): { people?: unknown } | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** true = people, false = no people, null = couldn't tell (treated as "keep off the homepage"). */
export async function photoHasPeople(imageUrl: string): Promise<boolean | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !imageUrl || !/^https?:\/\//i.test(imageUrl)) return null;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:
          process.env.ANTHROPIC_MODERATION_MODEL ||
          process.env.ANTHROPIC_MODEL ||
          "claude-sonnet-5",
        max_tokens: 50,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "url", url: imageUrl } },
              { type: "text", text: "Does this photo show any person? Respond with only the JSON." },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("photoHasPeople: Anthropic error", res.status, detail.slice(0, 300));
      return null;
    }

    const data = await res.json();
    const text: string =
      data?.content?.map((c: { text?: string }) => c.text ?? "").join("").trim() ?? "";
    const parsed = extractJson(text);
    return typeof parsed?.people === "boolean" ? parsed.people : null;
  } catch (err) {
    console.error("photoHasPeople threw:", err);
    return null;
  }
}

/**
 * Checks one stored photo and records the answer. Needs the service-role
 * client: a database trigger ignores has_people from anyone else, so a vendor
 * can't mark their own photo people-free. Leaves the row untouched (still
 * null) when there's no clear answer.
 */
export async function recordPeopleCheck(
  admin: SupabaseClient,
  id: string,
  imageUrl: string,
): Promise<boolean | null> {
  const hasPeople = await photoHasPeople(imageUrl);
  if (hasPeople === null) return null;
  const { error } = await admin
    .from("inspiration_images")
    .update({ has_people: hasPeople })
    .eq("id", id)
    // Don't stamp an answer onto a photo that was swapped since we looked.
    .eq("image_url", imageUrl);
  if (error) {
    console.error("recordPeopleCheck: update failed:", error.code, error.message);
    return null;
  }
  return hasPeople;
}
