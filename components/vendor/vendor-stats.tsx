import type { VendorStats } from "@/app/vendor/stats-actions";

/** Compact stats panel for the vendor dashboard (Pro+). */
export default function VendorStats({ stats }: { stats: VendorStats }) {
  const cells = [
    { label: "Profile views · 30d", value: stats.views30 },
    { label: "Website clicks · 30d", value: stats.clicks30 },
    { label: "Views · all time", value: stats.viewsTotal },
  ];
  return (
    <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
      <h2 className="text-lg font-medium text-ink">Your stats</h2>
      <div className="mt-4 grid grid-cols-3 gap-4">
        {cells.map((c) => (
          <div key={c.label} className="rounded-xl bg-stone-1 p-4 text-center">
            <p className="text-2xl font-semibold text-ink">{c.value.toLocaleString()}</p>
            <p className="mt-1 text-xs text-ink-soft/60">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
