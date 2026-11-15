/**
 * Small building blocks shared by the vendor workspace (/vendor): a line-icon
 * set and the white section card with an icon-tile header.
 */

const PATHS = {
  briefcase: "M4 8h16v11H4zM9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M4 13h16",
  pin: "M12 21s-6-5.6-6-11a6 6 0 1 1 12 0c0 5.4-6 11-6 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  share: "M18 8a3 3 0 1 0-2.8-4M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z",
  save: "M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6",
  chevron: "M6 9l6 6 6-6",
  arrow: "M5 12h14M13 6l6 6-6 6",
  external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  rocket: "M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M14 4c3.5-1 6-1 6-1s0 2.5-1 6l-7 7-5-5 7-7zM9 11l-3-1-2 2 4 1M13 15l1 3-2 2-1-4M15.5 9.5a1 1 0 1 0 0-.01",
  store: "M4 9l1.5-5h13L20 9M4 9h16M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9M5 11v9h14v-9M10 20v-5h4v5",
  tag: "M3 12V4h8l9 9-8 8zM7.5 8.5a1 1 0 1 0 0-.01",
  image: "M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15.5 9.5a1 1 0 1 0 0-.01",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  badge: "M12 3l2.4 1.7 3-.1.9 2.8 2.4 1.8-1 2.8 1 2.8-2.4 1.8-.9 2.8-3-.1L12 21l-2.4-1.7-3 .1-.9-2.8L3.3 14.8l1-2.8-1-2.8 2.4-1.8.9-2.8 3 .1zM8.5 12l2.5 2.5 4.5-5",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  check: "M5 12.5l4.5 4.5L19 7.5",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  question: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/** The cream tile holding a section icon. */
export function IconTile({ name }: { name: IconName }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-wash text-brand-text">
      <Icon name={name} className="h-[18px] w-[18px]" />
    </span>
  );
}

export function SectionCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-stone-2 bg-white p-6 shadow-[0_1px_2px_rgba(34,34,34,0.04)] sm:p-7">
      <header className="flex items-start gap-3 border-b border-stone-2 pb-5">
        <IconTile name={icon} />
        <div className="pt-1">
          <h3 className="text-base font-medium text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-ink-soft/60">{subtitle}</p>}
        </div>
      </header>
      <div className="pt-5">{children}</div>
    </section>
  );
}
