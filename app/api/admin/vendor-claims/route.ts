import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Looking up an unclaimed listing by phone, and attaching the email a vendor
 * reads out on the call.
 *
 * Most vendors worth listing publish a phone number and no email, so the
 * token-link claim flow could never reach them. This is the other end of a
 * phone call: find their listing, take the address they want to use, attach
 * it. They then sign up with that address and are offered the listing on
 * arrival — see claim_listing_by_email() in
 * supabase/migrations/20261006210000_claim_listing_by_email.sql.
 *
 * Attaching an email here does NOT give anyone access. It only makes the
 * listing claimable BY a confirmed account on that address, which is the
 * credential. Caller ID is not, and is never treated as one.
 */

/** Digits only, so (954) 721-9911, 954-721-9911 and 9547219911 all match. */
function digits(value: string): string {
  return value.replace(/\D+/g, "");
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function GET(req: Request) {
  const guard = await adminGuard(req);
  if (guard instanceof NextResponse) return guard;
  const admin = guard;

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 3) {
    return NextResponse.json({ error: "Search for a phone number or business name." }, { status: 400 });
  }

  // Two queries rather than one embedded select. PostgREST can only embed
  // across a direct foreign key, and vendor_claims and vendor_profiles have
  // none between them — both reference organizations. A
  // `vendor_profiles!inner(...)` embed compiles and type-checks fine and then
  // fails at runtime with "could not find a relationship", which is the kind
  // of bug that only shows up in production.
  //
  // Unclaimed only: a claimed listing is somebody's account now, and showing
  // it here would invite attaching an email to a live business.
  const { data: claims, error: claimErr } = await admin
    .from("vendor_claims")
    .select("org_id, contact_email, expires_at")
    .is("claimed_at", null)
    .limit(1000);

  if (claimErr) {
    console.error("vendor-claims search failed:", claimErr.code, claimErr.message);
    return NextResponse.json({ error: "Lookup failed." }, { status: 500 });
  }

  const claimByOrg = new Map(
    (claims ?? []).map((c) => [c.org_id as string, c as { contact_email: string | null; expires_at: string }]),
  );
  if (claimByOrg.size === 0) return NextResponse.json({ results: [] });

  const { data: profiles, error: profErr } = await admin
    .from("vendor_profiles")
    .select("org_id, business_name, category, city, region, website, phone, status")
    .in("org_id", [...claimByOrg.keys()]);

  if (profErr) {
    console.error("vendor-claims profiles failed:", profErr.code, profErr.message);
    return NextResponse.json({ error: "Lookup failed." }, { status: 500 });
  }

  // Phone matching happens here rather than in SQL because the stored numbers
  // came from whatever format each vendor's own website published. Normalising
  // both sides to digits is the only comparison that reliably works, and doing
  // it in Postgres would need a generated column.
  const needle = digits(q);
  const byPhone = needle.length >= 7;
  const text = q.toLowerCase();

  const rows = (profiles ?? []).filter((p) => {
    if (byPhone && p.phone) {
      const stored = digits(p.phone);
      // endsWith both ways, so a 7-digit local number still matches a stored
      // 10-digit one and vice versa.
      if (stored.endsWith(needle) || needle.endsWith(stored)) return true;
    }
    return (p.business_name ?? "").toLowerCase().includes(text);
  });

  return NextResponse.json({
    results: rows.slice(0, 25).map((p) => ({
      org_id: p.org_id,
      business_name: p.business_name,
      category: p.category,
      city: p.city,
      region: p.region,
      website: p.website,
      phone: p.phone,
      status: p.status,
      contact_email: claimByOrg.get(p.org_id)?.contact_email ?? null,
      expires_at: claimByOrg.get(p.org_id)?.expires_at ?? null,
    })),
  });
}

export async function POST(req: Request) {
  const guard = await adminGuard(req);
  if (guard instanceof NextResponse) return guard;
  const admin = guard;

  let body: { org_id?: unknown; email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const orgId = typeof body.org_id === "string" ? body.org_id : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!orgId) return NextResponse.json({ error: "Missing listing." }, { status: 400 });
  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: "That doesn't look like an email address." }, { status: 400 });
  }

  // Refreshed as well as set. An import from months ago would otherwise have a
  // claim row past its 60-day expiry, and the vendor on the phone right now
  // would be told their listing is no longer available.
  const { data, error } = await admin
    .from("vendor_claims")
    .update({
      contact_email: email,
      expires_at: new Date(Date.now() + 60 * 864e5).toISOString(),
    })
    .eq("org_id", orgId)
    .is("claimed_at", null)
    .select("org_id")
    .maybeSingle();

  if (error) {
    console.error("vendor-claims attach failed:", error.code, error.message);
    return NextResponse.json({ error: "Couldn't save that email." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: "That listing has already been claimed, or no longer exists." },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true, org_id: data.org_id, email });
}
