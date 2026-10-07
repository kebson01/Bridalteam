"use client";

import Link from "next/link";
import { useState } from "react";

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

const field =
  "w-full rounded-lg border border-stone-2 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand disabled:opacity-60";

export default function AdminClaimsPage() {
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
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-ink">Claim a listing by phone</h1>
        <Link href="/admin" className="text-sm text-ink-soft hover:text-brand-text">
          ← Admin
        </Link>
      </div>

      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft/75">
        Search the number they are calling from, confirm the business with them,
        then type the email address they want to use. They sign up at the site
        with that address and their listing is offered to them on arrival.
      </p>

      <form onSubmit={search} className="mt-6 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="954-721-9911 or Eddie B"
          disabled={busy}
          className={field}
        />
        <button
          type="submit"
          disabled={busy || q.trim().length < 3}
          className="shrink-0 rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "…" : "Search"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {results?.length === 0 && (
        <p className="mt-6 rounded-lg bg-stone-4 px-4 py-3 text-sm text-ink-soft/80">
          No unclaimed listing matches that. Already-claimed listings are
          deliberately not shown here.
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {(results ?? []).map((r) => (
          <li key={r.org_id} className="rounded-2xl border border-stone-2 bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-medium text-ink">{r.business_name}</h2>
              <span className="text-xs uppercase tracking-wide text-ink-soft/50">{r.status}</span>
            </div>
            <p className="mt-1 text-sm text-ink-soft/75">
              {[r.category, [r.city, r.region].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
            </p>
            {r.phone && <p className="mt-0.5 text-sm text-ink-soft/75">{r.phone}</p>}
            {r.website && (
              <p className="mt-0.5 truncate text-xs text-ink-soft/60">{r.website}</p>
            )}

            {saved[r.org_id] ? (
              <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
                Saved. Tell them to sign up at bridalteam.com using{" "}
                <strong>{saved[r.org_id]}</strong> — their listing will be waiting.
              </p>
            ) : (
              <>
                {r.contact_email && (
                  <p className="mt-3 text-xs text-ink-soft/60">
                    Currently set to <strong>{r.contact_email}</strong>. Saving replaces it.
                  </p>
                )}
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="email"
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
                    className="shrink-0 rounded-full border border-stone-2 px-5 py-2.5 text-sm font-semibold text-ink-soft hover:border-brand hover:text-brand-text disabled:opacity-60"
                  >
                    Save email
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
