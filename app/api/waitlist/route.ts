import { NextResponse } from "next/server";
import { supabaseAdmin, supabasePublic } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Deliberately permissive: the goal is to catch typos, not to police the many
// shapes a valid address can legally take.
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const AUDIENCES = new Set(["couple", "vendor"]);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = typeof body.role === "string" && AUDIENCES.has(body.role) ? body.role : "couple";
  const source = typeof body.source === "string" ? body.source.slice(0, 100) : null;
  const rawName = typeof body.name === "string" ? body.name.trim() : "";
  const name = rawName ? rawName.slice(0, 200) : null;

  if (!EMAIL.test(email) || email.length > 320) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  // Write with the service-role key so this route is the only way in. The anon
  // key is public by design, so while it held the INSERT grant anyone could POST
  // straight to PostgREST and skip the validation above — the DB CHECK
  // constraints were doing all the work. Falls back to the public client if
  // SUPABASE_SERVICE_ROLE_KEY isn't configured (local dev), which is why the
  // anon INSERT policy should only be dropped once every deploy sets the key.
  //
  // Either way the list can't be read back out: waitlist has no SELECT policy.
  const supabase = supabaseAdmin() ?? supabasePublic();
  const { error } = await supabase.from("waitlist").insert({ email, role, source, name });

  if (error) {
    // 23505 = unique violation: they're already signed up. That's a success
    // from the visitor's point of view, and confirming it leaks nothing they
    // didn't just type themselves.
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, alreadyJoined: true });
    }
    console.error("waitlist insert failed:", error.code, error.message);
    return NextResponse.json(
      { error: "Something went wrong saving your details. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, alreadyJoined: false });
}
