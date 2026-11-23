"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/components/admin/admin-shell";
import { Badge, Card, CardTitle, Empty, Field, Icon, Notice, PageHeader, PillSelect, btn, field, table, type BadgeTone } from "@/components/admin/ui";
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

const STATUSES = ["new", "imported", "duplicate", "rejected"];
const STATUS_TONE: Record<string, BadgeTone> = { new: "brand", imported: "green", duplicate: "amber", rejected: "red" };

/** Thrown after a 401 so callers stop quietly; the shell is already showing sign-in. */
class SessionExpired extends Error {}

export default function AdminLeadsPage() {
  const { expired } = useAdmin();
  const [status, setStatus] = useState("new");
  const [source, setSource] = useState("");
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [summary, setSummary] = useState<Record<string, Record<string, number>>>({});
  const [edits, setEdits] = useState<Record<string, Edits>>({});
  // Leads reviewed on this screen since the last load: their new status, and
  // the listing an import created or matched (the row's own org_id is from
  // before the import).
  const [done, setDone] = useState<Record<string, { status: string; orgId: string | null }>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const qs = new URLSearchParams({ status, ...(source ? { source } : {}) });
    try {
      const res = await fetch(`/api/admin/vendor-leads?${qs}`);
      if (res.status === 401) return expired();
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Lookup failed.");
      setLeads(body.leads);
      setSummary(body.summary);
      setDone({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed.");
    }
  }, [status, source, expired]);

  useEffect(() => {
    load();
  }, [load]);

  async function post(payload: object) {
    const res = await fetch("/api/admin/vendor-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status === 401) {
      expired();
      throw new SessionExpired();
    }
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Request failed.");
    return body;
  }

  async function act(lead: Lead, action: "import" | "reject") {
    setBusy(true);
    setError(null);
    try {
      const body = await post({ id: lead.id, action, edits: action === "import" ? edits[lead.id] : undefined });
      if (!body.status) {
        // The import ran but didn't say how it ended: reload for the truth
        // rather than leave the row looking untouched.
        await load();
        return;
      }
      setDone((d) => ({ ...d, [lead.id]: { status: body.status, orgId: body.org_id ?? null } }));
    } catch (e) {
      if (e instanceof SessionExpired) return;
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
      if (e instanceof SessionExpired) return;
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  const edit = (id: string, k: keyof Edits, v: string) =>
    setEdits((s) => ({ ...s, [id]: { ...s[id], [k]: v } }));
  const val = (l: Lead, k: keyof Edits) => edits[l.id]?.[k] ?? l[k] ?? "";
  const referral = source === "couple_referral" || source === "vendor_referral";
  const summaryRows = Object.entries(summary);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Vendors"
        title="Vendor leads"
        subtitle={
          <>
            Every business we&rsquo;ve found that isn&rsquo;t a listing yet. Importing checks it against the
            directory first: a match only fills that listing&rsquo;s blanks, and anything new publishes once it has
            a phone or a website.
          </>
        }
        actions={
          status === "new" &&
          !referral && (
            <button type="button" onClick={importAll} disabled={busy} className={btn.primary}>
              <Icon name="upload" className="size-4" />
              {busy ? "…" : source ? `Import all ${SOURCE_LABELS[source]} leads` : "Import all researched leads"}
            </button>
          )
        }
      />

      {message && <Notice tone="success">{message}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      {/* Counts per source and status */}
      {summaryRows.length > 0 && (
        <Card className="space-y-4">
          <CardTitle>Leads by source</CardTitle>
          <div className={table.wrap}>
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr className={table.headRow}>
                  <th className={table.th}>Source</th>
                  {STATUSES.map((s) => (
                    <th key={s} className={`${table.th} text-right capitalize`}>
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={table.body}>
                {summaryRows.map(([src, c]) => (
                  <tr key={src} className={table.row}>
                    <td className="px-4 py-3 font-medium">{SOURCE_LABELS[src] ?? src}</td>
                    {STATUSES.map((s) => (
                      <td key={s} className={`px-4 py-3 text-right tabular-nums ${c[s] ? "text-ink" : "text-ink-soft/40"}`}>
                        {(c[s] ?? 0).toLocaleString("en-US")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Review queue */}
      <Card className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle count={leads?.length}>Leads</CardTitle>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <PillSelect aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </PillSelect>
          <PillSelect aria-label="Source" value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="">All sources</option>
            {Object.entries(SOURCE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </PillSelect>
        </div>

        {leads === null && !error && <Empty>Loading leads…</Empty>}
        {leads?.length === 0 && <Empty>No leads here.</Empty>}

        {leads && leads.length > 0 && (
          <ul className="space-y-3">
            {leads.map((l) => {
              const open = l.status === "new" && !done[l.id];
              const shownStatus = done[l.id]?.status ?? l.status;
              const listingId = done[l.id]?.orgId ?? l.org_id;
              return (
                <li key={l.id} className="rounded-2xl border border-stone-2 bg-white p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="min-w-0 text-[11px] font-semibold uppercase tracking-wider text-ink-soft/55">
                      {SOURCE_LABELS[l.source] ?? l.source}
                      {l.source_ref ? <span className="font-normal normal-case tracking-normal"> · {l.source_ref}</span> : ""}
                    </span>
                    <span className="text-xs text-ink-soft/50">{new Date(l.created_at).toLocaleDateString()}</span>
                  </div>

                  {open ? (
                    <>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <Field label="Business name">
                          <input value={val(l, "business_name")} onChange={(e) => edit(l.id, "business_name", e.target.value)} className={field} />
                        </Field>
                        <Field label="Category">
                          <select value={val(l, "category")} onChange={(e) => edit(l.id, "category", e.target.value)} className={field}>
                            <option value="">No category</option>
                            {CATEGORY_ORDER.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="City">
                          <input placeholder="City" value={val(l, "city")} onChange={(e) => edit(l.id, "city", e.target.value)} className={field} />
                        </Field>
                        <Field label="Phone">
                          <input placeholder="Phone" value={val(l, "phone")} onChange={(e) => edit(l.id, "phone", e.target.value)} className={field} />
                        </Field>
                        <Field label="Website" className="sm:col-span-2">
                          <input placeholder="Website" value={val(l, "website")} onChange={(e) => edit(l.id, "website", e.target.value)} className={field} />
                        </Field>
                      </div>
                      {(l.note || l.source_url) && (
                        <div className="mt-3 space-y-1 rounded-xl bg-stone-4/60 px-3.5 py-2.5">
                          {l.note && <p className="text-xs leading-relaxed text-ink-soft/75">{l.note}</p>}
                          {l.source_url && (
                            <a
                              href={l.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex min-w-0 items-center gap-1.5 text-xs text-brand-text hover:underline"
                            >
                              <Icon name="external" className="size-3.5 flex-none" />
                              <span className="truncate">{l.source_url}</span>
                            </a>
                          )}
                        </div>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => act(l, "import")}
                          disabled={busy || !val(l, "category") || !val(l, "city")}
                          title={!val(l, "category") || !val(l, "city") ? "Add a category and city first" : undefined}
                          className={btn.primary}
                        >
                          Import
                        </button>
                        <button type="button" onClick={() => act(l, "reject")} disabled={busy} className={btn.secondary}>
                          Reject
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base font-medium text-ink">{l.business_name}</h3>
                        <p className="mt-0.5 text-sm text-ink-soft/70">{[l.category, l.city, l.phone].filter(Boolean).join(" · ")}</p>
                      </div>
                      <div className="flex flex-none items-center gap-3">
                        <Badge tone={STATUS_TONE[shownStatus] ?? "grey"} dot>
                          <span className="capitalize">{shownStatus}</span>
                        </Badge>
                        {listingId && (
                          <Link href={`/v/${listingId}`} className={btn.small}>
                            view listing
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
