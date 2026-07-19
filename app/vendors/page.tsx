import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero from "@/components/page-hero";
import VendorDirectory from "@/components/vendor-directory";
import { supabasePublic, type Venue } from "@/lib/supabase";
import { SHOW_VENDOR_DIRECTORY } from "@/lib/flags";

export const metadata: Metadata = {
  // Bare string — layout's title.template appends the brand.
  title: "Find Wedding Vendors",
  description:
    "Browse venues, photographers, florists, caterers and more — or let AI match you with the best-fit vendors for your style, budget and location.",
};

// Always read fresh venue data at request time.
export const dynamic = "force-dynamic";

type LoadResult =
  | { status: "ok"; venues: Partial<Venue>[] }
  | { status: "empty" }
  | { status: "error" };

/**
 * There is deliberately no hardcoded fallback list here. An earlier version
 * rendered invented sample venues whenever the query failed, which presented
 * fictional listings as real ones and hid a table-name bug for weeks. Failing
 * visibly is the safer behaviour for a directory people book from.
 */
async function getVenues(): Promise<LoadResult> {
  try {
    const supabase = supabasePublic();
    const { data, error } = await supabase
      .from("vendors")
      .select("*")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("vendors query failed:", error.code, error.message);
      return { status: "error" };
    }
    if (!data || data.length === 0) return { status: "empty" };
    return { status: "ok", venues: data };
  } catch (err) {
    console.error("vendors query threw:", err);
    return { status: "error" };
  }
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-2 bg-stone-4 p-12 text-center">
      <h2 className="text-lg font-medium text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft/75">
        {body}
      </p>
      <Link
        href="/planner"
        className="mt-6 inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white"
      >
        Ask the AI planner instead
      </Link>
    </div>
  );
}

export default async function VendorsPage() {
  // Hidden until the directory holds real listings — see lib/flags.ts.
  if (!SHOW_VENDOR_DIRECTORY) notFound();

  const result = await getVenues();

  return (
    <>
      <PageHero
        eyebrow="Smart vendor matching"
        title="Find your dream team"
        subtitle="Browse the directory, or tell our AI your style, budget and location and get matched with vendors who actually fit your day."
      />

      <section className="mx-auto max-w-6xl px-5 py-12">
        {result.status === "ok" ? (
          <VendorDirectory venues={result.venues} />
        ) : result.status === "empty" ? (
          <Notice
            title="No vendors listed yet"
            body="We're building the directory with real, bookable vendors. Check back soon — or let the AI planner suggest what to book first."
          />
        ) : (
          <Notice
            title="We couldn't load the directory"
            body="Something went wrong fetching vendors. Please try again in a moment."
          />
        )}

        <p className="mt-10 text-center text-sm text-ink-soft/60">
          Venues are managed in Supabase. Add or edit them from the{" "}
          <Link href="/admin/venues" className="font-semibold text-brand-dark">
            venue admin
          </Link>
          . Vendors can also{" "}
          <Link href="/for-vendors" className="font-semibold text-brand-dark">
            join the waitlist
          </Link>
          .
        </p>
      </section>
    </>
  );
}
