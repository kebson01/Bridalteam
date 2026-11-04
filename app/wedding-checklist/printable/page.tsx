import Link from "next/link";
import JsonLd from "@/components/json-ld";
import PrintButton from "@/components/print-button";
import { breadcrumbSchema } from "@/lib/structured-data";
import { pageMetadata, SITE_URL } from "@/lib/site";
import { CHECKLIST_PDF_PATH as PDF_PATH, checklistFingerprint, datedChecklist } from "@/lib/checklist";
import { TEMPLATE_TASK_COUNT } from "@/lib/plan-template";

/**
 * Printable wedding checklist: the same PLAN_TEMPLATE as /wedding-checklist,
 * without dates, laid out to print on paper.
 *
 * It is also the source of the downloadable PDF,
 * public/downloads/bridal-team-wedding-checklist.pdf, made from this page by
 * scripts/checklist-pdf.mjs. lib/checklist-pdf.test.ts fails when the
 * template changes and the PDF wasn't regenerated.
 */

export const metadata = pageMetadata({
  path: "/wedding-checklist/printable",
  title: "Printable Wedding Checklist (Free PDF)",
  ogTitle: "Free Printable Wedding Checklist, Month by Month — Bridal Team",
  description: `A free printable wedding planning checklist: ${TEMPLATE_TASK_COUNT} tasks grouped month by month, from just engaged to thank-you notes. Print it or download the PDF.`,
});

export default function PrintableChecklistPage() {
  const phases = datedChecklist("", "");
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Wedding Checklist", path: "/wedding-checklist" },
          { name: "Printable", path: "/wedding-checklist/printable" },
        ])}
      />
      <section
        data-checklist-fingerprint={checklistFingerprint()}
        className="mx-auto max-w-3xl px-5 pb-16 pt-10 print:max-w-none print:p-0"
      >
        <header className="text-center print:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text">Bridal Team · Free printable</p>
          <h1 className="mt-2 text-4xl font-medium leading-tight text-ink print:text-3xl">Wedding planning checklist</h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft/80 print:mx-0 print:mt-1 print:text-sm">
            {TEMPLATE_TASK_COUNT} tasks, month by month, from just engaged to thank-you notes. Tick each one as you go.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row print:hidden">
            <a
              href={PDF_PATH}
              download
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-3 text-sm font-semibold text-white"
            >
              Download the PDF
            </a>
            <PrintButton />
            <Link
              href="/wedding-checklist"
              className="inline-flex items-center justify-center rounded-full border border-stone-2 bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-brand"
            >
              Add due dates for my date
            </Link>
          </div>
        </header>

        <div className="mt-10 space-y-8 print:mt-5 print:space-y-4">
          {phases.map((p) => (
            <section key={p.name} className="break-inside-avoid">
              <h2 className="border-b-2 border-brand/60 pb-1.5 text-lg font-semibold text-ink print:text-base">{p.name}</h2>
              <ul className="mt-3 space-y-2 print:mt-2 print:space-y-1">
                {p.tasks.map((t) => (
                  <li key={t.title} className="flex gap-3 text-[15px] leading-snug text-ink print:text-[12px]">
                    <span aria-hidden className="mt-0.5 h-4 w-4 flex-none rounded-[3px] border-2 border-ink/50 print:h-3 print:w-3" />
                    <span>{t.title}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-ink-soft/60 print:mt-6 print:text-left">
          Get this checklist with due dates for your wedding, free, at {SITE_URL.replace("https://", "")}/wedding-checklist
        </p>
        <p className="mt-6 text-center text-sm text-ink-soft/80 print:hidden">
          Want the why behind each step? Read{" "}
          <Link href="/guides/wedding-planning-checklist" className="font-semibold text-brand-text hover:text-brand-deep">
            the complete wedding planning checklist
          </Link>
          .
        </p>
      </section>
    </>
  );
}
