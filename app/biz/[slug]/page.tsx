import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SANDBOX_IFRAME_ATTR } from "@/lib/custom-site/serve";
import { getPublicVendorSite } from "@/lib/vendor-site/public";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await getPublicVendorSite(slug);
  if (!site) return { title: "Website not found", robots: { index: false, follow: false } };
  const l = site.listing;
  const what = [l.category, [l.city, l.region].filter(Boolean).join(", ")].filter(Boolean).join(" in ");
  return {
    title: { absolute: what ? `${l.business_name} · ${what}` : l.business_name },
    description: (l.description ?? `${l.business_name} on Bridal Team.`).slice(0, 160),
    alternates: { canonical: `${SITE_URL}/biz/${slug.toLowerCase()}` },
  };
}

/**
 * A vendor's business website. Their code never runs on this page: it's
 * framed from /sandbox/biz/, which serves it with an opaque origin
 * (lib/custom-site/serve.ts), the same as couples' custom sites.
 */
export default async function VendorWebsitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getPublicVendorSite(slug);
  if (!site) notFound();

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white">
      <iframe
        src={`/sandbox/biz/${encodeURIComponent(slug.toLowerCase())}`}
        title={`${site.listing.business_name} — website`}
        sandbox={SANDBOX_IFRAME_ATTR}
        referrerPolicy="no-referrer"
        className="min-h-0 w-full flex-1 border-0"
      />
      <div className="flex flex-none items-center justify-center gap-3 border-t border-stone-2 bg-white px-4 py-1.5 text-[11px] text-ink-soft/60">
        <Link href={`/v/${site.org_id}`} className="hover:text-brand-text">
          On Bridal Team
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/contact" className="hover:text-brand-text">
          Report this page
        </Link>
      </div>
    </div>
  );
}
