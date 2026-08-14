import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Data export (GDPR/CCPA "right to access"): downloads everything the signed-in
 * user can reach as a single JSON file. Runs entirely through the user's own
 * RLS-scoped client — never the service role — so it returns exactly the rows
 * that user is allowed to see and nothing more.
 *
 * Wedding-scoped tables (milestones, tasks, budget, …) rely on RLS to limit
 * rows to weddings the user is a member of, so a plain select("*") is safe.
 */
export async function GET() {
  if (!SHOW_PLANNER_APP) {
    return NextResponse.json({ error: "not available" }, { status: 404 });
  }

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not signed in" }, { status: 401 });
  }

  // Each entry runs as the user; RLS scopes the rows. Failures degrade to an
  // empty list rather than failing the whole export.
  const tables = [
    "org_members",
    "weddings",
    "milestones",
    "deliverables",
    "tasks",
    "task_notes",
    "budget_items",
    "wedding_vendors",
    "travel_items",
    "saved_inspiration",
    "inspiration_likes",
  ] as const;

  const data: Record<string, unknown> = {};
  await Promise.all(
    tables.map(async (t) => {
      const { data: rows } = await supabase.from(t).select("*");
      data[t] = rows ?? [];
    }),
  );

  const payload = {
    exported_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    },
    data,
  };

  const filename = `bridal-team-export-${user.id.slice(0, 8)}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
