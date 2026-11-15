"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import { setVendorPublished } from "@/app/vendor/actions";
import VendorProfileForm, { type VendorProfile } from "@/components/vendor-profile-form";
import { Icon, type IconName } from "@/components/vendor/workspace-ui";

// The design's serif headings. Loaded here, not in the root layout, so only
// this page downloads it.
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });

export type WorkspaceTab = "profile" | "pricing" | "media" | "insights" | "marketing" | "plan";

type TabInfo = { key: WorkspaceTab; label: string; icon: IconName; title: string; subtitle: string; step?: number };

const TABS: TabInfo[] = [
  {
    key: "profile",
    label: "Profile & Bio",
    icon: "store",
    title: "Business Profile & Information",
    subtitle: "Let couples discover who you are, what you offer, and how to reach you directly.",
    step: 1,
  },
  {
    key: "pricing",
    label: "Pricing & Packages",
    icon: "tag",
    title: "Pricing & Packages",
    subtitle: "Give couples a feel for your prices and what's included, and answer what they ask most.",
    step: 2,
  },
  {
    key: "media",
    label: "Media & Gallery",
    icon: "image",
    title: "Media & Gallery",
    subtitle: "Photos, videos and audio that show couples your work.",
    step: 3,
  },
  {
    key: "insights",
    label: "Inquiries & Stats",
    icon: "chart",
    title: "Inquiries & Stats",
    subtitle: "Messages from couples and how your listing is performing.",
  },
  {
    key: "marketing",
    label: "Marketing & Badge",
    icon: "badge",
    title: "Marketing & Badge",
    subtitle: "Send couples from your own website to your Bridal Team listing.",
    step: 4,
  },
  {
    key: "plan",
    label: "Plan & Account",
    icon: "user",
    title: "Plan & Account",
    subtitle: "Your plan, billing and account settings.",
  },
];

const STEPS = TABS.filter((t) => t.step).length;

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() || "BT";
}

/** What a complete listing needs, from the SAVED profile. */
function completeness(profile: VendorProfile, mediaCount: number) {
  const details = [profile.business_name, profile.category, profile.description, profile.city, profile.region, profile.email];
  const detailsDone = details.filter((v) => v && String(v).trim()).length;
  const hasPricing = (profile.packages?.length ?? 0) > 0 || Boolean(profile.price_tier);
  const items = [
    { key: "details", label: "Details", tab: "profile" as const, done: detailsDone === details.length, optional: false },
    {
      key: "media",
      label: mediaCount ? `Media (${mediaCount} item${mediaCount === 1 ? "" : "s"})` : "Media",
      tab: "media" as const,
      done: mediaCount > 0,
      optional: false,
    },
    { key: "pricing", label: "Pricing & Packages", tab: "pricing" as const, done: hasPricing, optional: false },
    { key: "faqs", label: "FAQs (Optional)", tab: "pricing" as const, done: (profile.faqs?.length ?? 0) > 0, optional: true },
  ];
  // Details count 40% (prorated by field), media and pricing 30% each. FAQs are a bonus, not a requirement.
  const percent = Math.round((detailsDone / details.length) * 40 + (mediaCount > 0 ? 30 : 0) + (hasPricing ? 30 : 0));
  return { items, percent };
}

/**
 * The vendor's account page: a header with the listing's identity and publish
 * control, a completeness meter, and tabs for each part of the account. The
 * media, insights, marketing and plan panels are rendered by the server page
 * and passed in; the profile form spans the first two tabs.
 */
export default function VendorWorkspace({
  profile,
  mediaCount,
  initialTab,
  notice,
  panels,
}: {
  profile: VendorProfile;
  mediaCount: number;
  initialTab: WorkspaceTab;
  notice?: React.ReactNode;
  panels: {
    media: React.ReactNode;
    insights: React.ReactNode | null;
    marketing: React.ReactNode;
    plan: React.ReactNode;
  };
}) {
  const tabs = TABS.filter((t) => t.key !== "insights" || panels.insights);
  const [tab, setTab] = useState<WorkspaceTab>(tabs.some((t) => t.key === initialTab) ? initialTab : "profile");
  const [published, setPublished] = useState(profile.status === "published");
  const [togglePending, startToggle] = useTransition();
  const tabsRef = useRef<HTMLDivElement>(null);

  const info = tabs.find((t) => t.key === tab)!;
  const nextStep = info.step ? tabs.find((t) => t.step === info.step! + 1) : undefined;
  const { items, percent } = completeness(profile, mediaCount);
  const location = [profile.city, profile.region].filter(Boolean).join(", ");

  function go(next: WorkspaceTab, scroll = false) {
    setTab(next);
    try {
      const url = new URL(window.location.href);
      url.search = next === "profile" ? "" : `?tab=${next}`;
      window.history.replaceState(null, "", url);
    } catch {
      // URL sync is a convenience only.
    }
    if (scroll) tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function togglePublish() {
    const next = !published;
    setPublished(next);
    startToggle(() => setVendorPublished(profile.org_id, next));
  }

  return (
    <div className={`${playfair.variable} bg-[#fdfaf7]`}>
      {/* Header band */}
      <section className="relative overflow-hidden bg-brand-soft">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-5 pb-8 pt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b34a04]">Vendor account</p>
            {published && (
              <Link
                href={`/v/${profile.org_id}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-2 bg-white px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-brand"
              >
                View public listing
                <Icon name="external" className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-start justify-between gap-6">
            <div className="flex min-w-[min(100%,20rem)] flex-1 items-start gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-stone-2 bg-white font-heading-serif text-xl font-semibold text-[#b34a04] shadow-sm">
                {initials(profile.business_name)}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h1 className="font-heading-serif! text-3xl font-normal text-ink sm:text-4xl">{profile.business_name}</h1>
                  {profile.category && (
                    <span className="rounded-full bg-brand-wash px-2.5 py-0.5 text-xs font-medium text-[#b34a04] ring-1 ring-brand/20">
                      {profile.category}
                    </span>
                  )}
                  {location && (
                    <span className="inline-flex items-center gap-1 text-xs text-ink-soft/70">
                      <Icon name="pin" className="h-3.5 w-3.5" />
                      {location}
                    </span>
                  )}
                </div>
                {profile.description && (
                  <p className="mt-2 line-clamp-2 max-w-xl text-sm leading-relaxed text-ink-soft/80">{profile.description}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={togglePublish}
              disabled={togglePending}
              className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-sm transition-colors disabled:opacity-60 ${
                published
                  ? "border border-stone-2 bg-white text-ink-soft hover:border-brand"
                  : "bg-brand-text text-white hover:bg-[#a84503]"
              }`}
            >
              <Icon name="rocket" className="h-4 w-4" />
              {published ? "Unpublish listing" : "Publish listing"}
            </button>
          </div>

          {/* Status + completeness */}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white bg-white/80 px-5 py-4 shadow-[0_1px_2px_rgba(34,34,34,0.04)] backdrop-blur">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-xs text-ink-soft/70">
                {published ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-green-800 ring-1 ring-green-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-600" aria-hidden /> Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-amber" aria-hidden /> Draft mode
                  </span>
                )}
                {published
                  ? "Couples can find you in the directory."
                  : "Only you can see this listing. Complete the details below, then publish to go live."}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <p className="text-sm font-semibold text-ink">
                  Profile completeness: <span className="text-[#b34a04]">{percent}%</span>
                </p>
                <div
                  className="h-1.5 w-36 overflow-hidden rounded-full bg-stone-2"
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Profile completeness"
                >
                  <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-dark" style={{ width: `${percent}%` }} />
                </div>
              </div>
            </div>
            <ul className="flex flex-wrap gap-2">
              {items.map((it) => (
                <li key={it.key}>
                  <button
                    type="button"
                    onClick={() => go(it.tab, true)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors ${
                      it.done
                        ? "bg-green-50 text-green-800 ring-green-200"
                        : it.optional
                          ? "bg-white text-ink-soft/60 ring-stone-2 hover:ring-brand"
                          : "bg-brand-wash text-[#b34a04] ring-brand/30 hover:ring-brand"
                    }`}
                  >
                    {it.done ? (
                      <Icon name="check" className="h-3.5 w-3.5" />
                    ) : (
                      <span className={`h-1.5 w-1.5 rounded-full ${it.optional ? "bg-stone-5" : "bg-brand"}`} aria-hidden />
                    )}
                    {it.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div ref={tabsRef} className="scroll-mt-16 border-y border-stone-2 bg-white">
        <nav className="mx-auto max-w-5xl overflow-x-auto px-5" aria-label="Vendor account sections">
          <div role="tablist" className="flex min-w-max gap-6">
            {tabs.map((t) => {
              const on = t.key === tab;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  id={`tab-${t.key}`}
                  aria-selected={on}
                  aria-controls={`panel-${t.key}`}
                  onClick={() => go(t.key)}
                  className={`inline-flex items-center gap-2 border-b-2 py-4 text-sm transition-colors ${
                    on ? "border-brand-text font-semibold text-[#b34a04]" : "border-transparent text-ink-soft/70 hover:text-ink"
                  }`}
                >
                  <Icon name={t.icon} className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Panel */}
      <section className="mx-auto max-w-5xl px-5 pb-28 pt-10">
        {notice}
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-2 pb-5">
          <div>
            <h2 className="font-heading-serif! text-2xl font-normal text-ink">{info.title}</h2>
            <p className="mt-1 text-sm text-ink-soft/70">{info.subtitle}</p>
          </div>
          {info.step && (
            <span className="rounded-md bg-brand-wash px-2.5 py-1 text-xs font-medium text-[#b34a04]">
              Step {info.step} of {STEPS}
            </span>
          )}
        </div>

        <div className="mt-6" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {/* Always mounted, so edits on either tab survive switching and save together. */}
          <VendorProfileForm profile={profile} tab={tab} onTabChange={(t) => go(t)} />
          <div hidden={tab !== "media"}>{panels.media}</div>
          {panels.insights && <div hidden={tab !== "insights"} className="space-y-6">{panels.insights}</div>}
          <div hidden={tab !== "marketing"}>{panels.marketing}</div>
          <div hidden={tab !== "plan"} className="space-y-6">{panels.plan}</div>
        </div>

        {nextStep && (
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => go(nextStep.key, true)}
              className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-white px-6 py-3 text-sm font-semibold text-[#b34a04] hover:border-brand"
            >
              Next: {nextStep.label}
              <Icon name="arrow" className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
