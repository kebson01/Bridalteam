"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/components/admin/admin-shell";
import { Badge, Card, CardTitle, Empty, Field, Icon, Notice, PageHeader, SearchBox, btn, field } from "@/components/admin/ui";

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

/** The panel's main destructive button: the kit's danger colour at full button size. */
const TAKEDOWN_BTN =
  "inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50";
/** The row's outlined "Take down…" opener. */
const TAKEDOWN_OPEN =
  "inline-flex items-center justify-center gap-2 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function AdminVendorSitesPage() {
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
      const res = await fetch(`/api/admin/vendor-sites?q=${encodeURIComponent(query)}`);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Vendors"
        title="Vendor websites"
        subtitle="Find a reported vendor website, take it down with a reason, or lift the hold once it's fixed."
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
              aria-label="Search vendor websites"
              placeholder="bridalteam.com/biz/keb-tech or Keb Tech"
            />
          </div>
          <button type="submit" disabled={busy} className={`${btn.primary} shrink-0`}>
            Find
          </button>
        </form>
        <p className="max-w-3xl text-xs leading-relaxed text-ink-soft/65">
          Find a vendor&rsquo;s website by its address, a pasted /biz/ link or the business name. Taking it down switches it
          off and emails their team your reason; their draft is kept, and they can&rsquo;t republish until you lift the hold
          here.
        </p>
      </Card>

      {error && <Notice tone="error">{error}</Notice>}
      {notice && <Notice tone="success">{notice}</Notice>}

      {results && (
        <section className="space-y-3">
          <CardTitle count={results.length}>{heading}</CardTitle>
          {results.length === 0 && <Empty>Nothing here.</Empty>}
          <ul className="space-y-3">
            {results.map((s) => (
              <li key={s.org_id}>
                <Card tone={s.blocked_at ? "danger" : undefined} className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg font-medium text-ink">{s.business}</h3>
                        {s.blocked_at ? (
                          <Badge tone="red" dot>
                            Taken down
                          </Badge>
                        ) : s.published ? (
                          <Badge tone="green" dot>
                            Online
                          </Badge>
                        ) : (
                          <Badge tone="grey" dot>
                            Offline
                          </Badge>
                        )}
                      </div>
                      <p className="break-words text-xs text-ink-soft/65">
                        {[s.detail, s.slug ? `/biz/${s.slug}` : "no address"].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {s.slug && s.published && (
                        <a href={`/biz/${s.slug}`} target="_blank" rel="noopener noreferrer" className={btn.small}>
                          View
                          <Icon name="external" className="size-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setOpen(open === s.org_id ? null : s.org_id)}
                        aria-expanded={open === s.org_id}
                        className={s.blocked_at ? btn.small : TAKEDOWN_OPEN}
                      >
                        {s.blocked_at ? "Restore…" : "Take down…"}
                      </button>
                    </div>
                  </div>

                  {s.block_reason && (
                    <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">Reason: {s.block_reason}</p>
                  )}

                  {open === s.org_id && (
                    <div className="space-y-3 rounded-2xl border border-stone-2 bg-stone-4/50 p-4">
                      {!s.blocked_at && (
                        <Field label="Reason">
                          <select value={reason} onChange={(e) => setReason(e.target.value)} className={field}>
                            {REASONS.map((r) => (
                              <option key={r}>{r}</option>
                            ))}
                          </select>
                        </Field>
                      )}
                      <Field label={s.blocked_at ? "Note for the log (optional)" : "Details the vendor will see (optional)"}>
                        <textarea
                          value={detail}
                          onChange={(e) => setDetail(e.target.value)}
                          rows={2}
                          maxLength={400}
                          placeholder={s.blocked_at ? "Note for the log (optional)" : "Details the vendor will see (optional)"}
                          className={field}
                        />
                      </Field>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => act(s, s.blocked_at ? "restore" : "takedown")}
                          className={s.blocked_at ? btn.primary : TAKEDOWN_BTN}
                        >
                          {s.blocked_at ? "Lift the hold" : "Take it down"}
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
                        {s.history.map((h, i) => (
                          <li key={i}>
                            {h.action === "takedown" ? "Taken down" : "Restored"} {when(h.created_at)}
                            {h.admin && ` by ${h.admin}`}
                            {h.reason && `: ${h.reason}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
