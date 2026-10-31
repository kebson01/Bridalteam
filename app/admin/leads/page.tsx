"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CATEGORY_ORDER } from "@/lib/categories";

/**
 * Vendor leads waiting for review.
 *
 * Researched leads (web search, venue lists, licence and tax-roll files,
 * Google Places) can be imported in bulk: import_vendor_leads() dedupes each
 * one against the directory, fills blanks on matching unclaimed listings, and
 * publishes new ones that have a phone or website. Recommendations from
 * couples and vendors are never bulk-imported -- check each one here, fix the
 * city or category if needed, and import or reject it.
 */

type Lead = {
  id: string;
  source: string;
  source_ref: string | null;
  source_url: string | null;
  business_name: string;
  category: string | null;
  city: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  note: string | null;
  status: string;
  org_id: string | null;
  created_at: string;
};

type Edits = { business_name?: string; category?: string; city?: string; website?: string; phone?: string };

const SOURCE_LABELS: Record<string, string> = {
  couple_referral: "Couple recommended",
  vendor_referral: "Vendor recommended",
  web_search: "Web search",
  venue_preferred: "Venue preferred list",
  association: "Association",
  google_places: "Google Places",
  county_btr: "County tax receipt",
  dbpr: "DBPR licence",
};

const field =
  "w-full rounded-lg border border-stone-2 bg-white px-2.5 py-1.5 text-sm text-ink outline-none focus:border-brand disabled:opacity-60";

export default function AdminLeadsPage() {
  const [status, setStatus] = useState("new");
  const [source, setSource] = useState("");
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [summary, setSummary] = useState<Record<string, Record<string, number>>>({});
  const [edits, setEdits] = useState<Record<string, Edits>>({});
  const [done, setDone] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const qs = new URLSearchParams({ status, ...(source ? { source } : {}) });
    try {
      const res = await fetch(`/api/admin/vendor-leads?${qs}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Lookup failed.");
      setLeads(body.leads);
      setSummary(body.summary);
      setDone({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed.");
    }
  }, [status, source]);

  useEffect(() => {
    load();
  }, [load]);

  async function post(payload: object) {
    const res = await fetch("/api/admin/vendor-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Request failed.");
    return body;
  }

  async function act(lead: Lead, action: "import" | "reject") {
    setBusy(true);
    setError(null);
    try {
      const body = await post({ id: lead.id, action, edits: action === "import" ? edits[lead.id] : undefined });
      setDone((d) => ({ ...d, [lead.id]: body.status }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function importAll() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const body = await post({ action: "import_all", source: source || undefined });
      const parts = (body.results as { outcome: string; n: number }[]).map((r) => `${r.n} ${r.outcome}`);
      setMessage(parts.length ? `Done: ${parts.join(", ")}.` : "Nothing to import.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  const edit = (id: string, k: keyof Edits, v: string) =>
    setEdits((s) => ({ ...s, [id]: { ...s[id], [k]: v } }));
  const val = (l: Lead, k: keyof Edits) => edits[l.id]?.[k] ?? l[k] ?? "";
  const referral = source === "couple_referral" || source === "vendor_referral";

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-ink">Vendor leads</h1>
        <Link href="/admin" className="text-sm text-ink-soft hover:text-brand-text">
          ← Admin
        </Link>
      </div>

      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft/75">
        Every business we&rsquo;ve found that isn&rsquo;t a listing yet. Importing
        checks it against the directory first: a match only fills that
        listing&rsquo;s blanks, and anything new publishes once it has a phone or
        a website.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-xs text-ink-soft">
          <thead>
            <tr className="text-ink-soft/60">
              <th className="py-1 pr-4 font-medium">Source</th>
              {["new", "imported", "duplicate", "rejected"].map((s) => (
                <th key={s} className="py-1 pr-4 font-medium capitalize">{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(summary).map(([src, c]) => (
              <tr key={src}>
                <td className="py-1 pr-4">{SOURCE_LABELS[src] ?? src}</td>
                {["new", "imported", "duplicate", "rejected"].map((s) => (
                  <td key={s} className="py-1 pr-4">{c[s] ?? 0}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${field} w-auto`}>
          {["new", "imported", "duplicate", "rejected"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)} className={`${field} w-auto`}>
          <option value="">All sources</option>
          {Object.entries(SOURCE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        {status === "new" && !referral && (
          <button
            type="button"
            onClick={importAll}
            disabled={busy}
            className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "…" : source ? `Import all ${SOURCE_LABELS[source]} leads` : "Import all researched leads"}
          </button>
        )}
      </div>

      {message && <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{message}</p>}
      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {leads?.length === 0 && (
        <p className="mt-6 rounded-lg bg-stone-4 px-4 py-3 text-sm text-ink-soft/80">No leads here.</p>
      )}

      <ul className="mt-6 space-y-3">
        {(leads ?? []).map((l) => (
          <li key={l.id} className="rounded-2xl border border-stone-2 bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-xs uppercase tracking-wide text-ink-soft/50">
                {SOURCE_LABELS[l.source] ?? l.source}
                {l.source_ref ? ` · ${l.source_ref}` : ""}
              </span>
              <span className="text-xs text-ink-soft/50">{new Date(l.created_at).toLocaleDateString()}</span>
            </div>

            {l.status === "new" && !done[l.id] ? (
              <>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input aria-label="Business name" value={val(l, "business_name")} onChange={(e) => edit(l.id, "business_name", e.target.value)} className={field} />
                  <select aria-label="Category" value={val(l, "category")} onChange={(e) => edit(l.id, "category", e.target.value)} className={field}>
                    <option value="">No category</option>
                    {CATEGORY_ORDER.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <input aria-label="City" placeholder="City" value={val(l, "city")} onChange={(e) => edit(l.id, "city", e.target.value)} className={field} />
                  <input aria-label="Phone" placeholder="Phone" value={val(l, "phone")} onChange={(e) => edit(l.id, "phone", e.target.value)} className={field} />
                  <input aria-label="Website" placeholder="Website" value={val(l, "website")} onChange={(e) => edit(l.id, "website", e.target.value)} className={`${field} sm:col-span-2`} />
                </div>
                {l.note && <p className="mt-2 text-xs text-ink-soft/70">{l.note}</p>}
                {l.source_url && (
                  <a href={l.source_url} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-xs text-brand-text">
                    {l.source_url}
                  </a>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => act(l, "import")}
                    disabled={busy || !val(l, "category") || !val(l, "city")}
                    title={!val(l, "category") || !val(l, "city") ? "Add a category and city first" : undefined}
                    className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Import
                  </button>
                  <button
                    type="button"
                    onClick={() => act(l, "reject")}
                    disabled={busy}
                    className="rounded-full border border-stone-2 px-5 py-2 text-sm font-semibold text-ink-soft hover:border-brand disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="mt-2 text-base font-medium text-ink">{l.business_name}</h2>
                <p className="mt-1 text-sm text-ink-soft/75">
                  {[l.category, l.city, l.phone].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-2 text-sm text-ink-soft">
                  {done[l.id] ?? l.status}
                  {l.org_id && (
                    <>
                      {" · "}
                      <Link href={`/v/${l.org_id}`} className="text-brand-text">view listing</Link>
                    </>
                  )}
                </p>
              </>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
