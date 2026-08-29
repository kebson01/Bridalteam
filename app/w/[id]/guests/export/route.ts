import { NextResponse } from "next/server";
import { listGuests } from "../actions";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The guest list as a CSV a caterer can actually use.
 *
 * One row per *person*, not per household — a caterer counts plates, and a
 * household row holding "Ada, Chidi" in one cell can't be sorted, filtered or
 * totalled. Households who declined or haven't replied still get a row each, so
 * nothing silently disappears from the file.
 *
 * Reads through the signed-in user's session so RLS scopes it to weddings they
 * can actually reach; there's no id-guessing route to somebody else's list.
 */

/** RFC 4180: quote anything containing a comma, quote or newline; double inner quotes. */
function cell(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: wedding } = await supabase
    .from("weddings")
    .select("partner_one, partner_two, event_date")
    .eq("id", id)
    .maybeSingle();
  // RLS hides weddings this user can't reach, so "missing" and "not yours" are
  // the same answer here.
  if (!wedding) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const guests = await listGuests(id);
  if (guests === null) {
    return NextResponse.json({ error: "Couldn't load the guest list." }, { status: 500 });
  }

  const header = [
    "Household",
    "Guest",
    "Dish",
    "Dietary needs",
    "Status",
    "Seats invited",
    "Email",
    "Note",
  ];
  const rows: string[][] = [];

  for (const g of guests) {
    const base = [g.household_name, g.seats, g.email ?? "", g.note ?? ""];
    const dietary = g.dietary || g.meal || "";

    if (g.responded_at && g.attending) {
      if (g.attendees.length > 0) {
        g.attendees.forEach((a, i) => {
          rows.push([
            g.household_name,
            a.name?.trim() || `Guest ${i + 1}`,
            a.dish ?? "",
            dietary,
            "Coming",
            String(g.seats),
            g.email ?? "",
            g.note ?? "",
          ]);
        });
      } else {
        // Replied yes before per-person choices existed: keep the head count
        // rather than dropping the household out of the caterer's file.
        rows.push([
          g.household_name,
          `${g.party_size ?? 1} guest${(g.party_size ?? 1) === 1 ? "" : "s"} (no names given)`,
          "",
          dietary,
          "Coming",
          String(base[1]),
          g.email ?? "",
          g.note ?? "",
        ]);
      }
    } else {
      rows.push([
        g.household_name,
        "",
        "",
        dietary,
        g.responded_at ? "Not coming" : g.invited_at ? "Awaiting reply" : "Not invited yet",
        String(g.seats),
        g.email ?? "",
        g.note ?? "",
      ]);
    }
  }

  const csv = [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");

  const couple =
    [wedding.partner_one, wedding.partner_two].filter(Boolean).join("-").replace(/[^\w-]+/g, "") ||
    "wedding";
  const filename = `${couple}-guests-${wedding.event_date ?? "list"}.csv`;

  // Excel ignores the charset header and assumes the system codepage, so a
  // UTF-8 BOM is what actually keeps "Chidi Okafor-Núñez" from arriving mangled.
  return new NextResponse("﻿" + csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
