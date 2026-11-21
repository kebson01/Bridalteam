import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminGuard } from "@/lib/admin-auth";
import { PLAN_COLUMNS, TIERS, planGrant, type PlanSource } from "@/lib/tiers";
import { findListingsByName } from "@/lib/listing-match";
import { readOutreachConfig } from "@/lib/outreach/config";
import { claimToken, claimUrl, tokenHash } from "@/lib/outreach/tokens";
import { isPlausibleEmail } from "@/lib/outreach/plan";
import { SITE_URL } from "@/lib/site";

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

  const body = (await req.json().catch(() => ({}))) as { action?: string; id?: string; vendor?: NewVendor; force?: boolean };
  const { action, id } = body;
  if (action === "create_vendor") return createVendor(admin, body.vendor ?? {}, body.force === true);
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

type SupabaseAdmin = SupabaseClient;

type NewVendor = Partial<Record<"business_name" | "category" | "city" | "region" | "website" | "email" | "phone" | "contact_email" | "description" | "note", string>>;

const DAY_MS = 86_400_000;
/** How long the claim link for a listing added here works. */
const CLAIM_DAYS = 60;

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "") || null;

/**
 * Adds a vendor listing by hand (the dashboard's "Add vendor").
 *
 * Uses create_claimable_listing, the same function the lead importer uses: a
 * vendor organization, a DRAFT profile (publishing a business's details before
 * they've seen them is theirs to decide; the dashboard can publish it after),
 * and a claim record. A listing with the same business name blocks it unless
 * `force`, so the same business isn't added twice by accident.
 *
 * The claim link returned is the campaign's derived one when OUTREACH_SECRET is
 * set, so the link shown here and any campaign email are the same link.
 */
async function createVendor(admin: SupabaseAdmin, input: NewVendor, force: boolean) {
  const v = {
    business_name: clean(input.business_name, 160),
    category: clean(input.category, 80),
    city: clean(input.city, 100),
    region: clean(input.region, 40),
    website: clean(input.website, 300),
    email: clean(input.email, 254)?.toLowerCase() ?? null,
    phone: clean(input.phone, 40),
    contact_email: clean(input.contact_email, 254)?.toLowerCase() ?? null,
    description: clean(input.description, 4000),
    note: clean(input.note, 500),
  };
  if (!v.business_name) return NextResponse.json({ error: "A business name is required." }, { status: 400 });
  for (const [field, value] of [["Email", v.email], ["Claim email", v.contact_email]] as const) {
    if (value && !isPlausibleEmail(value)) return NextResponse.json({ error: `${field} doesn't look like an email address.` }, { status: 400 });
  }
  if (v.website && !/^https?:\/\//i.test(v.website)) v.website = `https://${v.website}`;

  if (!force) {
    const existing = await findListingsByName(admin, v.business_name);
    if (existing.length) {
      return NextResponse.json(
        { error: "A listing with this business name already exists.", duplicates: existing.map((e) => ({ ...e, url: `${SITE_URL}/v/${e.orgId}` })) },
        { status: 409 },
      );
    }
  }

  const { data, error } = await admin.rpc("create_claimable_listing", {
    p_business_name: v.business_name,
    p_category: v.category,
    p_city: v.city,
    p_region: v.region,
    p_website: v.website,
    p_email: v.email,
    p_phone: v.phone,
    p_description: v.description,
    p_contact_email: v.contact_email,
    p_note: v.note ?? "Added from the admin dashboard",
  });
  if (error) {
    console.error("create_claimable_listing failed:", error.code, error.message);
    return NextResponse.json({ error: "Couldn't create the listing." }, { status: 500 });
  }
  const row = (Array.isArray(data) ? data[0] : data) as { org_id: string; token: string } | null;
  if (!row?.org_id) return NextResponse.json({ error: "Couldn't create the listing." }, { status: 500 });

  // One stable claim link: the campaign's derived token if it's configured,
  // else the random one the function minted. Valid for CLAIM_DAYS either way.
  const { config } = readOutreachConfig();
  const derived = config.secret.length >= 32;
  const { error: claimErr } = await admin
    .from("vendor_claims")
    .update({
      ...(derived ? { token_hash: tokenHash(claimToken(config.secret, row.org_id)) } : {}),
      expires_at: new Date(Date.now() + CLAIM_DAYS * DAY_MS).toISOString(),
    })
    .eq("org_id", row.org_id)
    .is("claimed_at", null);
  if (claimErr) console.error("create vendor: claim link update failed:", claimErr.message);

  return NextResponse.json({
    ok: true,
    orgId: row.org_id,
    pageUrl: `${SITE_URL}/v/${row.org_id}`,
    claimUrl: claimErr ? null : derived ? claimUrl(config.secret, row.org_id) : `${SITE_URL}/claim/${row.token}`,
    claimEmail: v.contact_email ?? v.email,
  });
}
