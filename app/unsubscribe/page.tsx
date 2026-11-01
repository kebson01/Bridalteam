import type { Metadata } from "next";
import PageHero from "@/components/page-hero";
import { readOutreachConfig } from "@/lib/outreach/config";
import { verifyUnsubscribe } from "@/lib/outreach/tokens";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Where the footer link of a vendor claim email lands.
 *
 * Opening the page changes nothing (mail scanners open every link); the
 * buttons POST to /api/outreach/unsubscribe. The business name is shown so a
 * vendor can see which listing the link is for, and nothing else is: someone
 * holding a forwarded email learns no more than the email itself said.
 */
export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-stone-2 bg-white p-8 text-center shadow-card">{children}</div>;
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ o?: string; s?: string; done?: string }>;
}) {
  const { o = "", s = "", done } = await searchParams;

  if (done) {
    return (
      <>
        <PageHero eyebrow="Bridal Team" title={done === "removed" ? "Done: you're unsubscribed and unlisted" : "Done: you're unsubscribed"} />
        <section className="mx-auto max-w-md px-5 py-16">
          <Card>
            <p className="text-sm leading-relaxed text-ink-soft/80">
              {done === "removed"
                ? "You won't get any more emails from us, and your listing has been taken off the site."
                : "You won't get any more emails from us about your listing."}
            </p>
          </Card>
        </section>
      </>
    );
  }

  const { config } = readOutreachConfig();
  const valid = verifyUnsubscribe(config.secret, o, s);
  let business: string | null = null;
  if (valid) {
    const { data } = (await supabaseAdmin()?.from("vendor_profiles").select("business_name").eq("org_id", o).maybeSingle()) ?? { data: null };
    business = data?.business_name ?? null;
  }

  if (!valid || !business) {
    return (
      <>
        <PageHero eyebrow="Bridal Team" title="This link isn't valid" />
        <section className="mx-auto max-w-md px-5 py-16">
          <Card>
            <p className="text-sm leading-relaxed text-ink-soft/80">
              We couldn&rsquo;t match this link to a listing. Reply to the email you received and we&rsquo;ll remove you by hand.
            </p>
          </Card>
        </section>
      </>
    );
  }

  const action = `/api/outreach/unsubscribe?o=${encodeURIComponent(o)}&s=${encodeURIComponent(s)}`;
  return (
    <>
      <PageHero eyebrow="Bridal Team" title="Unsubscribe" />
      <section className="mx-auto max-w-md px-5 py-16">
        <Card>
          <p className="text-sm leading-relaxed text-ink-soft/80">
            Stop emails about <strong className="text-ink">{business}</strong>&rsquo;s listing on Bridal Team?
          </p>
          <form method="post" action={action} className="mt-6 flex flex-col gap-3">
            <button type="submit" className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white">
              Unsubscribe
            </button>
            <button
              type="submit"
              name="remove"
              value="1"
              className="rounded-full border border-stone-2 px-6 py-3 text-sm font-semibold text-ink-soft hover:border-brand"
            >
              Unsubscribe and remove my listing
            </button>
          </form>
        </Card>
      </section>
    </>
  );
}
