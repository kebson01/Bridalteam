"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdmin } from "@/components/admin/admin-shell";
import { Badge, Card, CardTitle, Empty, Icon, Kpi, Notice, PageHeader, PillSelect, SearchBox, btn, field, table } from "@/components/admin/ui";

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

function PlanBadge({ v }: { v: VendorRow }) {
  if (v.plan === "free") return <span className="text-xs text-ink-soft/60">Free</span>;
  const how = v.plan_source === "paid" ? "" : v.plan_source === "comp" ? " · granted" : " · promo";
  return (
    <Badge tone={v.plan === "featured" ? "brandSolid" : "brand"}>
      {v.plan === "featured" ? "Featured" : "Pro"}
      {how}
    </Badge>
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

// ── Add vendor ──────────────────────────────────────────────────────────────

const FIELD = field;
const OPT = "ml-1 text-[11px] font-normal text-ink-soft/50";

interface Duplicate {
  orgId: string;
  businessName: string;
  city: string | null;
  status: string;
  url: string;
}
interface Created {
  businessName: string;
  pageUrl: string;
  claimUrl: string | null;
  claimEmail: string | null;
}

/**
 * The "Add vendor" form. Listings are created as drafts with a claim link
 * (app/api/admin/dashboard, create_vendor); the table's Publish button puts
 * one live.
 */
function AddVendorPanel({ categories, onClose, onCreated }: { categories: string[]; onClose: () => void; onCreated: () => void }) {
  const empty = { business_name: "", category: "", city: "", region: "FL", website: "", email: "", phone: "", contact_email: "", description: "", note: "" };
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<Duplicate[] | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (k === "business_name") setDuplicates(null); // a new name needs a new check
  };

  async function submit(force: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_vendor", vendor: form, force }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 409 && json.duplicates) {
        setDuplicates(json.duplicates);
        return;
      }
      if (!res.ok) {
        setError(json.error ?? "Couldn't add the vendor.");
        return;
      }
      setCreated({ businessName: form.business_name.trim(), pageUrl: json.pageUrl, claimUrl: json.claimUrl, claimEmail: json.claimEmail });
      setForm(empty);
      setDuplicates(null);
      onCreated();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the link is on screen to select by hand.
    }
  }

  return (
    <section aria-labelledby="add-vendor-title" className="rounded-3xl border border-brand/30 bg-white p-4 shadow-card sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="add-vendor-title" className="font-display text-xl font-medium text-ink">Add a vendor</h2>
          <p className="mt-1 text-sm text-ink-soft/70">
            Creates a draft listing with a claim link. Publish it from the table when it&rsquo;s ready.
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-ink-soft/60 hover:bg-stone-4 hover:text-ink">
          <Icon name="close" className="size-5" />
        </button>
      </div>

      {created && (
        <div role="status" className="mt-5 rounded-2xl bg-green-50 p-4 text-sm text-green-900">
          <p className="font-medium">{created.businessName} was added as a draft.</p>
          <p className="mt-1">
            <a href={created.pageUrl} target="_blank" rel="noreferrer" className="font-semibold underline-offset-2 hover:underline">
              View the listing
            </a>
          </p>
          {created.claimUrl && (
            <div className="mt-3">
              <p className="text-xs text-green-900/80">
                Claim link{created.claimEmail ? `, for ${created.claimEmail}` : ""}. It works for 60 days; the vendor signs in, opens it and the page is theirs.
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <code className="min-w-0 max-w-full break-all rounded-lg bg-white px-2.5 py-1.5 text-xs text-ink">{created.claimUrl}</code>
                <button type="button" onClick={() => copy(created.claimUrl!)} className="rounded-full border border-green-700/30 px-3 py-1 text-xs font-semibold text-green-900 hover:bg-white">
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}
          {created.claimEmail && (
            <p className="mt-3 text-xs text-green-900/80">
              The vendor email campaign will also invite this address to claim it, in its usual order.
            </p>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(false);
        }}
        className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-ink-soft">Business name</span>
          <input required value={form.business_name} onChange={set("business_name")} maxLength={160} className={`mt-1 ${FIELD}`} placeholder="Bloom & Vine Florals" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-ink-soft">Category <span className={OPT}>optional</span></span>
          <input value={form.category} onChange={set("category")} list="vendor-categories" className={`mt-1 ${FIELD}`} placeholder="Photography" />
          <datalist id="vendor-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <div className="grid grid-cols-[1fr_5rem] gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-ink-soft">City <span className={OPT}>optional</span></span>
            <input value={form.city} onChange={set("city")} className={`mt-1 ${FIELD}`} placeholder="Fort Lauderdale" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink-soft">State</span>
            <input value={form.region} onChange={set("region")} maxLength={40} className={`mt-1 ${FIELD}`} />
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-semibold text-ink-soft">Website <span className={OPT}>optional</span></span>
          <input value={form.website} onChange={set("website")} inputMode="url" className={`mt-1 ${FIELD}`} placeholder="bloomandvine.com" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-ink-soft">Phone <span className={OPT}>optional</span></span>
          <input value={form.phone} onChange={set("phone")} type="tel" className={`mt-1 ${FIELD}`} placeholder="(954) 555-0100" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-ink-soft">Public email <span className={OPT}>optional, shown on the listing</span></span>
          <input value={form.email} onChange={set("email")} type="email" className={`mt-1 ${FIELD}`} placeholder="hello@bloomandvine.com" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-ink-soft">Claim email <span className={OPT}>optional, defaults to the public email</span></span>
          <input value={form.contact_email} onChange={set("contact_email")} type="email" className={`mt-1 ${FIELD}`} placeholder="owner@bloomandvine.com" />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-ink-soft">Description <span className={OPT}>optional</span></span>
          <textarea value={form.description} onChange={set("description")} rows={3} maxLength={4000} className={`mt-1 ${FIELD}`} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-ink-soft">Internal note <span className={OPT}>optional, admins only</span></span>
          <input value={form.note} onChange={set("note")} maxLength={500} className={`mt-1 ${FIELD}`} placeholder="Met at the Broward bridal expo" />
        </label>

        {duplicates && (
          <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:col-span-2">
            <p className="font-medium">We already have {duplicates.length === 1 ? "a listing" : "listings"} with this name:</p>
            <ul className="mt-2 space-y-1">
              {duplicates.map((d) => (
                <li key={d.orgId}>
                  <a href={d.url} target="_blank" rel="noreferrer" className="font-semibold underline-offset-2 hover:underline">
                    {d.businessName}
                  </a>
                  <span className="text-amber-900/70"> · {[d.city, d.status === "published" ? "published" : "draft"].filter(Boolean).join(" · ")}</span>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => submit(true)} disabled={busy} className="mt-3 text-xs font-semibold text-amber-900 underline underline-offset-2 disabled:opacity-50">
              It&rsquo;s a different business. Add it anyway
            </button>
          </div>
        )}
        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{error}</p>}

        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Icon name="plus" className="size-4" />
            {busy ? "Adding…" : "Add vendor"}
          </button>
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft/70 hover:text-ink">
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { expired } = useAdmin();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);

  // The admin session cookie rides along on same-origin fetches; the shell has
  // already checked it. A 401 here means it ran out, so hand back to sign-in.
  const loadDashboard = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/dashboard");
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) return expired();
      if (!res.ok) {
        setError(json.error ?? "Couldn't load the dashboard.");
        return;
      }
      setData(json);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }, [expired]);

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
    if (res.ok) return loadDashboard();
    if (res.status === 401) return expired();
    const j = await res.json().catch(() => ({}));
    setError(j.error ?? "Action failed.");
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

  const header = (
    <PageHeader
      eyebrow="Platform administration"
      title="Dashboard"
      subtitle="Manage vendors, directory listings, publication status and marketplace activity."
      actions={
        <>
          <button type="button" onClick={exportCsv} disabled={!data} className={btn.secondary}>
            <Icon name="download" className="size-4 text-ink-soft/60" />
            Export CSV
          </button>
          <button type="button" onClick={() => setAdding(true)} aria-expanded={adding} className={btn.primary}>
            <Icon name="plus" className="size-4" />
            Add vendor
          </button>
        </>
      }
    />
  );

  if (!data) {
    return (
      <div className="space-y-8">
        {header}
        {error ? <Notice tone="error">{error}</Notice> : <Empty>Loading the dashboard…</Empty>}
      </div>
    );
  }

  const { stats, comments, reports } = data;
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const from = filtered.length ? (current - 1) * PAGE_SIZE + 1 : 0;
  const to = (current - 1) * PAGE_SIZE + shown.length;

  return (
    <div className="space-y-8">
      {header}

      {adding && <AddVendorPanel categories={categories.map(([c]) => c)} onClose={() => setAdding(false)} onCreated={loadDashboard} />}

      {error && <Notice tone="error">{error}</Notice>}

      {/* Key numbers */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        <Kpi label="Total vendors" value={num(stats.vendors)} sub={`${num(stats.vendorsPublished)} live · ${num(stats.vendorsClaimed)} claimed`} icon="store" />
        <Kpi label="Paid plans" value={num(stats.paying)} sub={`$${num(stats.mrr)}/mo · ${num(stats.granted)} granted free`} icon="badge" />
        <Kpi label="Weddings" value={num(stats.weddings)} sub={`${num(stats.weddingSites)} with a live website`} icon="heart" />
        <Kpi label="Vendor inquiries" value={num(stats.inquiries)} sub={`${num(stats.inquiries30)} in the last 30 days`} icon="send" />
        <Kpi
          label="Moderation queue"
          value={num(stats.reports)}
          sub={stats.reports ? "Reports need review" : "All reports clear"}
          icon={stats.reports ? "flag" : "check"}
          good={!stats.reports}
          className="col-span-2 xl:col-span-1"
        />
      </div>

      {/* Reported images (priority) */}
      {reports.length > 0 && (
        <Card tone="danger" className="space-y-3">
          <CardTitle tone="danger" count={reports.length}>
            Reported images
          </CardTitle>
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
              <div className="flex flex-none items-center gap-2">
                <button onClick={() => act("dismiss_report", r.id)} disabled={busy} className={btn.quiet}>
                  Dismiss
                </button>
                <button onClick={() => act("delete_reported_image", r.image_id)} disabled={busy} className={btn.danger}>
                  Remove image
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Vendor directory */}
      <Card className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <CardTitle count={stats.vendors}>Vendor directory</CardTitle>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SearchBox value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search vendors" placeholder="Search name, email or city…" />
          <PillSelect aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map(([c, n]) => (
              <option key={c} value={c}>
                {c} ({n})
              </option>
            ))}
          </PillSelect>
          <PillSelect aria-label="Plan" value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="">All plans</option>
            <option value="featured">Featured</option>
            <option value="pro">Pro</option>
            <option value="free">Free</option>
          </PillSelect>
          <PillSelect aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </PillSelect>
        </div>

        <div className={table.wrap}>
          <table className={table.table}>
            <thead>
              <tr className={table.headRow}>
                <th className={table.th}>Business</th>
                <th className={table.th}>Category</th>
                <th className={table.th}>Location</th>
                <th className={table.th}>Plan</th>
                <th className={table.th}>Status</th>
                <th className={`${table.th} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody className={table.body}>
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
                    <tr key={v.org_id} className={`${table.row} ${live ? "" : "bg-stone-4/30"}`}>
                      <td className={table.td}>
                        <div className="flex items-center gap-1.5">
                          <a href={`/v/${v.org_id}`} target="_blank" rel="noreferrer" className="font-medium text-ink hover:text-brand-text">
                            {v.business_name}
                          </a>
                          {v.plan === "featured" && <Icon name="badge" className="size-4 flex-none text-brand-text" />}
                          {v.claimed && <Badge tone="green">Claimed</Badge>}
                        </div>
                        {v.email && <div className="text-xs text-ink-soft/60">{v.email}</div>}
                      </td>
                      <td className={`${table.td} text-ink-soft/85`}>{v.category ?? "—"}</td>
                      <td className={`${table.td} text-ink-soft/65`}>{where(v) || "—"}</td>
                      <td className={table.td}>
                        <PlanBadge v={v} />
                      </td>
                      <td className={table.td}>
                        <Badge tone={live ? "green" : "grey"} dot>
                          {live ? "Published" : "Draft"}
                        </Badge>
                      </td>
                      <td className={`${table.td} text-right`}>
                        {live ? (
                          <button type="button" onClick={() => act("unpublish_vendor", v.org_id)} disabled={busy} className={btn.dangerQuiet}>
                            Unpublish
                          </button>
                        ) : (
                          <button type="button" onClick={() => act("publish_vendor", v.org_id)} disabled={busy} className={btn.small}>
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
      </Card>

      {/* Comment moderation */}
      <Card className="space-y-3">
        <CardTitle count={comments.length}>Recent inspiration comments</CardTitle>
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
                <button onClick={() => act("delete_comment", c.id)} disabled={busy} className={btn.dangerQuiet}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <p className="text-xs text-ink-soft/50">For anything not shown here (user accounts, payments), use the Supabase and Stripe dashboards.</p>
    </div>
  );
}
