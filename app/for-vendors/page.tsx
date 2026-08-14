import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/page-hero";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  alternates: { canonical: "/for-vendors" },
  title: "For Vendors",
  description:
    "List your business, showcase your work, and get discovered by couples planning their wedding right now.",
};

const BENEFITS = [
  ["Showcase your work", "Add photos, performance videos and audio to the inspiration gallery couples browse every day."],
  ["Get discovered", "Couples save and share your work — and it links straight back to your profile."],
  ["Matched by AI", "Our AI recommends you to couples whose style, budget and location fit what you offer."],
  ["Your own profile", "A page with your details, gallery and contact info — yours to manage anytime."],
];

// Vendors register through real signup, landing on vendor onboarding.
const REGISTER_HREF = SHOW_PLANNER_APP
  ? "/auth/signup?next=" + encodeURIComponent("/onboarding?type=vendor")
  : "/signup";

export default function ForVendorsPage() {
  return (
    <>
      <PageHero
        eyebrow="For wedding vendors"
        title="Get discovered by couples"
        subtitle="List your business, showcase your work, and reach couples who are planning right now."
      />

      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="grid items-start gap-12 lg:grid-cols-2">
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

          <div className="rounded-3xl border border-stone-2 bg-white p-8 text-center shadow-card">
            <h2 className="text-xl font-medium text-ink">List your business</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft/75">
              Create your vendor account, build your profile, and start showcasing
              your work to couples today.
            </p>
            <Link
              href={REGISTER_HREF}
              className="mt-6 inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-8 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Register your business
            </Link>
            <p className="mt-4 text-xs text-ink-soft/60">
              Already registered?{" "}
              <Link href={SHOW_PLANNER_APP ? "/auth/login" : "/login"} className="font-semibold text-brand-dark">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
