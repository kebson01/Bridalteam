/**
 * The admin area's shared look. Every /admin page builds from these so the
 * eight sections read as one app: the same header, cards, buttons, badges,
 * fields and tables, in the site's own palette (orange brand, ink, stone) and
 * fonts. Icons are small inline strokes, so nothing loads an icon font.
 *
 * Server-safe: no hooks, no "use client". Interactive pieces live in the pages.
 */

import type { ReactNode } from "react";

// ── Icons ───────────────────────────────────────────────────────────────────

const PATHS = {
  home: "M4 11 12 4l8 7M6 10v10h12V10M10 20v-5h4v5",
  store: "M3 9.5 4.5 4h15L21 9.5M3 9.5h18M3 9.5a2.5 2.5 0 0 0 4.5 1.5 2.5 2.5 0 0 0 4.5 0 2.5 2.5 0 0 0 4.5 0A2.5 2.5 0 0 0 21 9.5M5 12v8h14v-8M10 20v-5h4v5",
  badge: "m12 3 2.4 1.7 2.9-.1.9 2.8 2.3 1.8-1 2.8 1 2.8-2.3 1.8-.9 2.8-2.9-.1L12 21l-2.4-1.7-2.9.1-.9-2.8-2.3-1.8 1-2.8-1-2.8 2.3-1.8.9-2.8 2.9.1L12 3Zm-3 9 2 2 4-4",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z",
  send: "M21 3 10 14M21 3l-7 18-4-7-7-4 18-7Z",
  check: "M9 12l2 2 4-4M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z",
  flag: "M5 21V4m0 0h11l-2 4 2 4H5",
  download: "M12 4v11m0 0-4-4m4 4 4-4M5 19h14",
  upload: "M12 20V9m0 0-4 4m4-4 4 4M5 5h14",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z",
  search: "m20 20-4.5-4.5M11 17a6 6 0 1 1 0-12 6 6 0 0 1 0 12Z",
  chevron: "m6 9 6 6 6-6",
  left: "m15 6-6 6 6 6",
  right: "m9 6 6 6-6 6",
  plus: "M12 5v14M5 12h14",
  close: "M6 6l12 12M18 6 6 18",
  menu: "M4 7h16M4 12h16M4 17h16",
  inbox: "M4 13h4l2 3h4l2-3h4M5 5h14l1 8v6H4v-6l1-8Z",
  key: "M15 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-1.5 2.5L20 18l-2 2-1.5-1.5L15 20l-2-2 1.5-1.5-3-3",
  tag: "M3 12V4h8l10 10-8 8L3 12Zm5-4h.01",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",
  sites: "M4 5h16v14H4zM4 9h16M8 7h.01",
  building: "M4 21V5l8-2v18M12 21V9l8 2v10M7 8h2M7 12h2M7 16h2M15 13h2M15 17h2M2 21h20",
  chart: "M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3",
  external: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  copy: "M8 8h11v12H8zM5 16V4h11",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={PATHS[name]} />
    </svg>
  );
}

// ── Layout pieces ───────────────────────────────────────────────────────────

/** Top of every admin page: eyebrow, title, one-line purpose, and the page's main actions. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-text">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-soft/70">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

/** The white rounded panel everything sits in. */
export function Card({ children, className = "", tone }: { children: ReactNode; className?: string; tone?: "brand" | "danger" }) {
  const border = tone === "brand" ? "border-brand/30" : tone === "danger" ? "border-red-200" : "border-stone-2";
  return <section className={`rounded-3xl border ${border} bg-white p-4 shadow-card sm:p-6 ${className}`}>{children}</section>;
}

/** Small uppercase heading inside a card. */
export function CardTitle({ children, count, tone }: { children: ReactNode; count?: number; tone?: "danger" }) {
  return (
    <h2 className={`text-xs font-semibold uppercase tracking-wider ${tone === "danger" ? "text-red-600" : "text-ink-soft/60"}`}>
      {children}
      {count !== undefined && <span className="ml-1 font-normal">({count.toLocaleString("en-US")})</span>}
    </h2>
  );
}

/** A key number with its label and a one-line context. */
export function Kpi({
  label,
  value,
  sub,
  icon,
  good,
  className = "",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: IconName;
  good?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col justify-between rounded-2xl border border-stone-2 bg-white p-4 shadow-card sm:p-5 ${className}`}>
      <div className="flex items-center justify-between gap-2 text-ink-soft/70">
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
        <Icon name={icon} className="size-5 flex-none text-brand-text" />
      </div>
      <div className="mt-4">
        <div className="font-display text-2xl font-medium text-ink sm:text-3xl">{value}</div>
        {sub && <p className={`mt-1 text-xs ${good ? "font-medium text-green-700" : "text-ink-soft/65"}`}>{sub}</p>}
      </div>
    </div>
  );
}

/** Nothing to show yet. */
export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-stone-2 px-4 py-10 text-center text-sm text-ink-soft/55">{children}</p>;
}

/** An inline message: error, success, or a neutral note. */
export function Notice({ tone = "info", children }: { tone?: "error" | "success" | "info" | "warning"; children: ReactNode }) {
  const cls = {
    error: "bg-red-50 text-red-700",
    success: "bg-green-50 text-green-800",
    warning: "bg-amber-50 text-amber-900",
    info: "bg-brand-wash text-ink-soft",
  }[tone];
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${cls}`}>
      {children}
    </p>
  );
}

// ── Buttons ─────────────────────────────────────────────────────────────────

const BTN_BASE = "inline-flex items-center justify-center gap-2 rounded-full text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50";

/** Class names for buttons and button-styled links. */
export const btn = {
  /** The page's main action: orange gradient. */
  primary: `${BTN_BASE} bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 font-semibold text-white hover:shadow-glow`,
  /** Secondary actions: white with a border. */
  secondary: `${BTN_BASE} border border-stone-2 bg-white px-4 py-2.5 font-medium text-ink hover:border-brand`,
  /** Small outlined action inside a row ("Publish"). */
  small: `${BTN_BASE} border border-brand/30 px-3 py-1 text-xs font-semibold text-brand-text hover:bg-brand-wash`,
  /** Quiet text action inside a row ("Unpublish", "Dismiss"). */
  quiet: `${BTN_BASE} px-3 py-1 text-xs text-ink-soft/70 hover:text-ink`,
  /** Destructive action. */
  danger: `${BTN_BASE} bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700`,
  /** Quiet destructive text action inside a row ("Delete"). */
  dangerQuiet: `${BTN_BASE} px-3 py-1 text-xs text-ink-soft/60 hover:text-red-600`,
};

// ── Badges ──────────────────────────────────────────────────────────────────

export type BadgeTone = "green" | "grey" | "brand" | "brandSolid" | "amber" | "red" | "blue";

const BADGE: Record<BadgeTone, { box: string; dot: string }> = {
  green: { box: "bg-green-50 text-green-800", dot: "bg-green-600" },
  grey: { box: "bg-stone-4 text-ink-soft/70", dot: "bg-stone-3" },
  brand: { box: "border border-brand/25 bg-brand-wash text-brand-text", dot: "bg-brand" },
  brandSolid: { box: "bg-brand text-white", dot: "bg-white" },
  amber: { box: "bg-amber-50 text-amber-900", dot: "bg-amber-500" },
  red: { box: "bg-red-50 text-red-700", dot: "bg-red-500" },
  blue: { box: "bg-sky-50 text-sky-800", dot: "bg-sky-500" },
};

/** A status pill. `dot` adds the small leading dot used for states (Published, Draft). */
export function Badge({ tone = "grey", dot, children }: { tone?: BadgeTone; dot?: boolean; children: ReactNode }) {
  const t = BADGE[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${t.box}`}>
      {dot && <span className={`size-1.5 rounded-full ${t.dot}`} />}
      {children}
    </span>
  );
}

// ── Fields ──────────────────────────────────────────────────────────────────

/** Text inputs, textareas and selects in forms. */
export const field = "w-full rounded-xl border border-stone-2 bg-stone-4/60 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand disabled:opacity-60";
/** Compact pill inputs in filter bars. */
export const pillField = "w-full rounded-full bg-stone-4 px-4 py-2.5 text-xs text-ink outline-none focus:ring-1 focus:ring-brand";

/** A labelled form field. The hint sits after the label, separated by a space for screen readers. */
export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold text-ink-soft">
        {label}
        {hint && <span className="ml-1 text-[11px] font-normal text-ink-soft/50"> {hint}</span>}
      </span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

/** A filter-bar search box. */
export function SearchBox(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft/60" />
      <input type="search" {...props} className={`${pillField} pl-10 placeholder:text-ink-soft/60 ${props.className ?? ""}`} />
    </div>
  );
}

/** A filter-bar select with the chevron drawn in. */
export function PillSelect({ className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={`relative ${className}`}>
      <select {...props} className={`${pillField} cursor-pointer appearance-none pr-9`}>
        {children}
      </select>
      <Icon name="chevron" className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft/60" />
    </div>
  );
}

// ── Tables ──────────────────────────────────────────────────────────────────

/** Class names for admin tables. Wrap the <table> in `table.wrap` so it scrolls inside its card on phones. */
export const table = {
  wrap: "-mx-4 overflow-x-auto sm:mx-0",
  table: "w-full min-w-[720px] border-collapse text-left",
  headRow: "border-b border-stone-2 text-xs uppercase tracking-wider text-ink-soft/60",
  th: "px-4 py-3.5 font-medium",
  body: "divide-y divide-stone-2/70 text-sm text-ink",
  row: "transition-colors hover:bg-stone-4/70",
  td: "px-4 py-4 align-top",
};
