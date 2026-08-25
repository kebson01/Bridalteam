import Link from "next/link";
import PageHero from "@/components/page-hero";
import { pageMetadata } from "@/lib/site";
import { VENDOR_SIGNUP_URL, LOGIN_URL } from "@/lib/config";

export const metadata = pageMetadata({
  path: "/for-vendors",
  title: "For Vendors",
  description:
    "List your business, showcase your work, and get discovered by couples planning their wedding right now.",
});

// Keep every line here to something a vendor can actually verify after signing
// up. The directory is new, so we say so rather than implying an audience that
// isn't there yet — an overstated promise is the fastest way to lose the first
// vendors, who are the ones who make the directory worth browsing.
const BENEFITS = [
  ["Showcase your work", "Add photos, performance video and audio to the inspiration gallery couples browse for ideas."],
  ["Your own profile", "A page with your details, gallery, reviews and contact info — yours to manage anytime."],
  ["Couples share your work", "When a couple saves or shares one of your images, it links straight back to your profile."],
  ["Inquiries and stats", "On a paid plan, couples can message you directly, and you can see how often your listing is viewed and clicked."],
];

// Vendors register through real signup, landing on vendor onboarding.
const REGISTER_HREF = VENDOR_SIGNUP_URL;

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
            <p className="mx-auto mt-3 max-w-sm rounded-lg bg-stone-4 px-4 py-3 text-xs leading-relaxed text-ink-soft/75">
              <span className="font-semibold text-ink">The directory is brand new.</span> We are
              signing up our first vendors now, so early listings get the category to themselves
              &mdash; but be aware you are joining at the beginning, not into an established
              audience. A free listing costs nothing to try.
            </p>
            <Link
              href={REGISTER_HREF}
              className="mt-6 inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-8 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Register your business
            </Link>
            <p className="mt-4 text-xs text-ink-soft/60">
              Already registered?{" "}
              <Link href={LOGIN_URL} className="font-semibold text-brand-text">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
