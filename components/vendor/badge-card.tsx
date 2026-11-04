"use client";

import { useState } from "react";
import { BADGE_HEIGHT, BADGE_IMAGES, BADGE_WIDTH, badgeHtml, vendorProfileUrl, type BadgeStyle } from "@/lib/vendor-badge";

/**
 * "Add a badge to your website": a preview of the Find us on Bridal Team
 * badge and the code to paste, in the vendor's account.
 */
export default function VendorBadgeCard({
  orgId,
  businessName,
  published,
}: {
  orgId: string;
  businessName: string;
  published: boolean;
}) {
  const [style, setStyle] = useState<BadgeStyle>("light");
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const code = badgeHtml(orgId, businessName, style);
  const link = vendorProfileUrl(orgId);

  async function copy(what: "code" | "link") {
    try {
      await navigator.clipboard.writeText(what === "code" ? code : link);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard blocked: the code is selectable, so it can still be copied by hand.
    }
  }

  return (
    <section aria-labelledby="badge-heading" className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
      <h2 id="badge-heading" className="text-lg font-medium text-ink">Add a badge to your website</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft/80">
        Show couples where to find your reviews and packages. The badge links to your Bridal Team profile, and every
        site that links to your profile helps it show up higher in search.
      </p>

      {!published && (
        <p className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Publish your listing first, so the badge links to a live page.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Badge style">
        {(["light", "dark"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={style === s}
            onClick={() => setStyle(s)}
            className={`rounded-full border px-4 py-1.5 text-sm capitalize ${
              style === s ? "border-ink bg-ink text-white" : "border-stone-2 text-ink-soft hover:border-brand"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className={`mt-4 flex items-center justify-center rounded-xl p-6 ${style === "dark" ? "bg-stone-4" : "bg-stone-4"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BADGE_IMAGES[style]} alt="Find us on Bridal Team" width={BADGE_WIDTH} height={BADGE_HEIGHT} />
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft/60">
          Paste this into your website&apos;s HTML
        </span>
        <textarea
          readOnly
          value={code}
          rows={4}
          onFocus={(e) => e.currentTarget.select()}
          className="mt-1.5 w-full resize-none rounded-lg border border-stone-2 bg-stone-4 px-3 py-2 font-mono text-xs text-ink"
        />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copy("code")}
          className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-semibold text-white"
        >
          {copied === "code" ? "Copied" : "Copy badge code"}
        </button>
        <button
          type="button"
          onClick={() => copy("link")}
          className="rounded-full border border-stone-2 px-5 py-2.5 text-sm font-semibold text-ink hover:border-brand"
        >
          {copied === "link" ? "Copied" : "Copy profile link"}
        </button>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink-soft/60">
        Using Wix, Squarespace or WordPress? Add an &ldquo;HTML&rdquo; or &ldquo;Embed code&rdquo; block and paste the
        code. Or link to your profile from your website, Instagram bio or email signature: {link}
      </p>
    </section>
  );
}
