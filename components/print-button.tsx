"use client";

/** Opens the browser's print dialog, where "Save as PDF" is also offered. */
export default function PrintButton({ label = "Print this checklist" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center rounded-full border border-stone-2 bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-brand"
    >
      {label}
    </button>
  );
}
