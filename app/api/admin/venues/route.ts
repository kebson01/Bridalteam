import { NextResponse } from "next/server";
import { supabaseAdmin, supabasePublic } from "@/lib/supabase";

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

// Returns an error response if the request isn't an authorized, configured admin.
function guard(req: Request) {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) {
    return NextResponse.json(
      { error: "Admin isn't configured. Set ADMIN_PASSWORD and SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }
  const provided = req.headers.get("x-admin-password");
  if (provided !== configured) {
    return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
  }
  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not set on the server." },
      { status: 503 }
    );
  }
  return admin;
}

// Public list (no password) — used by the admin page to render current venues.
export async function GET() {
  const supabase = supabasePublic();
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ venues: data ?? [] });
}

export async function POST(req: Request) {
  const admin = guard(req);
  if (admin instanceof NextResponse) return admin;

  const body = (await req.json().catch(() => ({}))) as VenueInput;
  const values = pick(body);
  if (!values.name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  const { data, error } = await admin.from("venues").insert(values).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ venue: data });
}

export async function PATCH(req: Request) {
  const admin = guard(req);
  if (admin instanceof NextResponse) return admin;

  const body = (await req.json().catch(() => ({}))) as VenueInput;
  const id = body.id;
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
  const { data, error } = await admin
    .from("venues")
    .update(pick(body))
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ venue: data });
}

export async function DELETE(req: Request) {
  const admin = guard(req);
  if (admin instanceof NextResponse) return admin;

  const body = (await req.json().catch(() => ({}))) as VenueInput;
  const id = body.id;
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
  const { error } = await admin.from("venues").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
