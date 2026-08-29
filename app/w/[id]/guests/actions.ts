"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { sendEmail, emailLayout } from "@/lib/email";
import { SITE_URL } from "@/lib/site";

/**
 * The guest list and its invitations.
 *
 * A row is a household — "Alex & Sam Smith, 2 seats" — which gets one invite,
 * one personal link and one reply covering everyone, the way a paper invitation
 * works. RLS decides who may touch the list; none of this checks permissions in
 * application code.
 */

export interface Guest {
  id: string;
  household_name: string;
  email: string | null;
  seats: number;
  token: string;
  invited_at: string | null;
  responded_at: string | null;
  attending: boolean | null;
  party_size: number | null;
  meal: string | null;
  note: string | null;
}

export type Result = { ok: boolean; error?: string; sent?: number; added?: number };

const GUEST_COLUMNS =
  "id, household_name, email, seats, token, invited_at, responded_at, attending, party_size, meal, note";

/**
 * A guest's personal RSVP link.
 *
 * Local, not exported: a "use server" module may only export async functions,
 * and nothing outside needs it — the guest list builds the same URL client-side
 * from siteUrl so it can be copied without a round trip.
 */
function inviteLink(token: string): string {
  return `${SITE_URL}/rsvp/${token}`;
}

export async function listGuests(weddingId: string): Promise<Guest[] | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("wedding_guests")
    .select(GUEST_COLUMNS)
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("listGuests failed:", error.code, error.message);
    return null; // null = couldn't load, [] = nobody invited yet
  }
  return (data ?? []) as Guest[];
}

/**
 * Adds households from pasted text, one per line:
 *
 *   Alex & Sam Smith, alex@example.com, 2
 *   The Okafor family, 4
 *   Dana Reyes
 *
 * Email and seats are both optional and order-independent — anything that looks
 * like an address is the email, anything that looks like a number is the seat
 * count. Typing a guest list is tedious enough without a strict format.
 */
export async function addGuests(weddingId: string, raw: string): Promise<Result> {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 500); // a sane ceiling for one paste

  if (lines.length === 0) return { ok: false, error: "Add at least one guest." };

  const rows = lines.map((line) => {
    const parts = line.split(",").map((p) => p.trim()).filter(Boolean);
    const name = parts[0]?.slice(0, 160) ?? "";
    let email: string | null = null;
    let seats = 1;
    for (const p of parts.slice(1)) {
      if (p.includes("@")) email = p.toLowerCase().slice(0, 320);
      else {
        const n = Number.parseInt(p.replace(/[^\d]/g, ""), 10);
        if (Number.isFinite(n) && n > 0) seats = Math.min(n, 20);
      }
    }
    return { wedding_id: weddingId, household_name: name, email, seats };
  }).filter((r) => r.household_name);

  if (rows.length === 0) return { ok: false, error: "Every line needs a name." };

  const supabase = await supabaseServer();
  const { data, error } = await supabase.from("wedding_guests").insert(rows).select("id");
  if (error) {
    console.error("addGuests failed:", error.code, error.message);
    return { ok: false, error: "Couldn’t add those guests. Please try again." };
  }

  revalidatePath(`/w/${weddingId}/guests`);
  return { ok: true, added: data?.length ?? 0 };
}

export async function updateGuest(
  weddingId: string,
  guestId: string,
  patch: { household_name?: string; email?: string; seats?: number },
): Promise<Result> {
  const supabase = await supabaseServer();
  const clean: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.household_name !== undefined) clean.household_name = patch.household_name.trim().slice(0, 160);
  if (patch.email !== undefined) clean.email = patch.email.trim().toLowerCase().slice(0, 320) || null;
  if (patch.seats !== undefined) clean.seats = Math.min(Math.max(patch.seats, 1), 20);

  const { error } = await supabase.from("wedding_guests").update(clean).eq("id", guestId);
  if (error) {
    console.error("updateGuest failed:", error.code, error.message);
    return { ok: false, error: "Couldn’t save that change." };
  }
  revalidatePath(`/w/${weddingId}/guests`);
  return { ok: true };
}

export async function deleteGuest(weddingId: string, guestId: string): Promise<Result> {
  const supabase = await supabaseServer();
  const { error } = await supabase.from("wedding_guests").delete().eq("id", guestId);
  if (error) {
    console.error("deleteGuest failed:", error.code, error.message);
    return { ok: false, error: "Couldn’t remove that guest." };
  }
  revalidatePath(`/w/${weddingId}/guests`);
  return { ok: true };
}

/** The invitation email itself. */
function inviteEmail(guest: Guest, couple: string, dateLine: string, where: string) {
  const link = inviteLink(guest.token);
  const seatLine =
    guest.seats > 1
      ? `Your invitation is for <b>${guest.seats} people</b>.`
      : `Your invitation is for <b>one</b>.`;
  return emailLayout(
    "You're invited",
    `<p style="margin:0 0 14px">Hi ${escapeHtml(guest.household_name)},</p>
     <p style="margin:0 0 14px">
       <b>${escapeHtml(couple)}</b> would love you to join them${escapeHtml(dateLine)}${escapeHtml(where)}.
     </p>
     <p style="margin:0 0 8px">${seatLine} Please let them know if you can make it.</p>
     <p style="margin:18px 0 0;font-size:13px;color:#666">
       This link is just for you — please don&rsquo;t forward it.
     </p>`,
    { label: "RSVP now", url: link },
  );
}

/** Minimal escaping — guest-supplied names go into an HTML email. */
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

/**
 * Emails invitations.
 *
 * Pass a guest id to send one, or omit it to send to everyone who has an email
 * and hasn't been sent one yet — so pressing "Send all" twice doesn't spam the
 * people who already got theirs. Guests without an email are skipped; their
 * link is still on the page to share by hand.
 */
export async function sendInvites(weddingId: string, guestId?: string): Promise<Result> {
  const supabase = await supabaseServer();

  const { data: wedding } = await supabase
    .from("weddings")
    .select("partner_one, partner_two, event_date, city, venue")
    .eq("id", weddingId)
    .maybeSingle();
  if (!wedding) return { ok: false, error: "Couldn’t find that wedding." };

  let q = supabase.from("wedding_guests").select(GUEST_COLUMNS).eq("wedding_id", weddingId).not("email", "is", null);
  if (guestId) q = q.eq("id", guestId);
  else q = q.is("invited_at", null);

  const { data: guests, error } = await q;
  if (error) {
    console.error("sendInvites lookup failed:", error.code, error.message);
    return { ok: false, error: "Couldn’t load your guest list." };
  }
  const list = (guests ?? []) as Guest[];
  if (list.length === 0) {
    return {
      ok: false,
      error: guestId
        ? "That guest has no email address — copy their link instead."
        : "Everyone with an email address has already been invited.",
    };
  }

  const couple = [wedding.partner_one, wedding.partner_two].filter(Boolean).join(" & ") || "The couple";
  const dateLine = wedding.event_date
    ? ` on ${new Date(`${wedding.event_date}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })}`
    : "";
  const place = [wedding.venue, wedding.city].filter(Boolean).join(", ");
  const where = place ? ` in ${place}` : "";

  let sent = 0;
  for (const g of list) {
    const { sent: ok } = await sendEmail({
      to: g.email as string,
      subject: `You're invited to ${couple}'s wedding`,
      html: inviteEmail(g, couple, dateLine, where),
    });
    if (!ok) continue;
    await supabase
      .from("wedding_guests")
      .update({ invited_at: new Date().toISOString() })
      .eq("id", g.id);
    sent++;
  }

  revalidatePath(`/w/${weddingId}/guests`);
  if (sent === 0) {
    return { ok: false, error: "Couldn’t send. Email isn’t configured on the server." };
  }
  return { ok: true, sent };
}
