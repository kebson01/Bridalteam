import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { PLAN_TEMPLATE } from "@/lib/plan-template";
import { consumeAiQuota, clientIp } from "@/lib/ai-quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Generates a personalized wedding plan with AI and seeds it into the wedding.
 *
 * The AI returns a Milestone → Deliverable → Task tree tuned to this couple's
 * details; we validate its shape, then reuse the same seed_wedding_plan RPC the
 * expert template uses (atomic, permission-checked, computes deadlines, won't
 * double-seed). If the AI is unavailable or returns junk, we fall back to the
 * expert template so the couple still gets a plan.
 */

interface GenTask { title: string; dueOffsetDays?: number | null; tip?: string }
interface GenDeliverable { name: string; tasks: GenTask[] }
interface GenMilestone { name: string; deliverables: GenDeliverable[] }

function isValidPlan(x: unknown): x is GenMilestone[] {
  if (!Array.isArray(x) || x.length === 0 || x.length > 12) return false;
  return x.every(
    (m) =>
      m && typeof m.name === "string" &&
      Array.isArray(m.deliverables) &&
      m.deliverables.every(
        (d: unknown) =>
          d && typeof (d as GenDeliverable).name === "string" &&
          Array.isArray((d as GenDeliverable).tasks) &&
          (d as GenDeliverable).tasks.every((t) => t && typeof t.title === "string"),
      ),
  );
}

// Keep the tree within sane bounds before it hits the database.
function clamp(plan: GenMilestone[]): GenMilestone[] {
  return plan.slice(0, 10).map((m) => ({
    name: String(m.name).slice(0, 120),
    deliverables: m.deliverables.slice(0, 6).map((d) => ({
      name: String(d.name).slice(0, 120),
      tasks: d.tasks.slice(0, 12).map((t) => ({
        title: String(t.title).slice(0, 300),
        dueOffsetDays:
          typeof t.dueOffsetDays === "number" && Number.isFinite(t.dueOffsetDays)
            ? Math.max(-365, Math.min(730, Math.round(t.dueOffsetDays)))
            : null,
        tip: typeof t.tip === "string" ? t.tip.slice(0, 400) : undefined,
      })),
    })),
  }));
}

export async function POST(req: Request) {
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: "Missing wedding id" }, { status: 400 });

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // RLS: only returns the wedding if this user can reach it.
  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, partner_one, partner_two, event_date, city, guest_count, budget_cents, currency, style")
    .eq("id", id)
    .maybeSingle();
  if (!wedding) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let plan: GenMilestone[] = PLAN_TEMPLATE;
  let source: "ai" | "template" = "template";

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Meter AI generations against the caller's tier. If they're out of quota,
  // fall back to the expert template (still a full plan) rather than blocking —
  // so a couple always gets a plan, they just don't spend AI they don't have.
  let quotaOk = true;
  if (apiKey) {
    const quota = await consumeAiQuota(supabase, "generate", clientIp(req));
    quotaOk = quota.allowed;
  }

  if (apiKey && quotaOk) {
    const budget = wedding.budget_cents != null ? `$${Math.round(wedding.budget_cents / 100)}` : "unspecified";
    const details = [
      wedding.partner_one && `Partners: ${[wedding.partner_one, wedding.partner_two].filter(Boolean).join(" & ")}`,
      wedding.event_date && `Date: ${wedding.event_date}`,
      wedding.city && `Location: ${wedding.city}`,
      wedding.guest_count != null && `Guests: ${wedding.guest_count}`,
      `Budget: ${budget}`,
      wedding.style && `Style: ${wedding.style}`,
    ].filter(Boolean).join("\n");

    const prompt = `You are an expert wedding planner. Build a complete, personalized wedding plan for this couple.

${details}

Return ONLY valid JSON — an array of milestones, no prose, no markdown fences. Shape:
[{"name":"phase name","deliverables":[{"name":"area of work","tasks":[{"title":"specific task","dueOffsetDays":270,"tip":"short expert note"}]}]}]

Rules:
- Cover the whole journey: engagement, venue & vendors, attire, the surrounding events (shower, bachelor/bachelorette, rehearsal dinner), travel & lodging if relevant, the day itself, and after.
- dueOffsetDays = whole days BEFORE the wedding this task should be done (a task 9 months out ≈ 270). Use negative for after the wedding. Omit if timing doesn't apply.
- Tailor to THEIR date, location, guest count, budget and style. Flag costs/details first-timers miss via the tip field.
- 6-9 milestones, a few deliverables each, concise task titles. Keep it realistic, not exhaustive.`;

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
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text: string = data?.content?.map((c: { text?: string }) => c.text ?? "").join("").trim() ?? "";
        // The model is told to return bare JSON, but strip a fence just in case.
        const json = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
        const parsed = JSON.parse(json);
        if (isValidPlan(parsed)) {
          plan = clamp(parsed);
          source = "ai";
        } else {
          console.error("AI plan failed validation; using template");
        }
      } else {
        const detail = await res.text().catch(() => "");
        console.error(`Anthropic generate failed: ${res.status}`, detail.slice(0, 400));
      }
    } catch (err) {
      console.error("AI plan generation threw; using template:", err);
    }
  }

  const { data: created, error } = await supabase.rpc("seed_wedding_plan", {
    p_wedding_id: id,
    p_template: plan,
  });

  if (error) {
    console.error("seed after generate failed:", error.code, error.message);
    return NextResponse.json({ error: "Couldn't save the plan." }, { status: 500 });
  }

  // limited = they wanted AI but were out of quota, so we used the expert template.
  return NextResponse.json({
    ok: true,
    source,
    tasksCreated: created ?? 0,
    limited: Boolean(apiKey) && !quotaOk,
  });
}
