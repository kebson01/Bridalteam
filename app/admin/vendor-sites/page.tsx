"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Taking down a vendor's business website (bridalteam.com/biz/<slug>).
 * Someone reports it ("Report this page" under every vendor site), or we spot
 * one that breaks the content rules. Find it by its address or the business
 * name, look at it, and take it down with a reason. The vendor is emailed;
 * their draft is kept, and they can't republish until it's restored here.
 * See app/api/admin/vendor-sites and migration 20261115190000_vendor_websites.sql.
 */

type Entry = { action: string; reason: string | null; admin: string | null; created_at: string };
type Site = {
  org_id: string;
  business: string;
  detail: string;
  slug: string | null;
  published: boolean;
  live_at: string | null;
  blocked_at: string | null;
  block_reason: string | null;
  history: Entry[];
};

const REASONS = [
  "Sexual or explicit content",
  "Hate, harassment or threats",
  "Scam or asks visitors for passwords or payment details",
  "Mocks, attacks or impersonates Bridal Team",
  "Ads for something other than their own business, or spam",
  "Other",
];

const field =
  "w-full rounded-lg border border-stone-2 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand disabled:opacity-60";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function AdminVendorSitesPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Site[] | null>(null);
  const [heading, setHeading] = useState("Taken down");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [reason, setReason] = useState(REASONS[0]);
  const [detail, setDetail] = useState("");

  async function load(query: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/vendor-sites?q=${encodeURIComponent(query)}`);
      const body = await res.json();
      if (!res.ok) {
        setError(res.status === 401 ? "Sign in on the admin dashboard first." : (body.error ?? "Lookup failed."));
        setResults(null);
      } else {
        setResults(body.results);
        setHeading(query ? "Results" : "Taken down");
      }
    } catch {
      setError("Lookup failed.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load("");
  }, []);

  async function act(site: Site, action: "takedown" | "restore") {
    const full = action === "takedown" ? [reason, detail.trim()].filter(Boolean).join(": ") : detail.trim();
    if (action === "takedown" && !window.confirm(`Take down ${site.business}'s website? Their team will be emailed the reason.`)) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/vendor-sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: site.org_id, action, reason: full }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "That didn't work.");
        return;
      }
      setNotice(
        `${action === "takedown" ? "Taken down" : "Restored"}: ${site.business}. ` +
          (body.notified ? `Emailed ${body.emailed} of ${body.notified} on their team.` : "No email address on file to notify."),
      );
      setOpen(null);
      setDetail("");
      await load(q.trim());
    } catch {
      setError("That didn't work.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-ink">Vendor websites</h1>
        <Link href="/admin" className="text-sm text-ink-soft hover:text-brand-text">
          ← Admin
        </Link>
      </div>
      <p className="mt-1 text-sm text-ink-soft/70">
        Find a vendor&rsquo;s website by its address, a pasted /biz/ link or the business name.
      </p>

      <form
        className="mt-5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void load(q.trim());
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="bridalteam.com/biz/keb-tech or Keb Tech" className={field} />
        <button type="submit" disabled={busy} className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 text-sm font-semibold text-white">
          Find
        </button>
      </form>

      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</p>}

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-ink-soft/60">{heading}</h2>
      {results?.length === 0 && <p className="mt-2 text-sm text-ink-soft/60">Nothing here.</p>}
      <ul className="mt-3 space-y-3">
        {results?.map((s) => (
          <li key={s.org_id} className="rounded-2xl border border-stone-2 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">
                  {s.business}
                  {s.blocked_at && (
                    <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold uppercase text-red-700">Taken down</span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-ink-soft/60">
                  {[s.detail, s.slug ? `/biz/${s.slug}` : "no address", s.published ? "online" : "offline"].filter(Boolean).join(" · ")}
                </p>
                {s.block_reason && <p className="mt-1 text-xs text-red-700">Reason: {s.block_reason}</p>}
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                {s.slug && s.published && (
                  <a href={`/biz/${s.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-stone-2 px-3 py-1.5 text-ink-soft hover:border-brand">
                    View ↗
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(open === s.org_id ? null : s.org_id)}
                  className={`rounded-full border px-3 py-1.5 ${s.blocked_at ? "border-stone-2 text-ink-soft hover:border-brand" : "border-red-200 text-red-700 hover:bg-red-50"}`}
                >
                  {s.blocked_at ? "Restore…" : "Take down…"}
                </button>
              </div>
            </div>

            {open === s.org_id && (
              <div className="mt-4 space-y-3 border-t border-stone-2 pt-4">
                {!s.blocked_at && (
                  <select value={reason} onChange={(e) => setReason(e.target.value)} className={field}>
                    {REASONS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                )}
                <textarea
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  rows={2}
                  maxLength={400}
                  placeholder={s.blocked_at ? "Note for the log (optional)" : "Details the vendor will see (optional)"}
                  className={field}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => act(s, s.blocked_at ? "restore" : "takedown")}
                  className={`rounded-full px-5 py-2 text-sm font-semibold text-white ${s.blocked_at ? "bg-gradient-to-r from-brand to-brand-dark" : "bg-red-700"}`}
                >
                  {s.blocked_at ? "Lift the hold" : "Take it down"}
                </button>
              </div>
            )}

            {s.history.length > 0 && (
              <ul className="mt-3 space-y-0.5 text-xs text-ink-soft/60">
                {s.history.map((h, i) => (
                  <li key={i}>
                    {h.action === "takedown" ? "Taken down" : "Restored"} {when(h.created_at)}
                    {h.admin && ` by ${h.admin}`}
                    {h.reason && `: ${h.reason}`}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
