import Link from "next/link";
import JsonLd from "@/components/json-ld";
import { localBusinessSchema, breadcrumbSchema } from "@/lib/structured-data";
import { MediaBadge } from "@/components/inspiration-gallery";
import VendorReviews from "@/components/vendor/vendor-reviews";
import type { VendorReview } from "@/app/vendor/review-actions";
import VendorInquiryButton from "@/components/vendor/inquiry-button";
import TrackView from "@/components/vendor/track-view";
import VendorWebsiteLink from "@/components/vendor/website-link";
import ShareButton from "@/components/vendor/share-button";
import { CheckGlyph, HighlightGlyph, PinGlyph, StarGlyph } from "@/components/vendor/profile-icons";
import { SITE_URL } from "@/lib/site";
import { readSocialLinks } from "@/lib/social";
import { isRegionWide, metroOf, METROS } from "@/lib/areas";
import {
  formatPrice,
  lowestPrice,
  PRICE_TIERS,
  readFaqs,
  readHighlights,
  readPackages,
} from "@/lib/vendor-extras";
import type { Entitlements } from "@/lib/tiers";

/**
 * The public vendor profile, as presentation only: app/v/[id]/page.tsx loads
 * the data and passes it in. Sections render only when the vendor has
 * something for them (packages, FAQs, highlights, portfolio).
 */

export interface ProfileVendor {
  org_id: string;
  business_name: string;
  category: string | null;
  description: string | null;
  city: string | null;
  region: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  social_links?: unknown;
  price_tier?: number | null;
  highlights?: unknown;
  packages?: unknown;
  faqs?: unknown;
  logo_url: string | null;
  cover_url: string | null;
}

export interface ProfileMedia {
  id: string;
  image_url: string;
  title: string;
  media_type: string;
}

export interface ProfileStory {
  slug: string;
  title: string;
  city: string | null;
  venue: string | null;
  cover_url: string | null;
}

function initials(name: string) {
  return name
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="text-2xl font-medium text-ink">{children}</h2>
      {aside}
    </div>
  );
}

const CARD = "rounded-3xl border border-stone-2 bg-white shadow-card";
const PRIMARY =
  "inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-3 text-sm font-semibold text-white";

export default function VendorProfileView({
  vendor,
  media,
  stories,
  reviews,
  ent,
  user,
}: {
  vendor: ProfileVendor;
  media: ProfileMedia[];
  stories: ProfileStory[];
  reviews: VendorReview[];
  ent: Entitlements;
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null;
}) {
  const id = vendor.org_id;
  const profileUrl = `${SITE_URL}/v/${vendor.org_id}`;
  const socials = readSocialLinks(vendor.social_links);
  const highlights = readHighlights(vendor.highlights);
  const packages = readPackages(vendor.packages);
  const faqs = readFaqs(vendor.faqs);
  const tier = PRICE_TIERS.find((t) => t.value === vendor.price_tier) ?? null;
  const fromPrice = lowestPrice(packages);

  const ratings = reviews.map((r) => r.rating).filter((n) => n > 0);
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

  const regionWide = isRegionWide(vendor.city);
  const location = regionWide
    ? `Serves all of ${vendor.city}`
    : [vendor.city, vendor.region].filter(Boolean).join(", ");
  const metro = metroOf(vendor.city);
  const metroLabel = METROS.find((m) => m.id === metro)?.label ?? null;

  const photos = media.filter((m) => m.image_url);
  const cover = vendor.cover_url ?? photos.find((m) => m.media_type === "photo")?.image_url ?? null;
  const portfolioCount = photos.length + stories.length;

  const tabs = [
    { href: "#overview", label: "Overview" },
    ...(portfolioCount ? [{ href: "#portfolio", label: `Portfolio (${portfolioCount})` }] : []),
    ...(packages.length ? [{ href: "#packages", label: "Packages" }] : []),
    { href: "#reviews", label: ratings.length ? `Reviews (${ratings.length})` : "Reviews" },
    ...(faqs.length ? [{ href: "#faq", label: "FAQ" }] : []),
    { href: "#contact", label: "Contact" },
  ];

  const contactLabel = ent.canReceiveInquiries ? "Check dates" : "Contact";

  return (
    <>
      <JsonLd
        data={localBusinessSchema({
          orgId: vendor.org_id,
          name: vendor.business_name,
          description: vendor.description,
          category: vendor.category,
          city: vendor.city,
          region: vendor.region,
          // Only claim the outbound link the page itself is willing to show.
          website: ent.canLinkSite ? vendor.website : null,
          email: vendor.email,
          phone: vendor.phone,
          image: vendor.cover_url ?? vendor.logo_url,
          socials: socials.map((s) => s.url),
          priceRange: tier?.label ?? null,
          reviews,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Vendors", path: "/vendors" },
          { name: vendor.business_name, path: `/v/${vendor.org_id}` },
        ])}
      />
      <TrackView orgId={vendor.org_id} />

      <div className="mx-auto max-w-6xl px-4 pb-28 pt-4 sm:px-5 md:pb-16">
        <Link href="/vendors" className="text-sm font-semibold text-brand-text hover:text-brand-deep">
          ← All vendors
        </Link>

        {/* Cover */}
        <div className="relative mt-3 overflow-hidden rounded-3xl bg-brand-soft shadow-card">
          <div className="aspect-[4/3] sm:aspect-[16/7]">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={`${vendor.business_name}`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-wash via-white to-brand-wash">
                <span className="font-display text-6xl font-light tracking-widest text-brand-text/70 sm:text-7xl">
                  {initials(vendor.business_name)}
                </span>
              </div>
            )}
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/25 to-transparent" />
          <div className="absolute inset-x-3 top-3 flex items-start justify-between">
            {ent.badge ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink shadow-sm backdrop-blur">
                <StarGlyph className="h-3.5 w-3.5 text-brand" /> Featured vendor
              </span>
            ) : (
              <span />
            )}
            <ShareButton url={profileUrl} title={vendor.business_name} />
          </div>
        </div>

        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0">
            {/* Title */}
            <header className="flex items-start gap-4">
              {vendor.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={vendor.logo_url} alt="" className="h-16 w-16 flex-none rounded-2xl border border-stone-2 bg-white object-cover shadow-sm" />
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-text">
                  {vendor.category ?? "Wedding vendor"}
                  {tier && (
                    <span className="ml-2 text-ink-soft/70">
                      · {tier.label} <span className="font-medium normal-case tracking-normal">{tier.hint}</span>
                    </span>
                  )}
                </p>
                <h1 className="mt-1.5 text-3xl font-medium leading-tight text-ink sm:text-4xl">{vendor.business_name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
                  {ratings.length > 0 && (
                    <a href="#reviews" className="inline-flex items-center gap-1 hover:text-ink">
                      <StarGlyph className="h-4 w-4 text-brand" />
                      <b className="text-ink">{avg.toFixed(1)}</b>
                      <span className="underline decoration-stone-5 underline-offset-2">
                        ({ratings.length} {ratings.length === 1 ? "review" : "reviews"})
                      </span>
                    </a>
                  )}
                  {location && (
                    <span className="inline-flex items-center gap-1">
                      <PinGlyph className="h-4 w-4 text-ink-soft/60" /> {location}
                    </span>
                  )}
                </div>
              </div>
            </header>

            {/* Section tabs */}
            <nav
              aria-label="On this page"
              className="sticky top-[70px] z-30 -mx-4 mt-6 overflow-x-auto border-b border-stone-2 bg-white/90 px-4 py-2.5 backdrop-blur sm:-mx-5 sm:px-5 lg:mx-0 lg:rounded-full lg:border lg:px-2"
            >
              <ul className="flex gap-2 whitespace-nowrap">
                {tabs.map((t, i) => (
                  <li key={t.href}>
                    <a
                      href={t.href}
                      className={`inline-block rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                        i === 0 ? "bg-ink text-white" : "text-ink-soft hover:bg-stone-4"
                      }`}
                    >
                      {t.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* About */}
            <section id="overview" className="mt-8 scroll-mt-36">
              <SectionTitle>About</SectionTitle>
              {vendor.description ? (
                <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink-soft/90">{vendor.description}</p>
              ) : (
                <p className="mt-3 text-[15px] leading-relaxed text-ink-soft/80">
                  {vendor.business_name} is a {(vendor.category ?? "wedding vendor").toLowerCase()}
                  {location ? ` in ${location.replace(/^Serves all of /, "")}` : ""}. Contact them below to check
                  availability for your date.
                </p>
              )}
              {highlights.length > 0 && (
                <ul className="mt-5 grid grid-cols-2 gap-3">
                  {highlights.map((h, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-3 rounded-2xl p-3.5 ${i % 2 === 0 ? "bg-brand-wash" : "bg-stone-4"}`}
                    >
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white text-brand-text shadow-sm">
                        <HighlightGlyph icon={h.icon} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold leading-snug text-ink">{h.title}</span>
                        {h.detail && <span className="block text-xs leading-snug text-ink-soft/70">{h.detail}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Portfolio */}
            {portfolioCount > 0 && (
              <section id="portfolio" className="mt-12 scroll-mt-36">
                <SectionTitle>Real weddings &amp; looks</SectionTitle>
                <p className="mt-1 text-sm text-ink-soft/70">Their work, and weddings they were part of.</p>

                {stories.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
                    {stories.map((s) => (
                      <Link
                        key={s.slug}
                        href={`/real-weddings/${s.slug}`}
                        className="group overflow-hidden rounded-2xl border border-stone-2 bg-white shadow-card"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-brand-soft">
                          {s.cover_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.cover_url} alt={s.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          )}
                          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[10px] font-semibold uppercase tracking-wider text-ink">
                            Real wedding
                          </span>
                        </div>
                        <div className="p-3 sm:p-3.5">
                          <p className="text-sm font-medium leading-snug text-ink sm:text-base">{s.title}</p>
                          <p className="mt-0.5 text-xs text-ink-soft/70">{[s.venue, s.city].filter(Boolean).join(" · ")}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {photos.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {photos.map((m) => (
                      <Link
                        key={m.id}
                        href={`/i/${m.id}`}
                        className="group relative aspect-[4/5] overflow-hidden rounded-2xl shadow-card"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.image_url} alt={m.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                        <MediaBadge type={m.media_type} />
                        <span className="absolute inset-x-0 bottom-0 p-3 text-sm font-medium text-white">{m.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Packages */}
            {packages.length > 0 && (
              <section id="packages" className="mt-12 scroll-mt-36">
                <SectionTitle>Packages</SectionTitle>
                <p className="mt-1 text-sm text-ink-soft/70">Starting prices and what&apos;s included. Final quotes depend on your date and details.</p>
                <div className="mt-5 space-y-4">
                  {packages.map((p, i) => (
                    <article
                      key={i}
                      className={`rounded-3xl p-5 sm:p-6 ${
                        p.featured ? "border-2 border-brand/70 bg-white shadow-card" : "border border-stone-2 bg-brand-wash/60"
                      }`}
                    >
                      {p.featured && (
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text">Most requested</p>
                      )}
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-xl font-medium leading-snug text-ink">{p.name}</h3>
                        <div className="flex-none text-right">
                          {p.price !== null ? (
                            <>
                              <span className="block text-[11px] text-ink-soft/60">From</span>
                              <span className="font-display text-2xl font-medium text-ink">{formatPrice(p.price)}</span>
                            </>
                          ) : (
                            <span className="text-sm font-medium text-ink-soft">Ask for a quote</span>
                          )}
                        </div>
                      </div>
                      {p.description && (
                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft/85">{p.description}</p>
                      )}
                      {p.includes.length > 0 && (
                        <ul className="mt-4 space-y-2">
                          {p.includes.map((item, j) => (
                            <li key={j} className="flex items-start gap-2.5 text-sm text-ink">
                              <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand/15 text-brand-text">
                                <CheckGlyph className="h-3 w-3" />
                              </span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                      {p.featured && (
                        <a href="#contact" className={`${PRIMARY} mt-5 w-full`}>
                          {ent.canReceiveInquiries ? "Inquire about this package" : "Contact about this package"}
                        </a>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section id="reviews" className="mt-12 scroll-mt-36">
              <VendorReviews
                vendorOrgId={id}
                viewerId={user?.id ?? null}
                initialReviews={reviews}
                heading="Client reviews"
                className=""
                summaryCard
              />
            </section>

            {/* FAQ */}
            {faqs.length > 0 && (
              <section id="faq" className="mt-12 scroll-mt-36">
                <SectionTitle>Questions couples ask</SectionTitle>
                <div className="mt-4 space-y-3">
                  {faqs.map((f, i) => (
                    <details key={i} className="group rounded-2xl border border-stone-2 bg-white px-5 py-4 open:shadow-card">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink">
                        {f.q}
                        <span aria-hidden className="text-lg leading-none text-ink-soft/50 transition-transform group-open:rotate-45">+</span>
                      </summary>
                      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft/85">{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Contact */}
          <aside id="contact" className="scroll-mt-36 lg:pt-1">
            <div className={`${CARD} p-5 sm:p-6 lg:sticky lg:top-24`}>
              <h2 className="text-xl font-medium text-ink">Location &amp; contact</h2>
              {fromPrice !== null && (
                <p className="mt-1 text-sm text-ink-soft">
                  Packages from <b className="text-ink">{formatPrice(fromPrice)}</b>
                </p>
              )}
              <dl className="mt-4 space-y-3 text-sm">
                {location && (
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-ink-soft/50">Based in</dt>
                    <dd className="mt-0.5 text-ink">
                      {location}
                      {metroLabel && !regionWide && metroLabel !== vendor.city && (
                        <span className="text-ink-soft/70"> · {metroLabel}</span>
                      )}
                    </dd>
                  </div>
                )}
                {vendor.website && ent.canLinkSite && (
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-ink-soft/50">Website</dt>
                    <dd className="mt-0.5"><VendorWebsiteLink orgId={vendor.org_id} /></dd>
                  </div>
                )}
                {vendor.phone && (
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-ink-soft/50">Phone</dt>
                    <dd className="mt-0.5">
                      <a href={`tel:${vendor.phone.replace(/[^\d+]/g, "")}`} className="text-ink hover:text-brand-text">{vendor.phone}</a>
                    </dd>
                  </div>
                )}
                {vendor.email && (
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-ink-soft/50">Email</dt>
                    <dd className="mt-0.5 break-all">
                      <a href={`mailto:${vendor.email}`} className="text-brand-text hover:underline">{vendor.email}</a>
                    </dd>
                  </div>
                )}
                {socials.length > 0 && (
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-ink-soft/50">Follow</dt>
                    <dd className="mt-1 flex flex-wrap gap-2">
                      {socials.map((s) => (
                        <a
                          key={s.platform}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="rounded-full border border-stone-2 px-3 py-1 text-xs font-medium text-ink-soft hover:border-brand hover:text-brand-text"
                        >
                          {s.label}
                        </a>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
              {ent.canReceiveInquiries && (
                <div className="mt-5">
                  <VendorInquiryButton
                    vendorOrgId={vendor.org_id}
                    signedIn={Boolean(user)}
                    defaultName={(user?.user_metadata?.full_name as string | undefined) ?? ""}
                    defaultEmail={user?.email ?? ""}
                    loginHref={`/auth/login?next=/v/${vendor.org_id}`}
                  />
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Phone: price and the one action that matters, always in reach. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-2 bg-white/95 backdrop-blur md:hidden print:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            {fromPrice !== null ? (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft/60">Packages from</p>
                <p className="font-display text-lg font-medium leading-tight text-ink">{formatPrice(fromPrice)}</p>
              </>
            ) : (
              <>
                <p className="truncate text-sm font-semibold text-ink">{vendor.business_name}</p>
                <p className="truncate text-xs text-ink-soft/70">
                  {[vendor.category, tier?.label].filter(Boolean).join(" · ")}
                </p>
              </>
            )}
          </div>
          <div className="flex flex-none items-center gap-2">
            {vendor.phone && (
              <a
                href={`tel:${vendor.phone.replace(/[^\d+]/g, "")}`}
                className="inline-flex items-center justify-center rounded-full border border-stone-2 px-4 py-2.5 text-sm font-semibold text-ink"
              >
                Call
              </a>
            )}
            <a href="#contact" className={`${PRIMARY} py-2.5`}>
              {contactLabel}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
