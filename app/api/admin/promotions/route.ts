import { NextResponse } from "next/server";
import { adminGuard, adminUsername } from "@/lib/admin-auth";
import { endOfDay, parseAudience, parsePromotion, promotionStatus } from "@/lib/promotions";
import { sortCategories } from "@/lib/categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Plan promotions for /admin/promotions: give a group of vendors Pro or
 * Featured for a date range. See lib/promotions.ts and migration
 * 20261115160000_plan_promotions.sql.
 *
 * GET              promotions (newest first) with how many vendors each reaches,
 *                  plus the categories and cities to target.
 * GET ?vendors=    search vendors by name, for hand-picking.
 * POST { action }  "preview" (count an audience), "create", "end" (stop now),
 *                  "extend" (change the last day).
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Row = {
  id: string;
  name: string;
  plan: string;
  starts_at: string;
  ends_at: string;
  categories: string[] | null;
  cities: string[] | null;
  published_only: boolean;
  claimed_only: boolean;
  org_ids: string[] | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
  ended_at: string | null;
  ended_by: string | null;
};

type Admin = Exclude<Awaited<ReturnType<typeof adminGuard>>, NextResponse>;

async function reach(admin: Admin, a: Pick<Row, "categories" | "cities" | "published_only" | "claimed_only" | "org_ids">) {
  const { data, error } = await admin.rpc("promotion_reach", {
    p_categories: a.categories,
    p_cities: a.cities,
    p_published_only: a.published_only,
    p_claimed_only: a.claimed_only,
    p_org_ids: a.org_ids,
  });
  if (error) throw error;
  return (data as number) ?? 0;
}

export async function GET(req: Request) {
  const guard = await adminGuard(req);
  if (guard instanceof NextResponse) return guard;
  const admin = guard;

  const term = (new URL(req.url).searchParams.get("vendors") ?? "").trim().replace(/[%_,()]/g, " ").slice(0, 80);
  if (term) {
    const { data, error } = await admin
      .from("vendor_profiles")
      .select("org_id, business_name, category, city, status")
      .ilike("business_name", `%${term}%`)
      .order("business_name")
      .limit(20);
    if (error) return failed("vendor search", error);
    return NextResponse.json({ vendors: data ?? [] });
  }

  try {
    const [{ data: promos, error }, { data: profiles, error: pErr }] = await Promise.all([
      admin.from("plan_promotions").select("*").order("created_at", { ascending: false }).limit(100),
      admin.from("vendor_profiles").select("category, city").limit(10000),
    ]);
    if (error) return failed("list", error);
    if (pErr) return failed("profiles", pErr);
    const rows = (promos ?? []) as Row[];

    // Names for hand-picked promotions.
    const ids = [...new Set(rows.flatMap((r) => r.org_ids ?? []))];
    const names = new Map<string, string>();
    if (ids.length) {
      const { data } = await admin.from("vendor_profiles").select("org_id, business_name").in("org_id", ids);
      for (const v of data ?? []) names.set(v.org_id as string, v.business_name as string);
    }

    const now = new Date();
    const promotions = await Promise.all(
      rows.map(async (r) => ({
        ...r,
        status: promotionStatus(r, now),
        reach: await reach(admin, r),
        vendors: (r.org_ids ?? []).map((id) => ({ org_id: id, business_name: names.get(id) ?? "(removed vendor)" })),
      })),
    );

    const cityCounts = new Map<string, string>();
    for (const p of profiles ?? []) {
      const c = (p.city as string | null)?.trim();
      if (c && !cityCounts.has(c.toLowerCase())) cityCounts.set(c.toLowerCase(), c);
    }
    return NextResponse.json({
      promotions,
      categories: sortCategories((profiles ?? []).map((p) => p.category as string | null)),
      cities: [...cityCounts.values()].sort((a, b) => a.localeCompare(b)),
    });
  } catch (e) {
    return failed("list", e as { code?: string; message?: string });
  }
}

export async function POST(req: Request) {
  const guard = await adminGuard(req);
  if (guard instanceof NextResponse) return guard;
  const admin = guard;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  if (body.action === "preview") {
    const audience = parseAudience(body.audience);
    if ("error" in audience) return NextResponse.json(audience, { status: 400 });
    try {
      return NextResponse.json({ reach: await reach(admin, audience.value) });
    } catch (e) {
      return failed("preview", e as { code?: string; message?: string });
    }
  }

  if (body.action === "create") {
    const parsed = parsePromotion(body);
    if ("error" in parsed) return NextResponse.json(parsed, { status: 400 });
    const who = await adminUsername(admin, req);
    const { data, error } = await admin
      .from("plan_promotions")
      .insert({ ...parsed.value, created_by: who || null })
      .select("id")
      .single();
    if (error) return failed("create", error);
    return NextResponse.json({ ok: true, id: data.id });
  }

  const id = typeof body.id === "string" && UUID.test(body.id) ? body.id : "";
  if (!id) return NextResponse.json({ error: "Bad request." }, { status: 400 });

  if (body.action === "end") {
    const who = await adminUsername(admin, req);
    const { data, error } = await admin
      .from("plan_promotions")
      .update({ ended_at: new Date().toISOString(), ended_by: who || null })
      .eq("id", id)
      .is("ended_at", null)
      .select("id");
    if (error) return failed("end", error);
    if (!data?.length) return NextResponse.json({ error: "That promotion has already ended." }, { status: 409 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "extend") {
    const end = typeof body.end === "string" ? endOfDay(body.end) : null;
    if (!end) return NextResponse.json({ error: "Choose the new last day." }, { status: 400 });
    if (end <= new Date()) return NextResponse.json({ error: "That day has already passed." }, { status: 400 });
    const { data: row } = await admin.from("plan_promotions").select("starts_at, ended_at").eq("id", id).maybeSingle();
    if (!row) return NextResponse.json({ error: "That promotion no longer exists." }, { status: 404 });
    if (row.ended_at) return NextResponse.json({ error: "That promotion was ended early. Start a new one instead." }, { status: 409 });
    if (end <= new Date(row.starts_at as string)) {
      return NextResponse.json({ error: "The last day must be after the start." }, { status: 400 });
    }
    const { error } = await admin.from("plan_promotions").update({ ends_at: end.toISOString() }).eq("id", id);
    if (error) return failed("extend", error);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Bad request." }, { status: 400 });
}

function failed(what: string, error: { code?: string; message?: string }) {
  console.error(`admin promotions ${what} failed:`, error.code, error.message);
  return NextResponse.json({ error: "That didn't work. Please try again." }, { status: 500 });
}
