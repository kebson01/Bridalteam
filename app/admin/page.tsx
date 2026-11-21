"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

interface Stats {
  vendors: number;
  vendorsPublished: number;
  vendorsClaimed: number;
  paying: number;
  mrr: number;
  granted: number;
  weddings: number;
  weddingSites: number;
  inquiries: number;
  inquiries30: number;
  newLeads: number;
  comments: number;
  inspiration: number;
  reports: number;
}
type Plan = "free" | "pro" | "featured";
interface VendorRow {
  org_id: string;
  business_name: string;
  category: string | null;
  city: string | null;
  region: string | null;
  status: string;
  email: string | null;
  plan: Plan;
  plan_source: "paid" | "comp" | "promotion";
  claimed: boolean;
  created_at: string;
}
interface CommentRow {
  id: string;
  author_name: string;
  body: string;
  image_id: string;
  created_at: string;
}
interface ReportRow {
  id: string;
  reason: string | null;
  status: string;
  created_at: string;
  image_id: string;
  inspiration_images: { title: string; image_url: string } | null;
}
interface Dashboard {
  stats: Stats;
  vendors: VendorRow[];
  comments: CommentRow[];
  reports: ReportRow[];
}

const PAGE_SIZE = 25;
const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const num = (n: number) => n.toLocaleString("en-US");
const where = (v: VendorRow) => [v.city, v.region].filter(Boolean).join(", ");

// ── Icons: small inline strokes, so the page loads no icon font ─────────────

type IconName = "store" | "badge" | "heart" | "send" | "check" | "flag" | "download" | "lock" | "search" | "chevron" | "left" | "right";
const PATHS: Record<IconName, string> = {
  store: "M3 9.5 4.5 4h15L21 9.5M3 9.5h18M3 9.5a2.5 2.5 0 0 0 4.5 1.5 2.5 2.5 0 0 0 4.5 0 2.5 2.5 0 0 0 4.5 0A2.5 2.5 0 0 0 21 9.5M5 12v8h14v-8M10 20v-5h4v5",
  badge: "m12 3 2.4 1.7 2.9-.1.9 2.8 2.3 1.8-1 2.8 1 2.8-2.3 1.8-.9 2.8-2.9-.1L12 21l-2.4-1.7-2.9.1-.9-2.8-2.3-1.8 1-2.8-1-2.8 2.3-1.8.9-2.8 2.9.1L12 3Zm-3 9 2 2 4-4",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z",
  send: "M21 3 10 14M21 3l-7 18-4-7-7-4 18-7Z",
  check: "M9 12l2 2 4-4M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z",
  flag: "M5 21V4m0 0h11l-2 4 2 4H5",
  download: "M12 4v11m0 0-4-4m4 4 4-4M5 19h14",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z",
  search: "m20 20-4.5-4.5M11 17a6 6 0 1 1 0-12 6 6 0 0 1 0 12Z",
  chevron: "m6 9 6 6 6-6",
  left: "m15 6-6 6 6 6",
  right: "m9 6 6 6-6 6",
};
function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={PATHS[name]} />
    </svg>
  );
}

// ── Small pieces ────────────────────────────────────────────────────────────

function Kpi({ label, value, sub, icon, good, className = "" }: { label: string; value: string; sub: string; icon: IconName; good?: boolean; className?: string }) {
  return (
    <div className={`flex flex-col justify-between rounded-2xl border border-stone-2 bg-white p-4 shadow-card sm:p-5 ${className}`}>
      <div className="flex items-center justify-between gap-2 text-ink-soft/70">
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
        <Icon name={icon} className="size-5 flex-none text-brand-text" />
      </div>
      <div className="mt-4">
        <div className="font-display text-2xl font-medium text-ink sm:text-3xl">{value}</div>
        <p className={`mt-1 text-xs ${good ? "font-medium text-green-700" : "text-ink-soft/65"}`}>{sub}</p>
      </div>
    </div>
  );
}

function PlanBadge({ v }: { v: VendorRow }) {
  if (v.plan === "free") return <span className="text-xs text-ink-soft/60">Free</span>;
  const label = v.plan === "featured" ? "Featured" : "Pro";
  const how = v.plan_source === "paid" ? "" : v.plan_source === "comp" ? " · granted" : " · promo";
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${
        v.plan === "featured" ? "bg-brand text-white" : "border border-brand/25 bg-brand-wash text-brand-text"
      }`}
    >
      {label}
      {how && <span className={v.plan === "featured" ? "text-white/80" : "text-ink-soft/60"}>{how}</span>}
    </span>
  );
}

function StatusBadge({ live }: { live: boolean }) {
  return live ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-800">
      <span className="size-1.5 rounded-full bg-green-600" />
      Published
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-4 px-3 py-1 text-xs font-medium text-ink-soft/70">
      <span className="size-1.5 rounded-full bg-stone-3" />
      Draft
    </span>
  );
}

const pill = "rounded-full bg-stone-4 px-4 py-2.5 text-xs text-ink outline-none focus:ring-1 focus:ring-brand";

function Select({ value, onChange, children, label }: { value: string; onChange: (v: string) => void; children: React.ReactNode; label: string }) {
  return (
    <div className="relative">
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={`${pill} w-full cursor-pointer appearance-none pr-9`}>
        {children}
      </select>
      <Icon name="chevron" className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft/60" />
    </div>
  );
}

/** Page numbers with gaps: 1 2 3 … 41 */
function pageList(current: number, total: number): (number | "gap")[] {
  const keep = new Set([1, total, current - 1, current, current + 1]);
  const out: (number | "gap")[] = [];
  for (let p = 1; p <= total; p++) {
    if (keep.has(p)) out.push(p);
    else if (out[out.length - 1] !== "gap") out.push("gap");
  }
  return out;
}

function toCsv(rows: VendorRow[]): string {
  const cell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const head = ["Business", "Email", "Category", "City", "Region", "Plan", "Plan source", "Status", "Claimed", "Added"];
  const lines = rows.map((v) =>
    [v.business_name, v.email ?? "", v.category ?? "", v.city ?? "", v.region ?? "", v.plan, v.plan_source, v.status, v.claimed ? "yes" : "no", v.created_at.slice(0, 10)]
      .map(cell)
      .join(","),
  );
  return [head.join(","), ...lines].join("\n");
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  // Fetch dashboard data using the httpOnly admin session cookie (set at login).
  // Same-origin fetches send the cookie automatically — no password in the browser.
  const loadDashboard = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/dashboard");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        // 401 on load just means "no session yet" — show the login form quietly.
        if (res.status !== 401) setError(json.error ?? "Couldn't load.");
        setUnlocked(false);
        setData(null);
        return;
      }
      setData(json);
      setUnlocked(true);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }, []);

  // Log in: the server verifies the password and sets an httpOnly cookie; we then
  // load the dashboard with that cookie and drop the password from memory.
  const login = useCallback(
    async (user: string, pw: string) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: user, password: pw }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(json.error ?? "Couldn't sign in.");
          setUnlocked(false);
          return;
        }
        setPassword("");
        await loadDashboard();
      } catch {
        setError("Couldn't reach the server.");
      } finally {
        setBusy(false);
      }
    },
    [loadDashboard],
  );

  // On mount, try any existing session cookie. Nothing is read from storage.
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function act(action: string, id: string) {
    setBusy(true);
    const res = await fetch("/api/admin/dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id }),
    });
    setBusy(false);
    if (res.ok) loadDashboard();
    else {
      const j = await res.json().catch(() => ({}));
      if (res.status === 401) setUnlocked(false); // session expired → back to login
      setError(j.error ?? "Action failed.");
    }
  }

  async function logout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Ignore — clear local state regardless.
    }
    setUnlocked(false);
    setData(null);
    setUsername("");
    setPassword("");
  }

  const vendors = data?.vendors;
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of vendors ?? []) if (v.category) counts.set(v.category, (counts.get(v.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [vendors]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (vendors ?? []).filter(
      (v) =>
        (!needle || v.business_name.toLowerCase().includes(needle) || (v.email ?? "").toLowerCase().includes(needle) || where(v).toLowerCase().includes(needle)) &&
        (!category || v.category === category) &&
        (!plan || v.plan === plan) &&
        (!status || (status === "published" ? v.status === "published" : v.status !== "published")),
    );
  }, [vendors, q, category, plan, status]);

  // Back to page 1 whenever the filters change.
  useEffect(() => setPage(1), [q, category, plan, status]);

  function exportCsv() {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bridal-team-vendors-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---- Locked view ----
  if (!unlocked || !data) {
    return (
      <section className="mx-auto max-w-md px-4 py-20 sm:px-5">
        <div className="rounded-3xl border border-stone-2 bg-white p-8 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-text">Platform administration</p>
          <h1 className="mt-1.5 font-display text-3xl font-medium text-ink">Admin sign-in</h1>
          <p className="mt-2 text-sm text-ink-soft/70">Enter the admin password to continue.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              login(username, password);
            }}
            className="mt-6 space-y-3"
          >
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              aria-label="Username"
              className="w-full rounded-full border border-stone-2 bg-stone-4 px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              aria-label="Password"
              className="w-full rounded-full border border-stone-2 bg-stone-4 px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "One moment…" : "Unlock"}
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <p className="mt-6 text-xs text-ink-soft/50">
            Set <code>ADMIN_USERNAME</code>, <code>ADMIN_PASSWORD</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code> in your
            server environment to enable admin.
          </p>
        </div>
      </section>
    );
  }

  const { stats, comments, reports } = data;
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const from = filtered.length ? (current - 1) * PAGE_SIZE + 1 : 0;
  const to = (current - 1) * PAGE_SIZE + shown.length;

  const tabs: { href: string; label: string; badge?: number }[] = [
    { href: "/admin", label: "Vendor directory" },
    { href: "/admin/analytics", label: "Analytics" },
    { href: "/admin/leads", label: "Vendor leads", badge: stats.newLeads },
    { href: "/admin/claims", label: "Claims" },
    { href: "/admin/venues", label: "Venues" },
    { href: "/admin/sites", label: "Guest websites" },
    { href: "/admin/vendor-sites", label: "Vendor websites" },
    { href: "/admin/promotions", label: "Promotions" },
  ];

  return (
    <div className="bg-stone-4/60">
      <section className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-text">
              <span>Platform administration</span>
              <span className="text-stone-5">•</span>
              <span className="normal-case tracking-normal text-ink-soft/60">directory governance</span>
            </div>
            <h1 className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">Admin dashboard</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-ink-soft/70">
              Manage vendors, directory listings, publication status and marketplace activity.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-full border border-stone-2 bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-brand"
            >
              <Icon name="download" className="size-4 text-ink-soft/60" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-semibold text-white transition-shadow hover:shadow-glow"
            >
              <Icon name="lock" className="size-4" />
              Lock
            </button>
          </div>
        </div>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {/* Key numbers */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <Kpi label="Total vendors" value={num(stats.vendors)} sub={`${num(stats.vendorsPublished)} live · ${num(stats.vendorsClaimed)} claimed`} icon="store" />
          <Kpi
            label="Paid plans"
            value={num(stats.paying)}
            sub={`$${num(stats.mrr)}/mo · ${num(stats.granted)} granted free`}
            icon="badge"
          />
          <Kpi label="Weddings" value={num(stats.weddings)} sub={`${num(stats.weddingSites)} with a live website`} icon="heart" />
          <Kpi label="Vendor inquiries" value={num(stats.inquiries)} sub={`${num(stats.inquiries30)} in the last 30 days`} icon="send" />
          <Kpi
            label="Moderation queue"
            value={num(stats.reports)}
            sub={stats.reports ? "Reports need review" : "All reports clear"}
            icon={stats.reports ? "flag" : "check"}
            good={!stats.reports}
            className="col-span-2 lg:col-span-1"
          />
        </div>

        {/* Section tabs */}
        <nav aria-label="Admin sections" className="-mx-4 flex items-center gap-2 overflow-x-auto border-b border-stone-2 px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0">
          {tabs.map((t) =>
            t.href === "/admin" ? (
              <span key={t.href} aria-current="page" className="flex-none rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white">
                {t.label}
              </span>
            ) : (
              <Link
                key={t.href}
                href={t.href}
                className="inline-flex flex-none items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-ink-soft/70 transition-colors hover:bg-white hover:text-ink"
              >
                {t.label}
                {!!t.badge && <span className="rounded-full bg-brand-wash px-1.5 py-0.5 text-[10px] text-brand-text">{t.badge}</span>}
              </Link>
            ),
          )}
        </nav>

        {/* Reported images (priority) */}
        {reports.length > 0 && (
          <div className="space-y-3 rounded-3xl border border-red-200 bg-white p-6 shadow-card">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-red-600">Reported images ({reports.length})</h2>
            {reports.map((r) => (
              <div key={r.id} className="flex flex-wrap items-start gap-4 rounded-2xl border border-red-100 bg-red-50/40 p-4">
                {r.inspiration_images?.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.inspiration_images.image_url} alt="" className="size-16 flex-none rounded-xl object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{r.inspiration_images?.title ?? "(image removed)"}</p>
                  <p className="text-sm text-ink-soft/80">{r.reason ? `“${r.reason}”` : "No reason given"}</p>
                  <p className="mt-0.5 text-xs text-ink-soft/50">{fmt(r.created_at)}</p>
                </div>
                <div className="flex flex-none items-center gap-3">
                  <button onClick={() => act("dismiss_report", r.id)} disabled={busy} className="text-xs font-semibold text-ink-soft/60 hover:text-ink">
                    Dismiss
                  </button>
                  <button
                    onClick={() => act("delete_reported_image", r.image_id)}
                    disabled={busy}
                    className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Remove image
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vendor directory */}
        <div className="space-y-6 rounded-3xl border border-stone-2 bg-white p-4 shadow-card sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Icon name="search" className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft/60" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search vendors"
                placeholder="Search name, email or city…"
                className={`${pill} w-full pl-10 placeholder:text-ink-soft/60`}
              />
            </div>
            <Select label="Category" value={category} onChange={setCategory}>
              <option value="">All categories</option>
              {categories.map(([c, n]) => (
                <option key={c} value={c}>
                  {c} ({n})
                </option>
              ))}
            </Select>
            <Select label="Plan" value={plan} onChange={setPlan}>
              <option value="">All plans</option>
              <option value="featured">Featured</option>
              <option value="pro">Pro</option>
              <option value="free">Free</option>
            </Select>
            <Select label="Status" value={status} onChange={setStatus}>
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </Select>
          </div>

          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-stone-2 text-xs uppercase tracking-wider text-ink-soft/60">
                  <th className="px-4 py-3.5 font-medium">Business</th>
                  <th className="px-4 py-3.5 font-medium">Category</th>
                  <th className="px-4 py-3.5 font-medium">Location</th>
                  <th className="px-4 py-3.5 font-medium">Plan</th>
                  <th className="px-4 py-3.5 font-medium">Status</th>
                  <th className="px-4 py-3.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-2/70 text-sm text-ink">
                {shown.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-ink-soft/50">
                      {vendors?.length ? "No vendors match these filters." : "No vendors yet."}
                    </td>
                  </tr>
                ) : (
                  shown.map((v) => {
                    const live = v.status === "published";
                    return (
                      <tr key={v.org_id} className={`transition-colors hover:bg-stone-4/70 ${live ? "" : "bg-stone-4/30"}`}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <a href={`/v/${v.org_id}`} target="_blank" rel="noreferrer" className="font-medium text-ink hover:text-brand-text">
                              {v.business_name}
                            </a>
                            {v.plan === "featured" && <Icon name="badge" className="size-4 flex-none text-brand-text" />}
                            {v.claimed && (
                              <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-800">Claimed</span>
                            )}
                          </div>
                          {v.email && <div className="text-xs text-ink-soft/60">{v.email}</div>}
                        </td>
                        <td className="px-4 py-4 text-ink-soft/85">{v.category ?? "—"}</td>
                        <td className="px-4 py-4 text-ink-soft/65">{where(v) || "—"}</td>
                        <td className="px-4 py-4">
                          <PlanBadge v={v} />
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge live={live} />
                        </td>
                        <td className="px-4 py-4 text-right">
                          {live ? (
                            <button
                              type="button"
                              onClick={() => act("unpublish_vendor", v.org_id)}
                              disabled={busy}
                              className="rounded-full border border-transparent px-3 py-1 text-xs text-ink-soft/70 transition-colors hover:border-red-200 hover:text-red-600 disabled:opacity-50"
                            >
                              Unpublish
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => act("publish_vendor", v.org_id)}
                              disabled={busy}
                              className="rounded-full border border-brand/30 px-3 py-1 text-xs font-semibold text-brand-text transition-colors hover:bg-brand-wash disabled:opacity-50"
                            >
                              Publish
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-stone-2 pt-4 sm:flex-row">
            <p className="text-xs text-ink-soft/65">
              Showing <span className="font-semibold text-ink">{from && `${num(from)}–${num(to)}`}</span> of{" "}
              <span className="font-semibold text-ink">{num(filtered.length)}</span>
              {filtered.length === stats.vendors ? " vendors" : ` matching (of ${num(stats.vendors)})`}
            </p>
            {pages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Previous page"
                  onClick={() => setPage(current - 1)}
                  disabled={current === 1}
                  className="flex size-8 items-center justify-center rounded-full border border-stone-2 text-ink-soft/70 hover:bg-stone-4 disabled:opacity-40"
                >
                  <Icon name="left" className="size-4" />
                </button>
                {pageList(current, pages).map((p, i) =>
                  p === "gap" ? (
                    <span key={`gap-${i}`} className="px-1 text-xs text-stone-3">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      aria-current={p === current ? "page" : undefined}
                      className={`flex size-8 items-center justify-center rounded-full text-xs ${
                        p === current ? "bg-ink font-semibold text-white" : "font-medium text-ink-soft/70 hover:bg-stone-4"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  aria-label="Next page"
                  onClick={() => setPage(current + 1)}
                  disabled={current === pages}
                  className="flex size-8 items-center justify-center rounded-full border border-stone-2 text-ink-soft/70 hover:bg-stone-4 disabled:opacity-40"
                >
                  <Icon name="right" className="size-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Comment moderation */}
        <div className="space-y-3 rounded-3xl border border-stone-2 bg-white p-4 shadow-card sm:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-soft/60">
            Recent inspiration comments ({comments.length})
          </h2>
          {comments.length === 0 ? (
            <p className="text-sm text-ink-soft/50">No comments yet.</p>
          ) : (
            <div className="divide-y divide-stone-2/70">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-ink">
                      <span className="font-semibold">{c.author_name}</span> <span className="text-ink-soft/60">· {fmt(c.created_at)}</span>
                    </p>
                    <p className="mt-1 text-sm text-ink-soft/85">{c.body}</p>
                  </div>
                  <button
                    onClick={() => act("delete_comment", c.id)}
                    disabled={busy}
                    className="flex-none text-xs font-semibold text-ink-soft/50 hover:text-red-600 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-ink-soft/50">
          For anything not shown here (user accounts, payments), use the Supabase and Stripe dashboards.
        </p>
      </section>
    </div>
  );
}
