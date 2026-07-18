import type { Metadata } from "next";
import PageHero from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Privacy Policy — Bridal Team",
  description: "How Bridal Team handles your data.",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy" />
      <section className="mx-auto max-w-3xl px-5 py-16 text-ink-soft/85">
        <p className="text-sm text-ink-soft/60">Last updated: 2026</p>
        <div className="mt-6 space-y-6 leading-relaxed">
          <div>
            <h2 className="text-lg font-medium text-ink">The short version</h2>
            <p className="mt-2">
              We collect only what we need to help you plan your wedding, we
              don&rsquo;t sell your data, and you can delete your account at any
              time. This preview is a demonstration; production terms will be
              published before accounts open.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-ink">What we collect</h2>
            <p className="mt-2">
              Account details you provide (like your name and email), and the
              planning information you choose to add. Messages you send to the AI
              planner are used to generate your responses.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-ink">How we use it</h2>
            <p className="mt-2">
              To provide and improve the planning experience — timelines,
              budgets, vendor matching and collaboration with your team. We do
              not sell personal information.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-ink">Your choices</h2>
            <p className="mt-2">
              You can access, export or delete your data. Questions? Email{" "}
              <a href="mailto:privacy@bridalteam.com" className="font-semibold text-brand-dark">
                privacy@bridalteam.com
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
