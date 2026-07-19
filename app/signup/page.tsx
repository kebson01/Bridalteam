import type { Metadata } from "next";
import PageHero from "@/components/page-hero";
import AuthForm from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Start Free",
  description: "Open your free Bridal Team account and start planning with AI.",
};

const PERKS = [
  "Your whole wedding in one place",
  "AI planner, timelines & budgets",
  "Invite your partner and team",
  "Free to start — no card required",
];

export default function SignupPage() {
  return (
    <>
      <PageHero eyebrow="Early access" title="Join the waitlist" />
      <section className="mx-auto grid max-w-5xl items-start gap-12 px-5 py-16 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-light uppercase tracking-wide text-ink">
            What you&rsquo;ll get when accounts open
          </h2>
          <ul className="mt-6 space-y-3">
            {PERKS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-ink-soft/85">
                <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand/15 text-brand-dark">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m20 6-11 11-5-5" />
                  </svg>
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <AuthForm mode="signup" audience="couple" source="signup" />
      </section>
    </>
  );
}
