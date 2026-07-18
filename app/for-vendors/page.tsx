import type { Metadata } from "next";
import PageHero from "@/components/page-hero";
import AuthForm from "@/components/auth-form";

export const metadata: Metadata = {
  title: "For Vendors — Bridal Team",
  description:
    "Get discovered by couples planning their wedding right now. Join the Bridal Team vendor directory.",
};

const BENEFITS = [
  ["Get matched by AI", "Our AI recommends you to couples whose style and budget fit what you offer."],
  ["Quality leads", "Reach couples who are actively planning — not just browsing."],
  ["A profile that shines", "Showcase your work with a gallery, reviews and details couples care about."],
  ["Simple to manage", "One inbox for inquiries, and tools to respond fast."],
];

export default function ForVendorsPage() {
  return (
    <>
      <PageHero
        eyebrow="For wedding vendors"
        title="Get discovered by couples"
        subtitle="Join the Bridal Team directory and let AI match you with couples who are planning right now."
      />

      <section className="mx-auto grid max-w-6xl items-start gap-12 px-5 py-16 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-light uppercase tracking-wide text-ink">
            Why vendors love Bridal Team
          </h2>
          <div className="mt-8 space-y-6">
            {BENEFITS.map(([title, body]) => (
              <div key={title} className="flex gap-4">
                <div className="mt-1 flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-dark text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m20 6-11 11-5-5" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-ink">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft/80">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-4 rounded-2xl bg-stone-4 p-5 text-sm text-ink-soft/80">
            <strong className="text-ink">Join the waitlist.</strong> The vendor
            directory is opening soon — add your email and we&rsquo;ll reach out
            to get your profile set up.
          </div>
          <AuthForm mode="signup" />
        </div>
      </section>
    </>
  );
}
