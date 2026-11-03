"use client";

import { useState } from "react";
import {
  HIGHLIGHT_ICONS,
  LIMITS,
  PRICE_TIERS,
  type Faq,
  type Highlight,
  type HighlightIcon,
  type VendorPackage,
} from "@/lib/vendor-extras";

/**
 * The optional profile sections (price range, highlights, packages, FAQs),
 * edited inside the profile form. Lists are kept in state and submitted as
 * JSON in hidden inputs; app/vendor/actions.ts checks them with
 * lib/vendor-extras.ts. Blank rows are dropped on save.
 */

const INPUT =
  "mt-1 w-full rounded-lg border border-stone-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand disabled:opacity-60";
const LABEL = "text-xs font-medium text-ink-soft";
const ADD =
  "mt-3 inline-flex items-center gap-1.5 rounded-full border border-dashed border-stone-5 px-4 py-2 text-sm font-medium text-ink-soft hover:border-brand hover:text-brand-text disabled:opacity-50";
const REMOVE = "text-xs font-medium text-ink-soft/60 hover:text-red-700";

type PackageDraft = Omit<VendorPackage, "price" | "includes"> & { price: string; includes: string };

export interface ProfileExtras {
  price_tier?: number | null;
  highlights?: Highlight[] | null;
  packages?: VendorPackage[] | null;
  faqs?: Faq[] | null;
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <fieldset className="mt-8 border-t border-stone-2 pt-6">
      <legend className="sr-only">{title}</legend>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-0.5 text-xs text-ink-soft/60">{hint}</p>
      <div className="mt-3">{children}</div>
    </fieldset>
  );
}

export default function ProfileExtrasEditor({ initial, disabled }: { initial: ProfileExtras; disabled?: boolean }) {
  const [tier, setTier] = useState<string>(initial.price_tier ? String(initial.price_tier) : "");
  const [highlights, setHighlights] = useState<Highlight[]>(initial.highlights ?? []);
  const [packages, setPackages] = useState<PackageDraft[]>(
    (initial.packages ?? []).map((p) => ({
      ...p,
      price: p.price === null ? "" : String(p.price),
      includes: p.includes.join("\n"),
    })),
  );
  const [faqs, setFaqs] = useState<Faq[]>(initial.faqs ?? []);

  const setAt = <T,>(set: React.Dispatch<React.SetStateAction<T[]>>, i: number, patch: Partial<T>) =>
    set((list) => list.map((item, j) => (j === i ? { ...item, ...patch } : item)));
  const removeAt = <T,>(set: React.Dispatch<React.SetStateAction<T[]>>, i: number) =>
    set((list) => list.filter((_, j) => j !== i));

  return (
    <>
      <input type="hidden" name="price_tier" value={tier} />
      <input type="hidden" name="highlights" value={JSON.stringify(highlights)} />
      <input type="hidden" name="packages" value={JSON.stringify(packages)} />
      <input type="hidden" name="faqs" value={JSON.stringify(faqs)} />

      <Section title="Price range" hint="Shown next to your category, so couples know what to expect.">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Price range">
          {[{ value: 0, label: "Not shown", hint: "" }, ...PRICE_TIERS].map((t) => {
            const v = t.value ? String(t.value) : "";
            const on = tier === v;
            return (
              <button
                key={t.label}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={disabled}
                onClick={() => setTier(v)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  on ? "border-brand bg-brand-wash font-semibold text-ink" : "border-stone-2 text-ink-soft hover:border-brand"
                }`}
              >
                {t.label}
                {t.hint && <span className="ml-1.5 text-xs text-ink-soft/60">{t.hint}</span>}
              </button>
            );
          })}
        </div>
      </Section>

      <Section
        title="Highlights"
        hint={`Up to ${LIMITS.highlights} quick facts that set you apart, like "Bilingual · English & Spanish" or "Setup & strike included".`}
      >
        <div className="space-y-3">
          {highlights.map((h, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-stone-2 p-3 sm:grid-cols-[9rem_1fr_1fr_auto] sm:items-end">
              <label className="block">
                <span className={LABEL}>Icon</span>
                <select
                  value={h.icon}
                  disabled={disabled}
                  onChange={(e) => setAt(setHighlights, i, { icon: e.target.value as HighlightIcon })}
                  className={INPUT}
                >
                  {Object.entries(HIGHLIGHT_ICONS).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={LABEL}>Title</span>
                <input value={h.title} maxLength={LIMITS.highlightTitle} disabled={disabled} placeholder="Bilingual"
                  onChange={(e) => setAt(setHighlights, i, { title: e.target.value })} className={INPUT} />
              </label>
              <label className="block">
                <span className={LABEL}>Detail (optional)</span>
                <input value={h.detail ?? ""} maxLength={LIMITS.highlightDetail} disabled={disabled} placeholder="English & Spanish"
                  onChange={(e) => setAt(setHighlights, i, { detail: e.target.value })} className={INPUT} />
              </label>
              <button type="button" disabled={disabled} onClick={() => removeAt(setHighlights, i)} className={`${REMOVE} pb-3`}>
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className={ADD}
          disabled={disabled || highlights.length >= LIMITS.highlights}
          onClick={() => setHighlights((l) => [...l, { icon: "star", title: "", detail: null }])}
        >
          + Add a highlight
        </button>
      </Section>

      <Section
        title="Packages"
        hint={`Up to ${LIMITS.packages}. A starting price helps couples shortlist you; leave it blank to show "Ask for a quote".`}
      >
        <div className="space-y-4">
          {packages.map((p, i) => (
            <div key={i} className="rounded-xl border border-stone-2 p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
                <label className="block">
                  <span className={LABEL}>Package name</span>
                  <input value={p.name} maxLength={LIMITS.packageName} disabled={disabled} placeholder="Full-Service Floral Design"
                    onChange={(e) => setAt(setPackages, i, { name: e.target.value })} className={INPUT} />
                </label>
                <label className="block">
                  <span className={LABEL}>Starting price (USD)</span>
                  <input value={p.price} inputMode="numeric" disabled={disabled} placeholder="5200"
                    onChange={(e) => setAt(setPackages, i, { price: e.target.value })} className={INPUT} />
                </label>
              </div>
              <label className="mt-3 block">
                <span className={LABEL}>Description (optional)</span>
                <textarea value={p.description ?? ""} maxLength={LIMITS.packageDescription} rows={2} disabled={disabled}
                  onChange={(e) => setAt(setPackages, i, { description: e.target.value })} className={`${INPUT} resize-y`} />
              </label>
              <label className="mt-3 block">
                <span className={LABEL}>What&apos;s included, one per line</span>
                <textarea value={p.includes} rows={3} disabled={disabled}
                  placeholder={"Custom ceremony arch\nBridal bouquet and 5 bridesmaids\nSetup and strike"}
                  onChange={(e) => setAt(setPackages, i, { includes: e.target.value })} className={`${INPUT} resize-y`} />
              </label>
              <div className="mt-3 flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-ink-soft">
                  <input
                    type="checkbox"
                    checked={p.featured}
                    disabled={disabled}
                    onChange={(e) =>
                      setPackages((list) =>
                        list.map((item, j) => ({ ...item, featured: j === i ? e.target.checked : false })),
                      )
                    }
                    className="h-4 w-4 accent-[var(--color-brand)]"
                  />
                  Mark as &ldquo;Most requested&rdquo;
                </label>
                <button type="button" disabled={disabled} onClick={() => removeAt(setPackages, i)} className={REMOVE}>
                  Remove package
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className={ADD}
          disabled={disabled || packages.length >= LIMITS.packages}
          onClick={() =>
            setPackages((l) => [...l, { name: "", price: "", description: null, includes: "", featured: false }])
          }
        >
          + Add a package
        </button>
      </Section>

      <Section title="FAQs" hint={`Up to ${LIMITS.faqs}. Answer what couples ask you most, like how far ahead to book.`}>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="rounded-xl border border-stone-2 p-3">
              <label className="block">
                <span className={LABEL}>Question</span>
                <input value={f.q} maxLength={LIMITS.faqQuestion} disabled={disabled} placeholder="How far in advance should we book?"
                  onChange={(e) => setAt(setFaqs, i, { q: e.target.value })} className={INPUT} />
              </label>
              <label className="mt-2 block">
                <span className={LABEL}>Answer</span>
                <textarea value={f.a} maxLength={LIMITS.faqAnswer} rows={2} disabled={disabled}
                  onChange={(e) => setAt(setFaqs, i, { a: e.target.value })} className={`${INPUT} resize-y`} />
              </label>
              <div className="mt-2 text-right">
                <button type="button" disabled={disabled} onClick={() => removeAt(setFaqs, i)} className={REMOVE}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className={ADD}
          disabled={disabled || faqs.length >= LIMITS.faqs}
          onClick={() => setFaqs((l) => [...l, { q: "", a: "" }])}
        >
          + Add a question
        </button>
      </Section>
    </>
  );
}
