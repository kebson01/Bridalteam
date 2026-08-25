import PageHero from "@/components/page-hero";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  path: "/contact",
  title: "Contact",
  description: "Get in touch with the Bridal Team — support, privacy and legal.",
});

// Plain mailto links on purpose: legal-notice addresses in the Terms and Privacy
// Policy must be unambiguously reachable, not obfuscated. (If Cloudflare Email
// Address Obfuscation is on for the zone, turn it off under Scrape Shield so
// these render as real mailto links rather than /cdn-cgi/l/email-protection.)
const CHANNELS = [
  {
    label: "General & support",
    email: "hello@bridalteam.com",
    blurb: "Questions about planning, your account, or anything else.",
  },
  {
    label: "Privacy",
    email: "privacy@bridalteam.com",
    blurb: "Data access, export or deletion requests, and privacy questions.",
  },
  {
    label: "Legal",
    email: "legal@bridalteam.com",
    blurb: "Terms of Service, DMCA notices and legal correspondence.",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="We're here to help"
        title="Contact us"
        subtitle="Reach the right team directly. We usually reply within one business day."
      />
      <section className="mx-auto max-w-3xl px-5 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {CHANNELS.map((c) => (
            <div
              key={c.email}
              className="flex flex-col rounded-2xl border border-stone-2 bg-white p-6 shadow-card"
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-text">
                {c.label}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft/80">
                {c.blurb}
              </p>
              <a
                href={`mailto:${c.email}`}
                className="mt-4 text-sm font-semibold text-brand-text hover:underline"
              >
                {c.email}
              </a>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
