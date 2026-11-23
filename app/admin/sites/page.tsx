"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/components/admin/admin-shell";
import { Badge, Card, CardTitle, Empty, Field, Icon, Notice, PageHeader, SearchBox, btn, field } from "@/components/admin/ui";

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

/** The panel's main destructive button: the kit's danger colour at full button size. */
const TAKEDOWN_BTN =
  "inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50";
/** The row's outlined "Take down…" opener. */
const TAKEDOWN_OPEN =
  "inline-flex items-center justify-center gap-2 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function AdminSitesPage() {
  const { expired } = useAdmin();
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
      // A 401 means the admin session ran out: the shell shows sign-in again.
      if (res.status === 401) {
        setResults(null);
        expired();
        return;
      }
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Lookup failed.");
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
      if (res.status === 401) {
        expired();
        return;
      }
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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Couples"
        title="Guest websites"
        subtitle="Find a reported guest website, take it down with a reason, or restore it once it's fixed."
        actions={
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setQ("");
              void load("");
            }}
            className={btn.secondary}
          >
            <Icon name="refresh" className="size-4 text-ink-soft/60" />
            Show taken down
          </button>
        }
      />

      <Card className="space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void load(q.trim());
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="min-w-0 flex-1">
            <SearchBox
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search guest websites"
              placeholder="bridalteam.com/wedding/gene-and-john, or Gene"
              disabled={busy}
            />
          </div>
          <button type="submit" disabled={busy} className={`${btn.primary} shrink-0`}>
            {busy ? "…" : q.trim() ? "Search" : "Show taken down"}
          </button>
        </form>
        <p className="max-w-3xl text-xs leading-relaxed text-ink-soft/65">
          Paste the link someone reported, or search an address or the couple&rsquo;s names. Taking a site down switches it
          off, stops the couple&rsquo;s AI from republishing it, and emails them your reason. Their draft is kept so they can
          fix it; restore it here when it&rsquo;s OK.
        </p>
      </Card>

      {error && <Notice tone="error">{error}</Notice>}
      {notice && <Notice tone="success">{notice}</Notice>}

      {results && (
        <section className="space-y-3">
          <CardTitle count={results.length}>{heading}</CardTitle>
          {results.length === 0 && (
            <Empty>{heading === "Taken down" ? "No sites are taken down right now." : "No wedding matches that."}</Empty>
          )}
          <ul className="space-y-3">
            {results.map((s) => {
              const url = s.slug ? `/wedding/${s.slug}` : null;
              return (
                <li key={s.id}>
                  <Card tone={s.blocked_at ? "danger" : undefined} className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-lg font-medium text-ink">{s.names}</h3>
                          {s.blocked_at ? (
                            <Badge tone="red" dot>
                              Taken down
                            </Badge>
                          ) : s.published ? (
                            <Badge tone="green" dot>
                              Live
                            </Badge>
                          ) : (
                            <Badge tone="grey" dot>
                              Off
                            </Badge>
                          )}
                          <Badge tone="grey">{s.site_mode === "custom" && s.custom_live_at ? "Custom site" : "Standard page"}</Badge>
                        </div>
                        <p className="break-words text-xs text-ink-soft/65">
                          {url ? `bridalteam.com${url}` : "No address"}
                          {s.event_date && ` · Wedding ${s.event_date}`}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {url && (
                          <a href={url} target="_blank" rel="noopener noreferrer" className={btn.small}>
                            View
                            <Icon name="external" className="size-3.5" />
                          </a>
                        )}
                        {open !== s.id && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpen(s.id);
                              setDetail("");
                              setReason(REASONS[0]);
                            }}
                            className={s.blocked_at ? btn.small : TAKEDOWN_OPEN}
                          >
                            {s.blocked_at ? "Restore…" : "Take down…"}
                          </button>
                        )}
                      </div>
                    </div>

                    {s.blocked_at && (
                      <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                        Taken down {when(s.blocked_at)}: {s.block_reason}
                      </p>
                    )}

                    {open === s.id && (
                      <div className="space-y-3 rounded-2xl border border-stone-2 bg-stone-4/50 p-4">
                        {!s.blocked_at && (
                          <Field label="Reason">
                            <select value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy} className={field}>
                              {REASONS.map((r) => (
                                <option key={r}>{r}</option>
                              ))}
                            </select>
                          </Field>
                        )}
                        <Field label={s.blocked_at ? "Note (optional, for the log)" : `Details for the couple (${reason === "Other" ? "required" : "optional"})`}>
                          <input
                            value={detail}
                            onChange={(e) => setDetail(e.target.value)}
                            maxLength={300}
                            disabled={busy}
                            placeholder={s.blocked_at ? "Images replaced" : "The gallery section"}
                            className={field}
                          />
                        </Field>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => act(s, s.blocked_at ? "restore" : "takedown")}
                            disabled={busy || (!s.blocked_at && reason === "Other" && !detail.trim())}
                            className={s.blocked_at ? btn.primary : TAKEDOWN_BTN}
                          >
                            {s.blocked_at ? "Restore — let them publish again" : "Take down now"}
                          </button>
                          <button type="button" onClick={() => setOpen(null)} className={btn.secondary}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {s.history.length > 0 && (
                      <div className="border-t border-stone-2 pt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft/50">History</p>
                        <ul className="mt-1.5 space-y-0.5 text-xs text-ink-soft/60">
                          {s.history.map((h) => (
                            <li key={h.created_at + h.action}>
                              {when(h.created_at)} · {h.action === "takedown" ? "Taken down" : "Restored"}
                              {h.admin ? ` by ${h.admin}` : ""}
                              {h.reason ? ` · ${h.reason}` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
