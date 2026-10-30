import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase";
import { clientIp } from "@/lib/ai-quota";
import { PLANNER_TOOLS, proposalFromToolUse, type Proposal } from "@/lib/planner-actions";

export const runtime = "nodejs";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are the Bridal Team AI planning assistant — warm, upbeat, and genuinely useful.
Bridal Team helps couples plan their wedding in one place: organize details, find ideas,
collaborate with their team, and manage budgets.

NEVER promise to match the couple with specific vendors, name vendors from "our directory",
or imply Bridal Team will send them a shortlist. The vendor directory is new and nearly
empty, so any such offer is one we cannot keep — and a broken promise at exactly the moment
someone starts trusting the product is worse than no offer at all. Advise on vendor
*categories*, booking order, budgets and the questions to ask; leave finding the actual
business to them.

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
- Keep responses under ~250 words unless the couple asks for deep detail.

ADDING THINGS TO THEIR WEDDING:
When a wedding is connected (a "Connected wedding" note follows), you have tools that offer
items the couple can add to their workspace with one tap: propose_tasks (checklist),
propose_budget_items (budget), propose_vendors (vendor tracker) and propose_guests (guest list).
- Use them whenever the couple asks you to make, build, create, set up or add a checklist,
  timeline, to-do list, budget, vendor list or guest list — and whenever a list you're giving
  them is clearly meant to become one of those. Put the full list in the tool call.
- Alongside the tool call, write a short reply: what you prepared and why, in a few lines.
  Don't repeat every item in the text — the couple sees them on a card with an Add button.
- Nothing is saved until they tap Add. Never say you've added or saved anything.
- Base deadlines on today's date and their wedding date (YYYY-MM-DD, never in the past or after
  the wedding). Skip items they already have (listed in the note) rather than duplicating them.
- Vendors: never invent business names. Use a name the couple gave, or a placeholder such as
  "Photographer (to find)". Guests: only people the couple named.
If no wedding is connected, you can't add anything: give the list in your reply and mention that
signing in (or opening the planner from their wedding dashboard) lets you add it for them.`;

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

Tell me your **city, date, and style** and I'll tell you what to look for in each one, what it should cost, and the questions to ask before you sign.`;
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

const dollars = (cents: number | null) =>
  cents == null ? "not set" : `$${Math.round(cents / 100).toLocaleString("en-US")}`;

/**
 * The wedding the planner works on, plus a note describing it for the model.
 * `requested` is the id the chat was opened with (/planner?w=…); without one we
 * take the caller's soonest wedding. RLS scopes both reads to weddings the
 * caller can reach, so a forged id simply finds nothing.
 */
async function connectedWedding(
  supabase: Awaited<ReturnType<typeof supabaseServer>>,
  requested: string | null,
): Promise<{ id: string; note: string } | null> {
  let query = supabase
    .from("weddings")
    .select("id, partner_one, partner_two, event_date, city, venue, guest_count, budget_cents, style");
  query = requested
    ? query.eq("id", requested)
    : query.order("event_date", { ascending: true, nullsFirst: false });
  const { data: w } = await query.limit(1).maybeSingle();
  if (!w) return null;

  const [tasks, vendors, guests, budget] = await Promise.all([
    supabase.from("tasks").select("title").eq("wedding_id", w.id).is("deleted_at", null).limit(150),
    supabase.from("wedding_vendors").select("name, category").eq("wedding_id", w.id).limit(60),
    supabase.from("wedding_guests").select("household_name").eq("wedding_id", w.id).limit(300),
    supabase.from("budget_items").select("label").eq("wedding_id", w.id).limit(80),
  ]);
  const list = (rows: unknown[] | null, pick: (r: Record<string, string>) => string) =>
    (rows ?? []).map((r) => pick(r as Record<string, string>)).join("; ") || "none yet";

  const note = [
    `Today is ${new Date().toISOString().slice(0, 10)}.`,
    `Connected wedding: ${[w.partner_one, w.partner_two].filter(Boolean).join(" & ") || "unnamed"}.`,
    `Date: ${w.event_date ?? "not set"}. City: ${w.city ?? "not set"}. Venue: ${w.venue ?? "not set"}.`,
    `Guests expected: ${w.guest_count ?? "not set"}. Total budget: ${dollars(w.budget_cents)}. Style: ${w.style ?? "not set"}.`,
    `Existing checklist tasks: ${list(tasks.data, (r) => r.title)}.`,
    `Existing vendors: ${list(vendors.data, (r) => [r.name, r.category].filter(Boolean).join(" — "))}.`,
    `Existing budget items: ${list(budget.data, (r) => r.label)}.`,
    `Guest households: ${(guests.data ?? []).length}.`,
  ].join("\n");
  return { id: w.id as string, note };
}

export async function POST(req: Request) {
  let messages: ChatMsg[] = [];
  let requestedWedding: string | null = null;
  try {
    const body = await req.json();
    messages = Array.isArray(body?.messages) ? body.messages : [];
    if (typeof body?.weddingId === "string" && /^[0-9a-f-]{36}$/i.test(body.weddingId)) {
      requestedWedding = body.weddingId;
    }
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

  // Meter AI usage against the caller's tier (anon by IP, else per account).
  // Only real (keyed) AI calls are metered — the demo fallback above is free.
  // Metering runs with the service-role client so quota rows can only be written
  // by us — see consumeAiQuota. The uid comes from the caller's own session; a
  // signed-out visitor meters by trusted IP instead.
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { consumeAiQuota, anonChatCeilingExceeded, QUOTA_UNMETERED } = await import("@/lib/ai-quota");
  const admin = supabaseAdmin();
  if (!admin) {
    console.error("AI quota not metered: SUPABASE_SERVICE_ROLE_KEY is not set.");
  }
  const quota = admin
    ? await consumeAiQuota(admin, "chat", clientIp(req), user?.id ?? null)
    : QUOTA_UNMETERED;
  if (!quota.allowed) {
    const msg =
      quota.tier === "anon"
        ? "You've reached the demo limit. Create a free account to keep planning — your conversation, checklist and budget all get saved."
        : "You've reached your AI chat limit for now. Upgrade for more AI help anytime.";
    // `cta` rather than asking the client to read the prose: the copy is free
    // to change without breaking the button, and the client has no other way
    // to tell an anonymous visitor from a signed-in one (this page is
    // statically prerendered, so it has no session at render time).
    return NextResponse.json(
      { reply: msg, demo: false, limited: true, cta: quota.tier === "anon" ? "signup" : "upgrade" },
      { status: 200 },
    );
  }

  // Global backstop for anonymous callers: even if per-IP metering is evaded
  // (rotated/spoofed IPs), cap total anon AI spend per day so the Anthropic key
  // can't be run up without bound. Signed-in tiers are unaffected.
  if (quota.tier === "anon") {
    if (admin && (await anonChatCeilingExceeded(admin))) {
      return NextResponse.json(
        {
          reply:
            "Our AI planner is at capacity for now. Create a free account to keep chatting, or try again a little later.",
          demo: false,
          limited: true,
          cta: "signup",
        },
        { status: 200 },
      );
    }
  }

  // Signed-in couples get their wedding connected, and with it the tools to
  // add things to it. Anonymous visitors get the plain chat.
  const wedding = user ? await connectedWedding(supabase, requestedWedding) : null;

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
        // Room for a full proposal: a 40-task checklist is a long tool call.
        max_tokens: 4096,
        // The system prompt is ~2.4k tokens, identical on every request, and
        // sent ahead of the messages — so it is the whole cacheable prefix.
        // Marking it cuts those tokens to roughly a tenth of input price on a
        // hit, which on a chat this size is most of the input bill.
        //
        // Two things make this safe rather than clever. The cache is scoped to
        // our API key, not the visitor, and the prompt is byte-identical for
        // everyone — so the first chat of any five-minute window warms it and
        // every concurrent visitor reads it. And Sonnet 5's minimum cacheable
        // prefix is 1024 tokens: shorter prefixes silently don't cache at all,
        // with no error. If SYSTEM_PROMPT is ever trimmed below that, this
        // quietly stops working — check usage.cache_read_input_tokens rather
        // than assuming.
        //
        // The default 5-minute TTL costs 1.25x on a write, so a lone visitor
        // asking one question and leaving pays about 0.1c more. Break-even is
        // two requests, which any real conversation passes.
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
          // Per-couple and per-day, so it goes after the cache breakpoint.
          ...(wedding ? [{ type: "text", text: wedding.note }] : []),
        ],
        // Constant, so they're part of the cached prefix (tools render first).
        ...(wedding ? { tools: PLANNER_TOOLS } : {}),
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
    const blocks: { type?: string; text?: string; name?: string; input?: unknown }[] =
      Array.isArray(data?.content) ? data.content : [];

    // The propose_* calls end the turn: they're shown as cards for the couple
    // to confirm, not executed, so no tool_result round trip is needed. A tool
    // name we don't know is ignored.
    const proposals: Proposal[] = wedding
      ? blocks
          .filter((b) => b.type === "tool_use")
          .map((b) => proposalFromToolUse(b.name, b.input))
          .filter((p): p is Proposal => p !== null)
      : [];

    const text = blocks
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("")
      .trim();
    const reply =
      text ||
      (proposals.length ? "Here's what I put together — review it and tap Add to save it." : demoReply(clean));

    return NextResponse.json({
      reply,
      demo: false,
      tier: quota.tier,
      ...(wedding ? { weddingId: wedding.id, proposals } : {}),
    });
  } catch (err) {
    console.error("Anthropic API request threw:", err);
    return NextResponse.json({ reply: demoReply(clean), demo: true });
  }
}
