"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { applyProposal } from "@/app/planner/actions";
import { PROPOSAL_TARGET, type Proposal } from "@/lib/planner-actions";
import { shortDate } from "@/lib/dates";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    cents / 100,
  );
}

/** One line per item: the main text, and a quieter detail. */
function describe(p: Proposal, i: number): [string, string | null] {
  switch (p.kind) {
    case "tasks": {
      const t = p.items[i];
      return [t.title, t.due_date ? `by ${shortDate(new Date(`${t.due_date}T00:00:00`))}` : null];
    }
    case "budget": {
      const b = p.items[i];
      return [b.label, `${b.category} · ${money(b.estimated_cents)}`];
    }
    case "vendors": {
      const v = p.items[i];
      return [v.name, v.category];
    }
    case "guests": {
      const g = p.items[i];
      return [g.household_name, `${g.seats} ${g.seats === 1 ? "seat" : "seats"}${g.email ? ` · ${g.email}` : ""}`];
    }
  }
}

/**
 * An AI planner suggestion the couple can add to their wedding. Everything
 * starts ticked; untick what you don't want, then one tap saves the rest.
 */
export default function ProposalCard({ proposal, weddingId }: { proposal: Proposal; weddingId: string }) {
  const target = PROPOSAL_TARGET[proposal.kind];
  const [picked, setPicked] = useState<boolean[]>(() => proposal.items.map(() => true));
  const [expanded, setExpanded] = useState(proposal.items.length <= 6);
  const [result, setResult] = useState<{ added: number; href: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const count = picked.filter(Boolean).length;
  const noun = target.noun[count === 1 ? 0 : 1];
  const shown = expanded ? proposal.items : proposal.items.slice(0, 5);

  function add() {
    setError(null);
    const items = proposal.items.filter((_, i) => picked[i]);
    startTransition(async () => {
      const res = await applyProposal(weddingId, proposal.kind, items);
      if (res.ok && res.href) setResult({ added: res.added ?? items.length, href: res.href });
      else setError(res.error ?? "Couldn't save those.");
    });
  }

  if (result) {
    return (
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-brand/30 bg-brand-wash px-4 py-3 text-sm">
        <span className="font-medium text-ink">
          ✓ Added {result.added} {target.noun[result.added === 1 ? 0 : 1]} to your {target.label}
        </span>
        <Link href={result.href} className="font-semibold text-brand-text hover:underline">
          View {target.label} →
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-2xl border border-stone-2 bg-white p-4 text-sm shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-text">
        Ready to add to your {target.label}
      </p>
      <ul className="mt-3 space-y-1.5">
        {shown.map((_, i) => {
          const [main, detail] = describe(proposal, i);
          return (
            <li key={i}>
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={picked[i]}
                  onChange={() => setPicked((p) => p.map((v, j) => (j === i ? !v : v)))}
                  className="mt-0.5 h-4 w-4 flex-none accent-[var(--color-brand-dark)]"
                />
                <span className={picked[i] ? "text-ink" : "text-ink-soft/40 line-through"}>
                  {main}
                  {detail && <span className="ml-1.5 text-xs text-ink-soft/60">{detail}</span>}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 text-xs font-semibold text-brand-text hover:underline"
        >
          Show all {proposal.items.length}
        </button>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={add}
        disabled={pending || count === 0}
        className="mt-3 w-full rounded-full bg-gradient-to-r from-brand to-brand-dark py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
      >
        {pending ? "Adding…" : `Add ${count} ${noun} to my ${target.label}`}
      </button>
    </div>
  );
}
