import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { enabledTools, WEDDING_TOOLS } from "@/lib/wedding-tools";

type NavKey = "overview" | "details" | "builder" | (typeof WEDDING_TOOLS)[number]["key"];

/**
 * Sub-navigation across a wedding's sections. Shows the overview, the tools
 * the couple has switched on (see lib/wedding-tools.ts), a shortcut to the tool
 * marketplace, and details. `active` highlights the current one.
 *
 * Pages that already loaded `enabled_tools` pass it in; otherwise this reads it.
 */
export default async function WeddingNav({
  weddingId,
  active,
  enabled,
}: {
  weddingId: string;
  active: NavKey;
  enabled?: string[] | null;
}) {
  let stored = enabled;
  if (stored === undefined) {
    const supabase = await supabaseServer();
    const { data } = await supabase
      .from("weddings")
      .select("enabled_tools")
      .eq("id", weddingId)
      .maybeSingle();
    stored = (data?.enabled_tools as string[] | null) ?? null;
  }

  // A tool that's switched off still gets a pill while you're on its page, so
  // following an old link never leaves you somewhere the nav doesn't know about.
  const tools = enabledTools(stored);
  const activeTool = WEDDING_TOOLS.find((t) => t.key === (active === "builder" ? "website" : active));
  if (activeTool && !tools.includes(activeTool)) tools.push(activeTool);

  const items: { key: string; label: string; href: string }[] = [
    { key: "overview", label: "Overview", href: `/w/${weddingId}` },
    ...tools.flatMap((t) => {
      const pill = { key: t.key, label: t.nav, href: t.path(weddingId) };
      // The Website builder is part of the website tool, not a tool of its own:
      // it gets its own pill wherever the website does.
      return t.key === "website"
        ? [pill, { key: "builder", label: "Website builder", href: `/w/${weddingId}/builder` }]
        : [pill];
    }),
    // Last: details are set at onboarding and edited rarely, so this sits at the
    // end rather than competing with the day-to-day sections.
    { key: "details", label: "Details", href: `/w/${weddingId}/details` },
  ];

  return (
    // Wraps on narrow screens — a full set of pills doesn't fit one mobile row.
    <nav className="mt-4 flex flex-wrap gap-1">
      {items.map((it) => (
        <Link
          key={it.key}
          href={it.href}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            it.key === active
              ? "bg-brand text-white"
              : "text-ink-soft hover:bg-stone-4 hover:text-brand-text"
          }`}
        >
          {it.label}
        </Link>
      ))}
      <Link
        href={`/w/${weddingId}#tools`}
        className="rounded-full border border-dashed border-stone-5 px-3.5 py-1.5 text-sm font-medium text-ink-soft/70 transition-colors hover:border-brand hover:text-brand-text"
      >
        + Add tools
      </Link>
    </nav>
  );
}
