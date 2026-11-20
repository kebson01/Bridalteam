import { timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { recordPeopleCheck } from "@/lib/people-check";

export const dynamic = "force-dynamic";

/** Photos per run. Each is one AI call; a backlog clears over a few days. */
const BATCH = 25;

/**
 * Daily "does it show people?" check, called by
 * .github/workflows/people-check.yml with `Authorization: Bearer $CRON_SECRET`.
 *
 * Vendor uploads are checked as they're added (app/vendor/actions.ts). This
 * catches everything else: photos added another way (curated and seed
 * content, admin inserts), checks that failed, and photos whose URL changed
 * (the database clears has_people when image_url changes). Only feed photos
 * are checked, because only they can reach the homepage. Safe to run any
 * number of times: it only looks at photos with no answer yet.
 */

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32) return false;
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request): Promise<Response> {
  if (!authorized(req)) return new Response("Not found", { status: 404 });

  const admin = supabaseAdmin();
  if (!admin) return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set" }, { status: 503 });

  const { data, error } = await admin
    .from("inspiration_images")
    .select("id, image_url")
    .eq("feed_visible", true)
    .eq("media_type", "photo")
    .is("has_people", null)
    .order("created_at", { ascending: false })
    .limit(BATCH);
  if (error) {
    console.error("people-check: query failed:", error.code, error.message);
    return Response.json({ error: "query failed" }, { status: 500 });
  }

  let withPeople = 0;
  let withoutPeople = 0;
  let unknown = 0;
  for (const row of data ?? []) {
    const result = await recordPeopleCheck(admin, row.id as string, row.image_url as string);
    if (result === true) withPeople++;
    else if (result === false) withoutPeople++;
    else unknown++;
  }

  const summary = { checked: (data ?? []).length, with_people: withPeople, without_people: withoutPeople, unknown };
  console.log("people check:", JSON.stringify(summary));
  return Response.json(summary);
}
