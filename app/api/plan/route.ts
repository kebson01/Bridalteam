import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are the Bridal Team AI planning assistant — warm, upbeat, and genuinely useful.
Bridal Team helps couples plan their wedding in one place: organize details, find ideas,
collaborate with their team, discover vendors, and manage budgets.

SCOPE — you only help with wedding planning:
- Only answer questions that contribute to planning, designing, organizing, budgeting,
  coordinating, or enhancing a wedding or a wedding-related event (engagement party,
  bridal shower, rehearsal dinner, and the like).
- Judge by the user's INTENT, not by keywords. A topic that is off-topic on its own can be
  perfectly on-topic when it's part of the wedding. Weigh what they're actually trying to do.
  - "I want a football-themed wedding" → ANSWER. It's about theme, décor and design.
  - "I'd like a medical-themed wedding" → ANSWER. The theme is being applied to the wedding.
  - "Can you give me medical advice?" → DECLINE. Not about a wedding.
  - "Who will win the football game this weekend?" → DECLINE. Not about a wedding.
- When a request is outside wedding planning (medical, legal, financial or tax advice,
  general tech support, homework, trivia, current events, etc.), politely decline in one or
  two sentences: explain you're designed to help only with wedding planning, and offer to
  help with their wedding instead. Don't lecture, don't answer the off-topic part anyway.
- If a request is partly on-topic, help with the wedding part and gently leave the rest.

Guidelines (when answering in scope):
- Be concise and skimmable. Prefer short paragraphs and bullet lists (use "- ").
- Use **bold** for key labels (dates, totals, milestones).
- When asked for a timeline, give phased milestones (e.g. 12+ months out, 9 months, 6 months, etc.).
- When asked about budget, give a realistic percentage breakdown and a total range, and note it varies by region.
- When asked about vendors, suggest the categories to book and what to prioritize first.
- Always sound encouraging. End with one friendly next step.
- Keep responses under ~250 words unless the couple asks for deep detail.`;

// A useful, deterministic fallback so the demo works with no API key.
function demoReply(messages: ChatMsg[]): string {
  const last = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const q = last.toLowerCase();

  if (/budget|cost|afford|\$|spend|price/.test(q)) {
    const guestMatch = q.match(/(\d{2,4})\s*(guests|people|ppl)?/);
    const guests = guestMatch ? parseInt(guestMatch[1], 10) : 120;
    const perHead = 250;
    const total = guests * perHead;
    return `Here's a realistic starting budget for about **${guests} guests** (roughly **$${total.toLocaleString()}** total — this varies a lot by city):

- **Venue & catering — ~45%** ($${Math.round(total * 0.45).toLocaleString()})
- **Photography & video — 12%** ($${Math.round(total * 0.12).toLocaleString()})
- **Flowers & décor — 10%** ($${Math.round(total * 0.1).toLocaleString()})
- **Music / entertainment — 8%** ($${Math.round(total * 0.08).toLocaleString()})
- **Attire & beauty — 7%** ($${Math.round(total * 0.07).toLocaleString()})
- **Everything else (cake, stationery, favors, coordinator) — ~18%**

Tip: set aside a **5–8% buffer** for surprises. Want me to tailor this to your city and must-haves?`;
  }

  if (/timeline|schedule|when|months|checklist|plan/.test(q)) {
    return `Here's a clean **12-month timeline** to keep your team on track:

- **12+ months out:** Set your budget, draft the guest list, book your venue & date.
- **9 months:** Lock photographer, caterer, and band/DJ — the ones that book up fast.
- **6 months:** Order attire, book florist & officiant, plan the honeymoon.
- **3 months:** Send invites, finalize menu, confirm the timeline with all vendors.
- **1 month:** Seating chart, final headcount, day-of details.
- **Week of:** Confirm everything, pack, and breathe. 💍

I can turn any of these into a shared checklist for your team. Which phase should we start with?`;
  }

  if (/vendor|photographer|venue|florist|caterer|dj|band|book/.test(q)) {
    return `Great question — here's the order I'd book vendors in, since the best ones go first:

- **1. Venue** — everything else keys off the date & location.
- **2. Photographer / videographer** — top ones book 12+ months out.
- **3. Caterer** — often tied to the venue; confirm early.
- **4. Music (band or DJ)** — sets the whole vibe.
- **5. Florist & décor**, then **6. Officiant, cake, stationery.**

Tell me your **city, date, and style** and I'll match you with best-fit vendors from the Bridal Team directory.`;
  }

  if (/vibe|theme|style|idea|inspiration|rustic|modern|boho|autumn|beach/.test(q)) {
    return `Love it — let's shape the vibe. A few directions couples adore right now:

- **Rustic / autumn:** warm ambers, dried florals, string lights, a barn or vineyard.
- **Modern minimalist:** clean lines, monochrome florals, statement lighting.
- **Coastal:** airy neutrals, greenery, natural textures.

For a **rustic autumn** feel, I'd pair candlelight, eucalyptus + amber tones, and a family-style dinner. Want a full mood board and a matching color palette?`;
  }

  return `I'd love to help plan your day! Tell me a little more and I'll get specific:

- A rough **date or season**
- Your **city / region**
- An estimated **guest count**
- A **budget** range or **vibe** you're dreaming of

From there I can build your timeline, estimate a budget, and suggest which vendors to book first. What should we tackle first?`;
}

export async function POST(req: Request) {
  let messages: ChatMsg[] = [];
  try {
    const body = await req.json();
    messages = Array.isArray(body?.messages) ? body.messages : [];
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Keep only user/assistant turns with content.
  const clean = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && m.content?.trim())
    .slice(-12);

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ reply: demoReply(clean), demo: true });
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
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: clean.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok) {
      // Still fail gracefully to the demo experience — but say why in the
      // server log. Without this, a bad key, a wrong model id or a rate limit
      // all look identical to "no API key configured", and the UI tells the
      // visitor to set a key that is already set.
      const detail = await res.text().catch(() => "");
      console.error(
        `Anthropic API request failed: ${res.status} ${res.statusText}`,
        detail.slice(0, 500),
      );
      return NextResponse.json({ reply: demoReply(clean), demo: true });
    }

    const data = await res.json();
    const reply =
      data?.content?.map((c: { text?: string }) => c.text ?? "").join("").trim() ||
      demoReply(clean);

    return NextResponse.json({ reply, demo: false });
  } catch (err) {
    console.error("Anthropic API request threw:", err);
    return NextResponse.json({ reply: demoReply(clean), demo: true });
  }
}
