"use client";

/** Opens the browser's print dialog, where "Save as PDF" is one of the printers. */
export default function PrintButton({ label = "Print or save as PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-deep"
    >
      {label}
    </button>
  );
}
