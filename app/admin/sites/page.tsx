"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Taking down a couple's guest website.
 *
 * Someone reports a site ("Report this page" under every custom site goes to
 * the contact form), or we spot one that breaks the content rules. Find it by
 * the link, the address or the couple's names, look at it, and take it down
 * with a reason. The couple is emailed the reason; their draft is kept so they
 * can fix it, and they can't republish until it's restored here.
 * See app/api/admin/sites and migration 20261101180000_admin_site_takedown.sql.
 */

type Entry = { action: string; reason: string | null; admin: string | null; created_at: string };
type Site = {
  id: string;
  names: string;
  event_date: string | null;
  slug: string | null;
  published: boolean;
  site_mode: "standard" | "custom";
  custom_live_at: string | null;
  blocked_at: string | null;
  block_reason: string | null;
  history: Entry[];
};

const REASONS = [
  "Sexual or explicit content",
  "Hate, harassment or threats",
  "Scam or asks guests for passwords or payment details",
  "Mocks, attacks or impersonates Bridal Team",
  "Ads, spam or unrelated content",
  "Other",
];

const field =
  "w-full rounded-lg border border-stone-2 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand disabled:opacity-60";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function AdminSitesPage() {
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
      const res = await fetch(`/api/admin/sites?q=${encodeURIComponent(query)}`);
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
    if (action === "takedown" && !window.confirm(`Take down the guest website for ${site.names}? They'll be emailed the reason.`)) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wedding_id: site.id, action, reason: full }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "That didn't work.");
        return;
      }
      setNotice(
        `${action === "takedown" ? "Taken down" : "Restored"}: ${site.names}. ` +
          (body.notified ? `Emailed ${body.emailed} of ${body.notified} on the couple's team.` : "No email address on file to notify."),
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
        <h1 className="text-xl font-medium text-ink">Guest websites</h1>
        <Link href="/admin" className="text-sm text-ink-soft hover:text-brand-text">
          ← Admin
        </Link>
      </div>

      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft/75">
        Paste the link someone reported, or search an address or the couple&rsquo;s names. Taking a site down switches it
        off, stops the couple&rsquo;s AI from republishing it, and emails them your reason. Their draft is kept so they can
        fix it; restore it here when it&rsquo;s OK.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void load(q.trim());
        }}
        className="mt-6 flex gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="bridalteam.com/wedding/gene-and-john, or Gene"
          disabled={busy}
          className={field}
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "…" : q.trim() ? "Search" : "Show taken down"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          {notice}
        </p>
      )}

      {results && (
        <h2 className="mt-8 text-xs font-semibold uppercase tracking-wide text-ink-soft/60">
          {heading} ({results.length})
        </h2>
      )}
      {results?.length === 0 && (
        <p className="mt-3 rounded-lg bg-stone-4 px-4 py-3 text-sm text-ink-soft/80">
          {heading === "Taken down" ? "No sites are taken down right now." : "No wedding matches that."}
        </p>
      )}

      <ul className="mt-3 space-y-3">
        {(results ?? []).map((s) => {
          const url = s.slug ? `/wedding/${s.slug}` : null;
          return (
            <li key={s.id} className="rounded-2xl border border-stone-2 bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-base font-medium text-ink">{s.names}</h3>
                <span className="flex flex-wrap gap-1.5 text-xs font-semibold">
                  {s.blocked_at ? (
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700">Taken down</span>
                  ) : s.published ? (
                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-800">Live</span>
                  ) : (
                    <span className="rounded-full bg-stone-4 px-2.5 py-1 text-ink-soft/70">Off</span>
                  )}
                  <span className="rounded-full bg-stone-4 px-2.5 py-1 text-ink-soft/70">
                    {s.site_mode === "custom" && s.custom_live_at ? "Custom site" : "Standard page"}
                  </span>
                </span>
              </div>
              <p className="mt-1 text-sm text-ink-soft/75">
                {url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-brand-text hover:underline">
                    bridalteam.com{url} ↗
                  </a>
                ) : (
                  "No address"
                )}
                {s.event_date && ` · Wedding ${s.event_date}`}
              </p>
              {s.blocked_at && (
                <p className="mt-2 text-sm text-red-700">
                  Taken down {when(s.blocked_at)}: {s.block_reason}
                </p>
              )}
              {s.history.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs text-ink-soft/60">
                  {s.history.map((h) => (
                    <li key={h.created_at + h.action}>
                      {when(h.created_at)} · {h.action === "takedown" ? "Taken down" : "Restored"}
                      {h.admin ? ` by ${h.admin}` : ""}
                      {h.reason ? ` · ${h.reason}` : ""}
                    </li>
                  ))}
                </ul>
              )}

              {open === s.id ? (
                <div className="mt-4 space-y-2 rounded-xl bg-stone-4 p-4">
                  {!s.blocked_at && (
                    <label className="block text-sm font-medium text-ink">
                      Reason
                      <select value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy} className={`${field} mt-1`}>
                        {REASONS.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className="block text-sm font-medium text-ink">
                    {s.blocked_at ? "Note (optional, for the log)" : "Details for the couple (optional)"}
                    <input
                      value={detail}
                      onChange={(e) => setDetail(e.target.value)}
                      maxLength={300}
                      disabled={busy}
                      placeholder={s.blocked_at ? "Images replaced" : "The gallery section"}
                      className={`${field} mt-1`}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => act(s, s.blocked_at ? "restore" : "takedown")}
                      disabled={busy || (!s.blocked_at && reason === "Other" && !detail.trim())}
                      className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
                        s.blocked_at ? "bg-green-700" : "bg-red-700"
                      }`}
                    >
                      {s.blocked_at ? "Restore — let them publish again" : "Take down now"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpen(null)}
                      className="rounded-full border border-stone-2 bg-white px-5 py-2.5 text-sm font-semibold text-ink-soft"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(s.id);
                    setDetail("");
                    setReason(REASONS[0]);
                  }}
                  className={`mt-4 rounded-full border px-5 py-2 text-sm font-semibold ${
                    s.blocked_at
                      ? "border-stone-2 text-ink-soft hover:border-green-700 hover:text-green-800"
                      : "border-red-200 text-red-700 hover:border-red-700"
                  }`}
                >
                  {s.blocked_at ? "Restore…" : "Take down…"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
