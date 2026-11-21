import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-auth";
import { PLAN_COLUMNS, TIERS, planGrant, type PlanSource } from "@/lib/tiers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COUNT = { count: "exact" as const, head: true };

/** PostgREST returns at most 1,000 rows per request; page through everything. */
async function all<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < 20_000; from += 1000) {
    const { data, error } = await query(from, from + 999);
    if (error) throw new Error(`admin dashboard query failed: ${JSON.stringify(error)}`);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

type OrgRow = PlanSource & { subscription_status: string | null };
type ProfileRow = {
  org_id: string;
  business_name: string;
  category: string | null;
  city: string | null;
  region: string | null;
  status: string;
  email: string | null;
  created_at: string;
  organizations: OrgRow | null;
};

/** Dashboard data: overview stats, every vendor listing, and recent comments and reports. */
export async function GET(req: Request) {
  const admin = await adminGuard(req);
  if (admin instanceof NextResponse) return admin;

  const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();

  // Exact counts (service role → not limited by RLS).
  const [cWeddings, cSites, cComments, cInspiration, cReports, cInquiries, cInquiries30, cNewLeads] = await Promise.all([
    admin.from("weddings").select("*", COUNT),
    admin.from("weddings").select("*", COUNT).eq("website_published", true),
    admin.from("inspiration_comments").select("*", COUNT),
    admin.from("inspiration_images").select("*", COUNT),
    admin.from("inspiration_reports").select("*", COUNT).eq("status", "open"),
    admin.from("vendor_inquiries").select("*", COUNT),
    admin.from("vendor_inquiries").select("*", COUNT).gte("created_at", since30),
    admin.from("vendor_leads").select("*", COUNT).eq("status", "new"),
  ]);

  let profiles: ProfileRow[];
  let claims: { org_id: string; contact_email: string | null }[];
  let members: { org_id: string }[];
  try {
    [profiles, claims, members] = await Promise.all([
      all<ProfileRow>((a, b) =>
        admin
          .from("vendor_profiles")
          .select(`org_id, business_name, category, city, region, status, email, created_at, organizations(subscription_status, ${PLAN_COLUMNS})`)
          .order("created_at", { ascending: false })
          .order("org_id")
          .range(a, b) as unknown as PromiseLike<{ data: ProfileRow[] | null; error: unknown }>,
      ),
      all<{ org_id: string; contact_email: string | null }>((a, b) => admin.from("vendor_claims").select("org_id, contact_email").order("id").range(a, b)),
      all<{ org_id: string }>((a, b) => admin.from("org_members").select("org_id").order("org_id").range(a, b)),
    ]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Couldn't load vendors." }, { status: 500 });
  }

  const contactByOrg = new Map(claims.filter((c) => c.contact_email).map((c) => [c.org_id, c.contact_email!]));
  const owned = new Set(members.map((m) => m.org_id));

  let paying = 0;
  let mrr = 0;
  let granted = 0;
  const vendors = profiles.map((p) => {
    const org = p.organizations;
    const grant = planGrant(org);
    const pays = grant.source === "paid" && grant.plan !== "free" && ["active", "trialing"].includes(org?.subscription_status ?? "");
    if (pays) {
      paying++;
      mrr += TIERS[grant.plan].priceMonthly;
    }
    if (grant.plan !== "free" && grant.source !== "paid") granted++;
    return {
      org_id: p.org_id,
      business_name: p.business_name,
      category: p.category,
      city: p.city,
      region: p.region,
      status: p.status,
      email: p.email ?? contactByOrg.get(p.org_id) ?? null,
      plan: grant.plan,
      plan_source: grant.source,
      claimed: owned.has(p.org_id),
      created_at: p.created_at,
    };
  });

  const stats = {
    vendors: vendors.length,
    vendorsPublished: vendors.filter((v) => v.status === "published").length,
    vendorsClaimed: vendors.filter((v) => v.claimed).length,
    paying,
    mrr,
    granted,
    weddings: cWeddings.count ?? 0,
    weddingSites: cSites.count ?? 0,
    inquiries: cInquiries.count ?? 0,
    inquiries30: cInquiries30.count ?? 0,
    newLeads: cNewLeads.count ?? 0,
    comments: cComments.count ?? 0,
    inspiration: cInspiration.count ?? 0,
    reports: cReports.count ?? 0,
  };

  const [{ data: commentRows }, { data: reportRows }] = await Promise.all([
    admin
      .from("inspiration_comments")
      .select("id, author_name, body, image_id, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("inspiration_reports")
      .select("id, reason, status, created_at, image_id, inspiration_images(title, image_url)")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return NextResponse.json({
    stats,
    vendors,
    comments: commentRows ?? [],
    reports: reportRows ?? [],
  });
}

/** Moderation actions. */
export async function POST(req: Request) {
  const admin = await adminGuard(req);
  if (admin instanceof NextResponse) return admin;

  const body = (await req.json().catch(() => ({}))) as { action?: string; id?: string };
  const { action, id } = body;
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  const fail = (message: string) => NextResponse.json({ error: message }, { status: 500 });

  switch (action) {
    case "publish_vendor":
    case "unpublish_vendor": {
      const status = action === "publish_vendor" ? "published" : "draft";
      const { error } = await admin.from("vendor_profiles").update({ status }).eq("org_id", id);
      return error ? fail(error.message) : NextResponse.json({ ok: true });
    }
    case "delete_comment": {
      const { error } = await admin.from("inspiration_comments").delete().eq("id", id);
      return error ? fail(error.message) : NextResponse.json({ ok: true });
    }
    case "dismiss_report": {
      // id = report id — keep the image, clear the report.
      const { error } = await admin
        .from("inspiration_reports")
        .update({ status: "dismissed" })
        .eq("id", id);
      return error ? fail(error.message) : NextResponse.json({ ok: true });
    }
    case "delete_reported_image": {
      // id = image id — removing it cascades its reports and comments.
      const { error } = await admin.from("inspiration_images").delete().eq("id", id);
      return error ? fail(error.message) : NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
}
