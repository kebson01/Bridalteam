import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GuestRsvpForm from "@/components/wedding/guest-rsvp-form";
import { supabasePublic } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "You're invited",
  // A personal invitation is not something to put in a search index.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export interface GuestInvite {
  household_name: string;
  seats: number;
  responded_at: string | null;
  attending: boolean | null;
  party_size: number | null;
  meal: string | null;
  note: string | null;
  partner_one: string | null;
  partner_two: string | null;
  event_date: string | null;
  city: string | null;
  venue: string | null;
  welcome_message: string | null;
}

/**
 * A guest's invitation, reached only by their personal token.
 *
 * Deliberately uses the public (anon) client rather than a session: guests have
 * no account and never will. get_guest_invite is SECURITY DEFINER and keyed by
 * the token, so it returns this household's invitation and nothing else — no
 * guest list, no other replies.
 */
export default async function RsvpPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // A malformed token isn't an invitation; don't bother the database with it.
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();

  const supabase = supabasePublic();
  const { data, error } = await supabase.rpc("get_guest_invite", { p_token: token });
  if (error) {
    console.error("get_guest_invite failed:", error.code, error.message);
    notFound();
  }
  const invite = (Array.isArray(data) ? data[0] : data) as GuestInvite | undefined;
  if (!invite) notFound();

  const couple =
    [invite.partner_one, invite.partner_two].filter(Boolean).join(" & ") || "Our wedding";
  const when = invite.event_date
    ? new Date(`${invite.event_date}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const where = [invite.venue, invite.city].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-stone-4/40">
      <section className="relative overflow-hidden bg-ink">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-dark/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
        <div className="relative mx-auto max-w-2xl px-5 py-20 text-center text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-amber">
            You&rsquo;re invited
          </p>
          <h1 className="mt-3 text-4xl font-light uppercase tracking-wide sm:text-5xl">{couple}</h1>
          {when && <p className="mt-5 text-lg font-light text-white/80">{when}</p>}
          {where && <p className="mt-1 text-white/70">{where}</p>}
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-5 py-12">
        {invite.welcome_message && (
          <p className="mb-8 whitespace-pre-line text-center leading-relaxed text-ink-soft/85">
            {invite.welcome_message}
          </p>
        )}

        <GuestRsvpForm token={token} invite={invite} />
      </section>
    </div>
  );
}
