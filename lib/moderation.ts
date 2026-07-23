/**
 * AI image moderation using the same Anthropic (Claude) service that powers the
 * planner — Claude has vision, so it can look at an uploaded image and decide
 * whether it's appropriate for the public wedding gallery. No second service
 * needed for images.
 *
 * Fails OPEN: if there's no API key, the image can't be fetched, or the API
 * errors, we allow the upload (a moderation outage shouldn't block legitimate
 * vendors) but log it. It only ever BLOCKS on a clear positive detection.
 */

export interface ModerationResult {
  allowed: boolean;
  reason?: string;
}

const SYSTEM_PROMPT = `You are a content-safety classifier for a wedding-planning website's public vendor gallery. Given an image, decide whether it is appropriate to display to couples.

Mark it UNSAFE only if it clearly contains: sexual or pornographic content, nudity or exposed genitals/breasts, sexually explicit or suggestive poses, graphic violence or gore, hate symbols, or other content clearly inappropriate for a family-friendly wedding gallery.

Normal wedding imagery is SAFE: couples kissing or embracing, wedding attire, tasteful beach/swimwear at a beach wedding, venues, food, flowers, décor, rings, and similar.

Respond with ONLY a JSON object and nothing else:
{"safe": true} or {"safe": false, "reason": "<short reason>"}`;

/** Best-effort extraction of the first JSON object in a string. */
function extractJson(text: string): { safe?: boolean; reason?: string } | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function moderateImage(imageUrl: string): Promise<ModerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  // Can't moderate without a key or a fetchable http(s) image → don't block.
  if (!apiKey || !imageUrl || !/^https?:\/\//i.test(imageUrl)) {
    return { allowed: true };
  }

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
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "url", url: imageUrl } },
              { type: "text", text: "Classify this image. Respond with only the JSON." },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("moderateImage: Anthropic error", res.status, detail.slice(0, 300));
      return { allowed: true }; // fail open
    }

    const data = await res.json();
    const text: string =
      data?.content?.map((c: { text?: string }) => c.text ?? "").join("").trim() ?? "";
    const parsed = extractJson(text);

    if (parsed && typeof parsed.safe === "boolean") {
      return parsed.safe
        ? { allowed: true }
        : { allowed: false, reason: typeof parsed.reason === "string" ? parsed.reason : undefined };
    }
    return { allowed: true }; // couldn't parse a verdict → don't block
  } catch (err) {
    console.error("moderateImage threw:", err);
    return { allowed: true }; // fail open
  }
}
