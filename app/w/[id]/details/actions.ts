"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

// RLS enforces edit access: the weddings UPDATE policy is can_edit_wedding(id),
// so a viewer without edit rights gets 0 rows updated rather than a silent write.

export interface DetailsInput {
  partnerOne: string;
  partnerTwo: string;
  eventDate: string; // "" clears it
  city: string;
  region: string;
  venue: string;
  guestCount: string; // raw from the form
  budgetDollars: string; // raw from the form
  style: string;
  notes: string;
  /** Move existing task deadlines by the same number of days as the date moved. */
  shiftDeadlines: boolean;
}

export interface DetailsResult {
  ok: boolean;
  error?: string;
  /** Number of task deadlines moved, when the date changed and shifting was asked for. */
  shifted?: number;
  daysMoved?: number;
}

const clamp = (s: string, n: number) => s.trim().slice(0, n);

/** Blank string -> null, so clearing a field actually clears it. */
const orNull = (s: string) => (s.trim() === "" ? null : s.trim());

export async function updateWeddingDetails(
  weddingId: string,
  input: DetailsInput,
): Promise<DetailsResult> {
  if (!weddingId) return { ok: false, error: "Missing wedding." };

  const supabase = await supabaseServer();

  // Read the current row first: we need the old date to work out how far the
  // wedding moved, and this doubles as an access check (RLS hides weddings you
  // can't reach, so `null` here means no access rather than "no such wedding").
  const { data: before, error: readErr } = await supabase
    .from("weddings")
    .select("id, event_date")
    .eq("id", weddingId)
    .maybeSingle();
  if (readErr || !before) return { ok: false, error: "Couldn't find that wedding." };

  const guests = Number.parseInt(input.guestCount.replace(/[^\d]/g, ""), 10);
  const dollars = Number.parseFloat(input.budgetDollars.replace(/[^\d.]/g, ""));

  const eventDate = orNull(input.eventDate);
  if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return { ok: false, error: "That date doesn't look right." };
  }

  const patch = {
    partner_one: orNull(clamp(input.partnerOne, 120)),
    partner_two: orNull(clamp(input.partnerTwo, 120)),
    event_date: eventDate,
    city: orNull(clamp(input.city, 120)),
    region: orNull(clamp(input.region, 120)),
    venue: orNull(clamp(input.venue, 200)),
    guest_count: Number.isFinite(guests) && guests >= 0 ? guests : null,
    budget_cents: Number.isFinite(dollars) && dollars >= 0 ? Math.round(dollars * 100) : null,
    style: orNull(clamp(input.style, 300)),
    notes: orNull(clamp(input.notes, 2000)),
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .from("weddings")
    .update(patch)
    .eq("id", weddingId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("updateWeddingDetails failed:", error.code, error.message);
    return { ok: false, error: "Couldn't save those changes." };
  }
  // RLS returning no row means the UPDATE policy refused it.
  if (!updated) return { ok: false, error: "You don't have permission to edit this wedding." };

  // ── Keep deadlines meaningful when the date moves ────────────────────────
  // Task dates are computed from the wedding date when the plan is seeded, so
  // moving the wedding without moving them leaves every deadline silently
  // wrong. shift_wedding_dates() moves due_date, start_date and milestone
  // target dates by the same delta in one round trip, under the existing RLS
  // rules. Opt-in, because a couple who has already re-planned by hand
  // shouldn't have that work overwritten.
  let shifted = 0;
  let daysMoved = 0;
  const oldDate = before.event_date as string | null;
  if (input.shiftDeadlines && oldDate && eventDate && oldDate !== eventDate) {
    const MS_PER_DAY = 86_400_000;
    daysMoved = Math.round(
      (Date.parse(`${eventDate}T00:00:00Z`) - Date.parse(`${oldDate}T00:00:00Z`)) / MS_PER_DAY,
    );
    if (daysMoved !== 0) {
      const { data: moved, error: shiftErr } = await supabase.rpc("shift_wedding_dates", {
        p_wedding: weddingId,
        p_days: daysMoved,
      });
      if (shiftErr) {
        // The details themselves saved; only the shift failed. Say so rather
        // than reporting a clean success and leaving stale deadlines behind.
        console.error("shift_wedding_dates failed:", shiftErr.code, shiftErr.message);
        return {
          ok: true,
          shifted: 0,
          daysMoved,
          error: "Details saved, but your existing deadlines couldn't be moved.",
        };
      }
      shifted = typeof moved === "number" ? moved : 0;
    }
  }

  revalidatePath(`/w/${weddingId}`);
  revalidatePath(`/w/${weddingId}/details`);
  revalidatePath(`/w/${weddingId}/budget`);
  revalidatePath("/dashboard");
  return { ok: true, shifted, daysMoved };
}
