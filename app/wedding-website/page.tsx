import Link from "next/link";
import PageHero from "@/components/page-hero";
import JsonLd from "@/components/json-ld";
import { pageMetadata } from "@/lib/site";
import { SIGNUP_URL } from "@/lib/config";
import { faqSchema, breadcrumbSchema } from "@/lib/structured-data";

/**
 * Public landing page for the guest website feature.
 *
 * The feature itself lives behind sign-in (/w/[id]/website to edit,
 * /wedding/[slug] for guests, both noindex), so until this page existed there
 * was nothing public for "free wedding website" searches to land on. Every
 * claim below is something the editor and the guest page actually do; keep it
 * that way when either changes.
 *
 * The CTA uses SIGNUP_URL like every other signup button.
 */

export const metadata = pageMetadata({
  path: "/wedding-website",
  title: "Free Wedding Website",
  ogTitle: "Free Wedding Website with Private RSVPs — Bridal Team",
  description:
    "Make a free wedding website in minutes: your date, venue, photo, welcome note and registry, plus a private RSVP link for every household.",
});

const CTA_LABEL = "Create your free wedding website";

const FEATURES: Array<[string, string]> = [
  ["Your day at a glance", "Your names, date, venue and city up top, so guests have the essentials in one place."],
  ["A cover photo", "Upload your favorite photo and choose how it's framed. The text stays readable over any picture."],
  ["A welcome note", "Tell guests about the day in your own words: travel, dress code, anything they should know."],
  ["Registry links", "Link the registries you already use. Guests see them in one tidy row."],
  ["Private RSVPs", "Every household gets its own invitation link, and their reply lands straight in your guest list."],
  ["Live when you say so", "Keep it as a draft while you work, publish when you're ready, unpublish any time."],
];

const STEPS: Array<[string, string]> = [
  ["Add your details", "Names, date, venue, a welcome note and a cover photo."],
  ["Publish", "Your site gets its own address on bridalteam.com, ready to share."],
  ["Collect replies", "Send each household its private link and watch RSVPs fill in your guest list."],
];

const FAQS = [
  {
    q: "Is the wedding website really free?",
    a: "Yes. Bridal Team is free for couples, with no card required, and the wedding website is included along with the AI planner, guest list, budget and the rest of the planning tools.",
  },
  {
    q: "How do guests RSVP?",
    a: "RSVPs are private. Each household on your guest list gets its own invitation link, and their reply is saved against their row in your guest list, so you can see who has replied and who you're still waiting on.",
  },
  {
    q: "Will my wedding website show up on Google?",
    a: "No. Couples' wedding websites are hidden from search engines, so only the people you share the link with will find it.",
  },
  {
    q: "Can I add our registry?",
    a: "Yes. Add links to the registries you already use and they appear on your site for guests.",
  },
  {
    q: "What will the web address be?",
    a: "When you publish, your site gets its own address on bridalteam.com that you can copy and share with guests.",
  },
  {
    q: "Can I take it down later?",
    a: "Yes. You can unpublish your site at any time and publish it again when you're ready.",
  },
];

export default function WeddingWebsitePage() {
  return (
    <>
      <JsonLd data={faqSchema(FAQS)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Free Wedding Website", path: "/wedding-website" },
        ])}
      />

      <PageHero
        eyebrow="Free for couples"
        title="Free Wedding Website"
        subtitle="One beautiful page with everything your guests need: the date, the place, your story, your registry, and a private RSVP link for every household."
      />

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-light uppercase tracking-wide text-ink">
              Made in minutes, shared with one link
            </h2>
            <p className="mt-4 max-w-lg leading-relaxed text-ink-soft/85">
              Your wedding website sits right next to the rest of your plan: the guest list,
              the budget, the timeline and the AI planner. Invitations, RSVPs and your site all
              draw from the same guest list, so nothing needs to be copied between tools.
            </p>
            <Link
              href={SIGNUP_URL}
              className="mt-8 inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              {CTA_LABEL}
            </Link>
          </div>

          {/* A sample, drawn with the same look as the real guest page
              (app/wedding/[slug]). Marked as an example on purpose. */}
          <figure aria-label="Example wedding website" className="mx-auto w-full max-w-md">
            <div className="overflow-hidden rounded-3xl border border-stone-2 shadow-card">
              <div
                className="px-6 py-14 text-center text-white"
                style={{
                  background:
                    "radial-gradient(120% 130% at 80% 10%, rgba(243,103,5,0.35), transparent 55%), linear-gradient(160deg, #2f2622, #1c1512)",
                }}
              >
                <p className="font-display text-[10px] font-semibold tracking-[0.32em] text-brand">
                  TOGETHER WITH THEIR FAMILIES
                </p>
                <p className="mt-3 font-display text-3xl font-semibold tracking-wide">Alex &amp; Jordan</p>
                <p className="mt-3 text-sm text-white/80">Saturday, June 12</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-white/55">
                  Fort Lauderdale · FL
                </p>
              </div>
              <div className="space-y-4 bg-white px-6 py-8 text-center">
                <p className="text-sm leading-relaxed text-ink-soft/80">
                  We can&rsquo;t wait to celebrate with you. Details on travel and the day are below.
                </p>
                <div className="rounded-2xl border border-stone-2 p-4">
                  <p className="font-medium text-ink">RSVP</p>
                  <p className="mt-1 text-xs text-ink-soft/70">Reply with the link in your invitation.</p>
                </div>
                <div className="flex justify-center gap-2">
                  <span className="rounded-full border border-stone-2 px-4 py-1.5 text-xs font-semibold text-ink-soft">
                    Registry
                  </span>
                  <span className="rounded-full border border-stone-2 px-4 py-1.5 text-xs font-semibold text-ink-soft">
                    Honeymoon fund
                  </span>
                </div>
              </div>
            </div>
            <figcaption className="mt-3 text-center text-xs text-ink-soft/60">
              Example only. Your site uses your names, date, photo and words.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="border-t border-stone-2 bg-stone-4 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-2xl font-light uppercase tracking-wide text-ink">
            What&rsquo;s on your site
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <h2 className="text-2xl font-light uppercase tracking-wide text-ink">Planning the invitations too?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-soft/80">
          Read{" "}
          <Link href="/guides/save-the-dates-vs-invitations" className="text-brand-text underline">
            save-the-dates vs. invitations
          </Link>
          , our{" "}
          <Link href="/guides/wedding-invitations-guide" className="text-brand-text underline">
            wedding invitations guide
          </Link>{" "}
          and{" "}
          <Link href="/guides/wedding-guest-list" className="text-brand-text underline">
            how to build your guest list
          </Link>
          , or ask the{" "}
          <Link href="/planner" className="text-brand-text underline">
            free AI wedding planner
          </Link>{" "}
          anything.
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
