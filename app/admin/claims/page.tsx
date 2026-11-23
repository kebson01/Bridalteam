"use client";

import { useState } from "react";
import { useAdmin } from "@/components/admin/admin-shell";
import { Badge, Card, CardTitle, Empty, Icon, Notice, PageHeader, SearchBox, btn, field } from "@/components/admin/ui";

/**
 * The page you keep open while a vendor is on the phone.
 *
 * Search by the number they are calling from (or their business name), confirm
 * it is them, type the email they read out, save. They then sign up with that
 * address and are offered the listing on arrival.
 *
 * What this page does NOT do is let the call itself complete a claim. The
 * numbers in these listings came from the businesses' own public websites, so
 * knowing one proves nothing and caller ID is forgeable. Attaching an email
 * only makes the listing claimable by a *confirmed* account on that address —
 * the inbox is the credential, the call is just how we learn which inbox.
 */

type Result = {
  org_id: string;
  business_name: string;
  category: string | null;
  city: string | null;
  region: string | null;
  website: string | null;
  phone: string | null;
  status: string;
  contact_email: string | null;
};

export default function AdminClaimsPage() {
  const { expired } = useAdmin();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, string>>({});

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/vendor-claims?q=${encodeURIComponent(q)}`);
      if (res.status === 401) return expired();
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Lookup failed.");
        setResults(null);
      } else {
        setResults(body.results);
      }
    } catch {
      setError("Lookup failed.");
      setResults(null);
    } finally {
      setBusy(false);
    }
  }

  async function attach(orgId: string) {
    const email = (emails[orgId] ?? "").trim();
    if (!email) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/vendor-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, email }),
      });
      if (res.status === 401) return expired();
      const body = await res.json();
      if (!res.ok) setError(body.error ?? "Couldn't save that email.");
      else setSaved((s) => ({ ...s, [orgId]: body.email }));
    } catch {
      setError("Couldn't save that email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Vendors"
        title="Claims by phone"
        subtitle="Search the number they are calling from, confirm the business with them, then type the email address they want to use. They sign up at the site with that address and their listing is offered to them on arrival."
      />

      <Card className="space-y-4">
        <CardTitle>Find the listing</CardTitle>
        <form onSubmit={search} className="flex flex-col gap-3 sm:flex-row">
          <div className="min-w-0 flex-1">
            <SearchBox
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Phone number or business name"
              placeholder="954-721-9911 or Eddie B"
              disabled={busy}
            />
          </div>
          <button type="submit" disabled={busy || q.trim().length < 3} className={`${btn.primary} shrink-0`}>
            <Icon name="search" className="size-4" />
            {busy ? "…" : "Search"}
          </button>
        </form>
        <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-soft/60">
          <Icon name="lock" className="mt-px size-4 flex-none text-brand-text" />
          The call never completes a claim on its own: saving an email only lets a confirmed account on that address
          claim the listing.
        </p>
      </Card>

      {error && <Notice tone="error">{error}</Notice>}

      {results?.length === 0 && (
        <Empty>No unclaimed listing matches that. Already-claimed listings are deliberately not shown here.</Empty>
      )}

      {results && results.length > 0 && (
        <Card className="space-y-4">
          <CardTitle count={results.length}>Unclaimed listings</CardTitle>
          <ul className="space-y-3">
            {results.map((r) => (
              <li key={r.org_id} className="rounded-2xl border border-stone-2 bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="min-w-0 font-display text-lg font-medium text-ink">{r.business_name}</h3>
                  <Badge tone={r.status === "published" ? "green" : "grey"} dot>
                    <span className="capitalize">{r.status}</span>
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-ink-soft/75">
                  {[r.category, [r.city, r.region].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
                </p>
                {(r.phone || r.website) && (
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft/75">
                    {r.phone && <span className="font-medium text-ink">{r.phone}</span>}
                    {r.website && (
                      <span className="flex min-w-0 max-w-full items-center gap-1.5 text-xs text-ink-soft/60">
                        <Icon name="globe" className="size-3.5 flex-none" />
                        <span className="truncate">{r.website}</span>
                      </span>
                    )}
                  </div>
                )}

                {saved[r.org_id] ? (
                  <div className="mt-4">
                    <Notice tone="success">
                      Saved. Tell them to sign up at bridalteam.com using <strong>{saved[r.org_id]}</strong> — their
                      listing will be waiting.
                    </Notice>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2 border-t border-stone-2/70 pt-4">
                    {r.contact_email && (
                      <p className="text-xs text-ink-soft/60">
                        Currently set to <strong className="text-ink-soft">{r.contact_email}</strong>. Saving replaces it.
                      </p>
                    )}
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="email"
                        aria-label={`Email for ${r.business_name}`}
                        value={emails[r.org_id] ?? ""}
                        onChange={(e) => setEmails((s) => ({ ...s, [r.org_id]: e.target.value }))}
                        placeholder="the email they read out"
                        disabled={busy}
                        className={field}
                      />
                      <button
                        type="button"
                        onClick={() => attach(r.org_id)}
                        disabled={busy || !(emails[r.org_id] ?? "").trim()}
                        className={`${btn.secondary} shrink-0`}
                      >
                        Save email
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
