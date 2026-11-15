"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateVendorProfile, type ProfileState } from "@/app/vendor/actions";
import { SOCIAL_PLATFORMS, type SocialLinks } from "@/lib/social";
import { CATEGORY_ORDER } from "@/lib/categories";
import ProfileExtrasEditor, { type ProfileExtras } from "@/components/vendor/profile-extras-editor";
import { Icon, SectionCard } from "@/components/vendor/workspace-ui";

export interface VendorProfile extends ProfileExtras {
  org_id: string;
  business_name: string;
  category: string | null;
  description: string | null;
  city: string | null;
  region: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  social_links?: SocialLinks | null;
  status: string;
}

/** Matches the server-side cap in app/vendor/actions.ts. */
const ABOUT_MAX = 2000;

const INPUT =
  "mt-2 w-full rounded-lg border border-stone-2 bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand disabled:opacity-60";
const LABEL = "text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft";
const HINT = "mt-1.5 text-xs text-ink-soft/60";

function Req() {
  return <span className="ml-0.5 text-brand-text" aria-hidden>*</span>;
}

/** An input with a small leading icon, for the contact fields. */
function IconInput({ icon, ...props }: { icon: Parameters<typeof Icon>[0]["name"] } & React.ComponentProps<"input">) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 mt-1 -translate-y-1/2 text-ink-soft/40">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <input {...props} className={`${INPUT} pl-10`} />
    </div>
  );
}

/**
 * The vendor's profile, edited across two tabs of the vendor workspace:
 * "Profile & Bio" and "Pricing & Packages". Both live in ONE form, with the
 * inactive tab's panel hidden rather than unmounted, so a single save carries
 * every field and edits survive switching tabs. Unsaved edits raise a sticky
 * save bar at the bottom of the screen.
 */
export default function VendorProfileForm({
  profile,
  tab,
  onTabChange,
}: {
  profile: VendorProfile;
  tab: string;
  onTabChange: (tab: "profile" | "pricing") => void;
}) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateVendorProfile, {
    error: null,
    saved: false,
  });
  const formRef = useRef<HTMLFormElement>(null);
  const [fieldsDirty, setFieldsDirty] = useState(false);
  const [extrasDirty, setExtrasDirty] = useState(false);
  // Bumped to remount the extras editor from saved props (after save / discard).
  const [extrasKey, setExtrasKey] = useState(0);
  const [aboutLength, setAboutLength] = useState(profile.description?.length ?? 0);
  const dirty = fieldsDirty || extrasDirty;

  // A completed save: the page has been revalidated, so props hold the saved
  // values and React has reset the form to them.
  useEffect(() => {
    if (!state.saved) return;
    setFieldsDirty(false);
    setExtrasKey((k) => k + 1);
    setAboutLength(profile.description?.length ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function discard() {
    formRef.current?.reset();
    setFieldsDirty(false);
    setExtrasKey((k) => k + 1);
    setAboutLength(profile.description?.length ?? 0);
  }

  const categories =
    profile.category && !CATEGORY_ORDER.some((c) => c.toLowerCase() === profile.category!.toLowerCase())
      ? [profile.category, ...CATEGORY_ORDER]
      : CATEGORY_ORDER;

  return (
    <form
      id="vendor-profile-form"
      ref={formRef}
      action={action}
      onChange={() => setFieldsDirty(true)}
      // A required field on a hidden tab can't show its own error: bring its tab forward.
      onInvalidCapture={(e) => {
        const panel = (e.target as HTMLElement).closest<HTMLElement>("[data-panel]");
        if (panel?.dataset.panel === "profile" || panel?.dataset.panel === "pricing") {
          onTabChange(panel.dataset.panel);
        }
      }}
    >
      <input type="hidden" name="org_id" value={profile.org_id} />

      {state.error && (
        <p role="alert" className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
      )}
      {state.saved && !dirty && (
        <p role="status" className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          Your changes are saved.
        </p>
      )}

      <div data-panel="profile" hidden={tab !== "profile"} className="space-y-6">
        <SectionCard icon="briefcase" title="General Business Details">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className={LABEL}>Business name<Req /></span>
              <input required name="business_name" defaultValue={profile.business_name} disabled={pending} className={INPUT} />
              <p className={HINT}>The public company or stage name couples will see.</p>
            </label>
            <label className="block">
              <span className={LABEL}>Primary category<Req /></span>
              <div className="relative">
                <select name="category" defaultValue={profile.category ?? ""} disabled={pending} className={`${INPUT} appearance-none pr-10`}>
                  <option value="">Choose a category</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3.5 top-1/2 mt-1 -translate-y-1/2 text-ink-soft/60">
                  <Icon name="chevron" className="h-4 w-4" />
                </span>
              </div>
              <p className={HINT}>Shown in the directory and its category filters.</p>
            </label>
          </div>

          <label className="mt-5 block">
            <span className="flex items-baseline justify-between gap-3">
              <span className={LABEL}>About your business<Req /></span>
              <span className="text-xs text-ink-soft/50">
                {aboutLength} / {ABOUT_MAX} characters
              </span>
            </span>
            <textarea
              name="description"
              defaultValue={profile.description ?? ""}
              disabled={pending}
              rows={5}
              maxLength={ABOUT_MAX}
              onChange={(e) => setAboutLength(e.target.value.length)}
              placeholder="Tell couples what makes you special…"
              className={`${INPUT} resize-y leading-relaxed`}
            />
          </label>
        </SectionCard>

        <SectionCard icon="pin" title="Location & Direct Inquiries">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className={LABEL}>City<Req /></span>
              <input name="city" defaultValue={profile.city ?? ""} disabled={pending} placeholder="Miami" className={INPUT} />
            </label>
            <label className="block">
              <span className={LABEL}>Region / state<Req /></span>
              <input name="region" defaultValue={profile.region ?? ""} disabled={pending} placeholder="Florida" className={INPUT} />
            </label>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <label className="block">
              <span className={LABEL}>Official website</span>
              <IconInput icon="globe" name="website" defaultValue={profile.website ?? ""} disabled={pending} placeholder="https://…" />
            </label>
            <label className="block">
              <span className={LABEL}>Contact email<Req /></span>
              <IconInput icon="mail" type="email" name="email" defaultValue={profile.email ?? ""} disabled={pending} placeholder="you@business.com" />
            </label>
            <label className="block">
              <span className={LABEL}>Direct phone</span>
              <IconInput icon="phone" type="tel" name="phone" defaultValue={profile.phone ?? ""} disabled={pending} placeholder="(305) 555-0100" />
            </label>
          </div>
          <p className="mt-4 text-xs text-ink-soft/50">
            <span className="text-brand-text">*</span> Needed for a complete listing.
          </p>
        </SectionCard>

        <SectionCard
          icon="share"
          title="Social Media Handles"
          subtitle="Couples love to check out your real weddings and behind-the-scenes. Use your @handle or a profile link."
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SOCIAL_PLATFORMS.map((p) => (
              <label key={p.key} className="block">
                <span className="text-xs font-medium text-ink-soft">{p.label}</span>
                <input
                  name={`social_${p.key}`}
                  defaultValue={profile.social_links?.[p.key] ?? ""}
                  disabled={pending}
                  placeholder={p.placeholder}
                  autoComplete="off"
                  className={INPUT}
                />
              </label>
            ))}
          </div>
        </SectionCard>
      </div>

      <div data-panel="pricing" hidden={tab !== "pricing"} className="space-y-6">
        <ProfileExtrasEditor key={extrasKey} initial={profile} disabled={pending} onDirtyChange={setExtrasDirty} />
      </div>

      {/* Sticky save bar: only while there is something to save. */}
      {(dirty || pending) && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-2 bg-white/95 shadow-[0_-12px_30px_-18px_rgba(34,34,34,0.35)] backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3">
            <div className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-amber" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-ink">
                  {pending ? "Saving your changes…" : "You have unsaved changes"}
                </p>
                <p className="text-xs text-ink-soft/60">
                  Changes to your profile, pricing and packages are saved together.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={discard}
                disabled={pending}
                className="rounded-full px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink disabled:opacity-50"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-full bg-brand-text px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#a84503] disabled:opacity-70"
              >
                <Icon name="save" className="h-4 w-4" />
                {pending ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
