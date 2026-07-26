import Link from "next/link";

/**
 * Sub-navigation across a wedding's sections. `active` highlights the current
 * one. Server component — just links.
 */
export default function WeddingNav({
  weddingId,
  active,
}: {
  weddingId: string;
  active: "plan" | "budget" | "vendors" | "travel" | "team" | "ideas" | "website";
}) {
  const items = [
    { key: "plan", label: "Checklist", href: `/w/${weddingId}` },
    { key: "budget", label: "Budget", href: `/w/${weddingId}/budget` },
    { key: "vendors", label: "Vendors", href: `/w/${weddingId}/vendors` },
    { key: "ideas", label: "Ideas", href: `/w/${weddingId}/ideas` },
    { key: "travel", label: "Travel", href: `/w/${weddingId}/travel` },
    { key: "team", label: "Team", href: `/w/${weddingId}/team` },
    { key: "website", label: "Website", href: `/w/${weddingId}/website` },
  ] as const;

  return (
    <nav className="mt-4 flex gap-1">
      {items.map((it) => (
        <Link
          key={it.key}
          href={it.href}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            it.key === active
              ? "bg-brand text-white"
              : "text-ink-soft hover:bg-stone-4 hover:text-brand-dark"
          }`}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
