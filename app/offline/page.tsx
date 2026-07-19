import type { Metadata } from "next";
import PageHero from "@/components/page-hero";

// Served by the service worker when a navigation fails with no cached copy.
export const metadata: Metadata = {
  // Bare string — layout's title.template appends the brand.
  title: "Offline",
  description: "You're offline.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <>
      <PageHero eyebrow="No connection" title="You&rsquo;re offline" />
      <section className="mx-auto max-w-3xl px-5 py-16 text-ink-soft/85">
        <p className="leading-relaxed">
          Bridal Team can&rsquo;t reach the network right now. Pages you&rsquo;ve
          already visited will still open — anything new will load as soon
          as you&rsquo;re back online.
        </p>
      </section>
    </>
  );
}
