"use client";

const DEFAULT_CLASS = "rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-deep";

/** Opens the browser's print dialog, where "Save as PDF" is one of the printers. */
export default function PrintButton({
  label = "Print or save as PDF",
  className = DEFAULT_CLASS,
}: {
  label?: string;
  /** Replaces the default styling, e.g. to match the buttons beside it. */
  className?: string;
}) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      {label}
    </button>
  );
}
