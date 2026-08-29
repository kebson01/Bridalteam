"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { sendEmail, emailLayout } from "@/lib/email";
import { SITE_URL } from "@/lib/site";
import { REMINDER_COOLDOWN_DAYS, reminderCutoff } from "@/lib/guests";

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
  /** Allergies and dietary needs for the household, separate from dish choice. */
  dietary: string | null;
  note: string | null;
  reminded_at: string | null;
  reminder_count: number;
  /** Who's actually coming from this household, and what each is eating. */
  attendees: Attendee[];
}

export interface Attendee {
  name: string | null;
  dish: string | null;
}

export type Result = { ok: boolean; error?: string; sent?: number; added?: number };

const GUEST_COLUMNS =
  "id, household_name, email, seats, token, invited_at, responded_at, attending, party_size, meal, dietary, note, reminded_at, reminder_count";

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

  const guests = (data ?? []) as Omit<Guest, "attendees">[];
  if (guests.length === 0) return [];

  // Who is coming, and what each of them ordered. Totals alone answer "how many
  // chickens"; place cards and seating need "which chicken is whose".
  const [{ data: rows, error: aErr }, { data: menu, error: mErr }] = await Promise.all([
    supabase
      .from("guest_attendees")
      .select("guest_id, name, menu_option_id, position")
      .in("guest_id", guests.map((g) => g.id))
      .order("position", { ascending: true }),
    supabase.from("wedding_menu_options").select("id, name").eq("wedding_id", weddingId),
  ]);
  if (aErr || mErr) {
    // The list itself loaded; only the breakdown didn't. Show the households
    // rather than failing the whole page over the detail.
    console.error("listGuests attendees failed:", aErr?.message, mErr?.message);
    return guests.map((g) => ({ ...g, attendees: [] }));
  }

  const dishName = new Map((menu ?? []).map((m) => [m.id as string, m.name as string]));
  const byGuest = new Map<string, Attendee[]>();
  for (const r of rows ?? []) {
    const gid = r.guest_id as string;
    const list = byGuest.get(gid) ?? [];
    list.push({
      name: (r.name as string | null) ?? null,
      dish: r.menu_option_id ? (dishName.get(r.menu_option_id as string) ?? null) : null,
    });
    byGuest.set(gid, list);
  }

  return guests.map((g) => ({ ...g, attendees: byGuest.get(g.id) ?? [] }));
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

/** A gentler second note — not a repeat of the invitation. */
function reminderEmail(guest: Guest, couple: string, dateLine: string) {
  const link = inviteLink(guest.token);
  return emailLayout(
    "A gentle reminder",
    `<p style="margin:0 0 14px">Hi ${escapeHtml(guest.household_name)},</p>
     <p style="margin:0 0 14px">
       We're still hoping to hear from you about <b>${escapeHtml(couple)}</b>'s
       wedding${escapeHtml(dateLine)}. They're finalising numbers, so even a "sorry,
       can't make it" is a real help.
     </p>
     <p style="margin:0 0 8px">It only takes a moment.</p>
     <p style="margin:18px 0 0;font-size:13px;color:#666">
       This link is just for you — please don&rsquo;t forward it.
     </p>`,
    { label: "Reply now", url: link },
  );
}

/**
 * Nudges households who were invited and haven't replied.
 *
 * Pass a guest id for one, or omit it to chase everyone eligible. "Eligible"
 * means invited, still silent, reachable by email, and not already nudged
 * within the cooldown — enforced here in the query, not by the UI hiding the
 * button, because this is the operation that could otherwise mail somebody's
 * guests over and over.
 */
export async function sendReminders(weddingId: string, guestId?: string): Promise<Result> {
  const supabase = await supabaseServer();

  const { data: wedding } = await supabase
    .from("weddings")
    .select("partner_one, partner_two, event_date")
    .eq("id", weddingId)
    .maybeSingle();
  if (!wedding) return { ok: false, error: "Couldn’t find that wedding." };

  const cutoff = reminderCutoff().toISOString();
  let q = supabase
    .from("wedding_guests")
    .select(GUEST_COLUMNS)
    .eq("wedding_id", weddingId)
    .not("email", "is", null)
    .not("invited_at", "is", null)
    .is("responded_at", null)
    .or(`reminded_at.is.null,reminded_at.lt.${cutoff}`);
  if (guestId) q = q.eq("id", guestId);

  const { data: guests, error } = await q;
  if (error) {
    console.error("sendReminders lookup failed:", error.code, error.message);
    return { ok: false, error: "Couldn’t load your guest list." };
  }

  const list = (guests ?? []) as Guest[];
  if (list.length === 0) {
    return {
      ok: false,
      error: guestId
        ? `Nothing to send — they've either replied, have no email, or were reminded in the last ${REMINDER_COOLDOWN_DAYS} days.`
        : `No one to remind right now. Everyone has either replied or was nudged in the last ${REMINDER_COOLDOWN_DAYS} days.`,
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

  let sent = 0;
  for (const g of list) {
    const { sent: ok } = await sendEmail({
      to: g.email as string,
      subject: `Still hoping to hear from you — ${couple}'s wedding`,
      html: reminderEmail(g, couple, dateLine),
    });
    if (!ok) continue;
    await supabase
      .from("wedding_guests")
      .update({
        reminded_at: new Date().toISOString(),
        reminder_count: (g.reminder_count ?? 0) + 1,
      })
      .eq("id", g.id);
    sent++;
  }

  revalidatePath(`/w/${weddingId}/guests`);
  if (sent === 0) {
    return { ok: false, error: "Couldn’t send. Email isn’t configured on the server." };
  }
  return { ok: true, sent };
}

/* ────────────────────────────── Menu ────────────────────────────── */

export interface MenuOption {
  id: string;
  name: string;
  description: string | null;
  position: number;
}

/** A dish and how many people have chosen it — what the caterer actually needs. */
export interface DishCount {
  id: string;
  name: string;
  chosen: number;
}

export async function listMenu(weddingId: string): Promise<MenuOption[] | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("wedding_menu_options")
    .select("id, name, description, position")
    .eq("wedding_id", weddingId)
    .order("position", { ascending: true });
  if (error) {
    console.error("listMenu failed:", error.code, error.message);
    return null;
  }
  return (data ?? []) as MenuOption[];
}

export async function addMenuOption(
  weddingId: string,
  name: string,
  description: string,
): Promise<Result> {
  const clean = name.trim().slice(0, 120);
  if (!clean) return { ok: false, error: "Give the dish a name." };

  const supabase = await supabaseServer();
  // Append to the end of the menu.
  const { data: last } = await supabase
    .from("wedding_menu_options")
    .select("position")
    .eq("wedding_id", weddingId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("wedding_menu_options").insert({
    wedding_id: weddingId,
    name: clean,
    description: description.trim().slice(0, 300) || null,
    position: (last?.position ?? 0) + 1,
  });
  if (error) {
    console.error("addMenuOption failed:", error.code, error.message);
    return { ok: false, error: "Couldn’t add that dish. Please try again." };
  }
  revalidatePath(`/w/${weddingId}/guests`);
  return { ok: true };
}

/**
 * Removes a dish.
 *
 * guest_attendees.menu_option_id is ON DELETE SET NULL, so anyone who already
 * chose this dish keeps their place at the table and simply shows as having no
 * dish — deleting a menu item must not quietly un-invite people.
 */
export async function deleteMenuOption(weddingId: string, optionId: string): Promise<Result> {
  const supabase = await supabaseServer();
  const { error } = await supabase.from("wedding_menu_options").delete().eq("id", optionId);
  if (error) {
    console.error("deleteMenuOption failed:", error.code, error.message);
    return { ok: false, error: "Couldn’t remove that dish." };
  }
  revalidatePath(`/w/${weddingId}/guests`);
  return { ok: true };
}

/** Per-dish totals across everyone who has replied yes. */
export async function listDishCounts(weddingId: string): Promise<DishCount[] | null> {
  const supabase = await supabaseServer();

  // Two plain queries rather than one embedded join. PostgREST can filter on an
  // embedded resource, but a subtly wrong relationship name fails by returning
  // the wrong rows instead of an error — and wrong catering numbers are worse
  // than an extra round trip. RLS scopes all of these to this wedding anyway.
  const [{ data: menu, error: mErr }, { data: guestRows, error: gErr }] = await Promise.all([
    supabase
      .from("wedding_menu_options")
      .select("id, name, position")
      .eq("wedding_id", weddingId)
      .order("position", { ascending: true }),
    supabase.from("wedding_guests").select("id").eq("wedding_id", weddingId),
  ]);
  if (mErr || gErr) {
    console.error("listDishCounts failed:", mErr?.message, gErr?.message);
    return null;
  }

  const guestIds = (guestRows ?? []).map((g) => g.id as string);
  const tally = new Map<string, number>();
  if (guestIds.length > 0) {
    const { data: rows, error: aErr } = await supabase
      .from("guest_attendees")
      .select("menu_option_id")
      .in("guest_id", guestIds);
    if (aErr) {
      console.error("listDishCounts attendees failed:", aErr.code, aErr.message);
      return null;
    }
    for (const r of rows ?? []) {
      const id = (r as { menu_option_id: string | null }).menu_option_id;
      if (id) tally.set(id, (tally.get(id) ?? 0) + 1);
    }
  }
  return (menu ?? []).map((m) => ({
    id: m.id as string,
    name: m.name as string,
    chosen: tally.get(m.id as string) ?? 0,
  }));
}
