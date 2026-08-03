import { NextResponse } from "next/server";
import { supabasePublic } from "@/lib/supabase";
import { adminGuard } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Editable columns, in one place.
const FIELDS = [
  "name",
  "category",
  "city",
  "state",
  "price",
  "capacity",
  "tag",
  "description",
  "image_url",
  "website",
  "featured",
] as const;

type VenueInput = Record<string, unknown>;

function pick(body: VenueInput) {
  const out: VenueInput = {};
  for (const f of FIELDS) {
    if (body[f] !== undefined && body[f] !== "") out[f] = body[f];
  }
  if (out.capacity !== undefined) out.capacity = Number(out.capacity) || null;
  if (out.featured !== undefined) out.featured = Boolean(out.featured);
  return out;
}

// Public list (no password) — used by the admin page to render current venues.
export async function GET() {
  const supabase = supabasePublic();
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ venues: data ?? [] });
}

export async function POST(req: Request) {
  const admin = await adminGuard(req);
  if (admin instanceof NextResponse) return admin;

  const body = (await req.json().catch(() => ({}))) as VenueInput & { rows?: VenueInput[] };

  // Bulk insert: { rows: [...] }. Rows without a name are skipped.
  if (Array.isArray(body.rows)) {
    const values = body.rows.map(pick).filter((v) => v.name);
    const skipped = body.rows.length - values.length;
    if (values.length === 0) {
      return NextResponse.json({ error: "No rows with a name to import." }, { status: 400 });
    }
    const { data, error } = await admin.from("vendors").insert(values).select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ inserted: data?.length ?? 0, skipped });
  }

  // Single insert.
  const values = pick(body);
  if (!values.name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  const { data, error } = await admin.from("vendors").insert(values).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ venue: data });
}

export async function PATCH(req: Request) {
  const admin = await adminGuard(req);
  if (admin instanceof NextResponse) return admin;

  const body = (await req.json().catch(() => ({}))) as VenueInput;
  const id = body.id;
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
  const { data, error } = await admin
    .from("vendors")
    .update(pick(body))
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ venue: data });
}

export async function DELETE(req: Request) {
  const admin = await adminGuard(req);
  if (admin instanceof NextResponse) return admin;

  const body = (await req.json().catch(() => ({}))) as VenueInput;
  const id = body.id;
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
  const { error } = await admin.from("vendors").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
