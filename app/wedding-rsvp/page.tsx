import Link from "next/link";
import PageHero from "@/components/page-hero";
import JsonLd from "@/components/json-ld";
import { pageMetadata } from "@/lib/site";
import { SIGNUP_URL } from "@/lib/config";
import { REMINDER_COOLDOWN_DAYS } from "@/lib/guests";
import { faqSchema, breadcrumbSchema } from "@/lib/structured-data";

/**
 * Public landing page for the guest list and RSVP feature.
 *
 * The feature lives behind sign-in (/w/[id]/guests for the couple,
 * /rsvp/[token] for each household, noindex), so this is what "wedding RSVP"
 * and "guest list" searches land on. Every claim below is something
 * app/w/[id]/guests and the guest RSVP form actually do; keep it that way when
 * either changes.
 */

export const metadata = pageMetadata({
  path: "/wedding-rsvp",
  title: "Wedding Guest List & RSVP",
  ogTitle: "Free Wedding Guest List & Online RSVP — Bridal Team",
  description:
    "Build your wedding guest list, send every household its own RSVP link, and track who's coming, meal choices and dietary needs in one place. Free.",
});

const CTA_LABEL = "Start your free guest list";

const FEATURES: Array<[string, string]> = [
  ["Paste your whole list", "One household per line. Add an email and a seat count if you have them, in any order, or leave them out."],
  ["One link per household", "Each household gets its own RSVP link. Email invitations from Bridal Team, or copy the link and text it."],
  ["No account for guests", "Guests accept or decline, name everyone coming, pick a dish and note allergies, all from their link."],
  ["Live counts", "See households invited, seats offered, people coming and who you're still waiting on."],
  ["Polite reminders", `Nudge everyone who hasn't replied in one click. Nobody is reminded more than once every ${REMINDER_COOLDOWN_DAYS} days.`],
  ["Replies by phone, too", "When Grandma calls instead of clicking, record her reply yourself. It's saved just like one from the form."],
  ["Menu and dish counts", "Add the dishes on offer and see how many of each to order."],
  ["Ready for the caterer", "Export a spreadsheet with every guest, dish and dietary need, and print place cards and a seating chart."],
];

const STEPS: Array<[string, string]> = [
  ["Add your guests", "Paste or type your list, one household per line."],
  ["Send the invitations", "Email them in one click, or share each link yourself."],
  ["Watch replies arrive", "Counts, meals and dietary needs update as guests answer."],
];

const FAQS = [
  {
    q: "Is it really free?",
    a: "Yes. Bridal Team is free for couples, with no card required. The guest list and RSVPs come with the AI planner, budget, wedding website and the rest of the planning tools.",
  },
  {
    q: "Do guests need an account to RSVP?",
    a: "No. Each household opens its own private link and replies there. There's nothing to sign up for or download.",
  },
  {
    q: "How do plus-ones work?",
    a: "You set how many seats each household gets. When they reply, they name each person coming, up to that number, so you always know exactly who is in each seat.",
  },
  {
    q: "Can guests choose their meal?",
    a: "Yes. Add your menu and each guest picks a dish when they accept. They can also note allergies or dietary needs, and you'll see a count of each dish.",
  },
  {
    q: "What if a guest hasn't replied?",
    a: `Send a reminder to one household or to everyone who hasn't answered. Bridal Team won't remind the same household more than once every ${REMINDER_COOLDOWN_DAYS} days, so nobody gets chased.`,
  },
  {
    q: "Can I give the list to my caterer?",
    a: "Yes. Export a spreadsheet with one row per guest, including their dish and dietary needs, and print place cards or a seating chart from the same list.",
  },
];

export default function WeddingRsvpPage() {
  return (
    <>
      <JsonLd data={faqSchema(FAQS)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Wedding Guest List & RSVP", path: "/wedding-rsvp" },
        ])}
      />

      <PageHero
        eyebrow="Free for couples"
        title="Wedding Guest List & RSVP"
        subtitle="Keep every household, reply, meal choice and dietary need in one list, and give each guest a private link to RSVP."
      />

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-light uppercase tracking-wide text-ink">
              One list, from save-the-date to seating chart
            </h2>
            <p className="mt-4 max-w-lg leading-relaxed text-ink-soft/85">
              Your guest list feeds everything else: the invitations, the replies, the meal
              counts for your caterer and the place cards on the day. Keep it in one place and
              nothing needs to be copied between spreadsheets.
            </p>
            <Link
              href={SIGNUP_URL}
              className="mt-8 inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              {CTA_LABEL}
            </Link>
          </div>

          {/* A sample, drawn to match the real guest RSVP form
              (components/wedding/guest-rsvp-form.tsx). Marked as an example. */}
          <figure aria-label="Example RSVP" className="mx-auto w-full max-w-md">
            <div className="overflow-hidden rounded-3xl border border-stone-2 bg-white shadow-card">
              <div className="border-b border-stone-2 px-6 py-6 text-center">
                <p className="font-display text-[10px] font-semibold tracking-[0.32em] text-brand-text">
                  YOU&rsquo;RE INVITED
                </p>
                <p className="mt-2 font-display text-2xl font-semibold text-ink">Alex &amp; Jordan</p>
                <p className="mt-1 text-xs text-ink-soft/60">The Rivera family · 3 seats</p>
              </div>
              <div className="space-y-4 px-6 py-6">
                <div className="flex gap-3">
                  <span className="flex-1 rounded-full bg-brand px-4 py-2.5 text-center text-xs font-semibold text-white">
                    Joyfully accepts
                  </span>
                  <span className="flex-1 rounded-full border border-stone-2 px-4 py-2.5 text-center text-xs font-semibold text-ink-soft">
                    Regretfully declines
                  </span>
                </div>
                {[
                  ["Maria Rivera", "Grilled fish"],
                  ["Luis Rivera", "Short rib"],
                ].map(([name, dish]) => (
                  <div key={name} className="flex gap-2 text-sm">
                    <span className="flex-1 rounded-lg border border-stone-2 px-3 py-2 text-ink">{name}</span>
                    <span className="flex-1 rounded-lg border border-stone-2 px-3 py-2 text-ink-soft">{dish}</span>
                  </div>
                ))}
                <div className="rounded-lg border border-stone-2 px-3 py-2 text-sm text-ink-soft/80">
                  No shellfish for Luis, please
                </div>
              </div>
            </div>
            <figcaption className="mt-3 text-center text-xs text-ink-soft/60">
              Example only. Your guests see your names, your menu and their own seats.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="border-t border-stone-2 bg-stone-4 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-2xl font-light uppercase tracking-wide text-ink">
            What you can do
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
                <h3 className="text-lg font-medium text-brand-text">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft/80">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-center text-2xl font-light uppercase tracking-wide text-ink">How it works</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
              <span className="font-display text-3xl font-semibold text-brand">{i + 1}</span>
              <h3 className="mt-2 text-lg font-medium text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft/80">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-stone-2 bg-stone-4 py-16">
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="text-center text-2xl font-light uppercase tracking-wide text-ink">Questions</h2>
          <div className="mt-8 space-y-4">
            {FAQS.map((f) => (
              <div key={f.q} className="rounded-2xl border border-stone-2 bg-white p-6">
                <h3 className="font-medium text-ink">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft/80">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h2 className="text-2xl font-light uppercase tracking-wide text-ink">Still writing the list?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-soft/80">
          Read{" "}
          <Link href="/guides/wedding-guest-list" className="text-brand-text underline">
            how to build your guest list
          </Link>
          ,{" "}
          <Link href="/guides/save-the-dates-vs-invitations" className="text-brand-text underline">
            save-the-dates vs. invitations
          </Link>{" "}
          and the{" "}
          <Link href="/guides/wedding-invitations-guide" className="text-brand-text underline">
            wedding invitations guide
          </Link>
          , try the{" "}
          <Link href="/wedding-budget-calculator" className="text-brand-text underline">
            budget calculator
          </Link>{" "}
          to see your cost per guest, or set up your{" "}
          <Link href="/wedding-website" className="text-brand-text underline">
            free wedding website
          </Link>
          .
        </p>
        <Link
          href={SIGNUP_URL}
          className="mt-8 inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          {CTA_LABEL}
        </Link>
      </section>
    </>
  );
}
