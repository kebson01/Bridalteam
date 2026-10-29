import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COUNT = { count: "exact" as const, head: true };

/** Dashboard data: overview stats + recent lists for vendors, comments and reports. */
export async function GET(req: Request) {
  const admin = await adminGuard(req);
  if (admin instanceof NextResponse) return admin;

  // Exact counts (service role → not limited by RLS).
  const [cVendors, cPublished, cWeddings, cComments, cInspiration, cFeatured, cReports] =
    await Promise.all([
      admin.from("vendor_profiles").select("*", COUNT),
      admin.from("vendor_profiles").select("*", COUNT).eq("status", "published"),
      admin.from("weddings").select("*", COUNT),
      admin.from("inspiration_comments").select("*", COUNT),
      admin.from("inspiration_images").select("*", COUNT),
      admin.from("organizations").select("*", COUNT).eq("plan", "featured"),
      admin.from("inspiration_reports").select("*", COUNT).eq("status", "open"),
    ]);

  const stats = {
    vendors: cVendors.count ?? 0,
    vendorsPublished: cPublished.count ?? 0,
    weddings: cWeddings.count ?? 0,
    comments: cComments.count ?? 0,
    inspiration: cInspiration.count ?? 0,
    featured: cFeatured.count ?? 0,
    reports: cReports.count ?? 0,
  };

  const [{ data: vendorRows }, { data: commentRows }, { data: reportRows }] =
    await Promise.all([
    admin
      .from("vendor_profiles")
      .select("org_id, business_name, category, city, region, status, organizations(plan, subscription_status)")
      .order("created_at", { ascending: false })
      .limit(200),
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
    vendors: vendorRows ?? [],
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
