import type { ReactNode } from "react";

/**
 * Shared typography for the Terms and Privacy pages.
 *
 * Both documents are long-form prose rather than marketing copy, so they get a
 * narrower measure, numbered section headings, and a consistent link colour —
 * kept in one place so the two pages can't drift apart visually.
 *
 * Note the link/emphasis colour is `brand-text`, not `brand-dark`: at body-copy
 * size the lighter orange doesn't clear the WCAG AA contrast minimum on white.
 */

export function LegalBody({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 text-ink-soft/85">
      <div className="space-y-10 leading-relaxed">{children}</div>
    </section>
  );
}

export function LastUpdated({ date }: { date: string }) {
  return <p className="text-sm text-ink-soft/60">Last updated: {date}</p>;
}

/** An unnumbered lead-in paragraph block, before section 1. */
export function Preamble({ children }: { children: ReactNode }) {
  return <div className="space-y-4 text-[15.5px]">{children}</div>;
}

export function Section({
  n,
  title,
  children,
}: {
  n?: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h2 className="text-lg font-medium text-ink">
        {n !== undefined && (
          <span className="mr-2 text-ink-soft/50 tabular-nums">{n}.</span>
        )}
        {title}
      </h2>
      <div className="mt-3 space-y-4 text-[15.5px]">{children}</div>
    </div>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

/** Bolded lead-in for a paragraph, e.g. "Automatic renewal." */
export function Lead({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-ink">{children}</strong>;
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="ml-1 space-y-2">{children}</ul>;
}

export function Item({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span aria-hidden="true" className="mt-[0.55em] h-1 w-1 flex-none rounded-full bg-brand" />
      <span>{children}</span>
    </li>
  );
}

export function MailLink({ address }: { address: string }) {
  return (
    <a href={`mailto:${address}`} className="font-semibold text-brand-text underline-offset-2 hover:underline">
      {address}
    </a>
  );
}

/**
 * A callout for the passages a reader genuinely needs to see — the automatic
 * renewal terms and the no-refunds stance. Both are disclosures that consumer
 * protection rules expect to be conspicuous rather than buried in the run of text.
 */
export function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-brand/30 bg-brand/[0.06] px-4 py-3 text-[15px]">
      {children}
    </div>
  );
}

/** All-caps legal blocks (disclaimers, liability limits). */
export function Allcaps({ children }: { children: ReactNode }) {
  return (
    <p className="text-[13.5px] uppercase leading-relaxed tracking-[0.01em] text-ink-soft/70">
      {children}
    </p>
  );
}

export function SubprocessorTable({
  rows,
}: {
  rows: { provider: string; purpose: string; data: string }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left text-[14.5px]">
        <thead>
          <tr className="border-b border-stone-2">
            <th scope="col" className="py-2 pr-4 font-medium text-ink">Provider</th>
            <th scope="col" className="py-2 pr-4 font-medium text-ink">Purpose</th>
            <th scope="col" className="py-2 font-medium text-ink">Data involved</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.provider} className="border-b border-stone-2/60">
              <td className="py-2.5 pr-4 font-medium text-ink-soft">{r.provider}</td>
              <td className="py-2.5 pr-4">{r.purpose}</td>
              <td className="py-2.5">{r.data}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
