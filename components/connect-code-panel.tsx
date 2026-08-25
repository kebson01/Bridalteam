"use client";

import { useState, useTransition } from "react";
import { generateConnectCode } from "@/app/w/[id]/team/actions";

/**
 * Couple-facing: shows the connect code to share with a planner, or a button to
 * create one. Copy-to-clipboard and rotate.
 */
export default function ConnectCodePanel({
  weddingId,
  initialCode,
}: {
  weddingId: string;
  initialCode: string | null;
}) {
  const [code, setCode] = useState(initialCode);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function make() {
    startTransition(async () => {
      const next = await generateConnectCode(weddingId);
      if (next) setCode(next);
    });
  }

  function copy() {
    if (!code) return;
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
      <h2 className="text-lg font-medium text-ink">Working with a wedding planner?</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft/75">
        Share this code with your planner. They&rsquo;ll enter it to join your
        wedding and help manage the plan, budget and vendors alongside you.
      </p>

      {code ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-xl border border-dashed border-brand/40 bg-brand/5 px-5 py-2.5 font-mono text-xl tracking-[0.3em] text-brand-text">
            {code}
          </span>
          <button
            type="button"
            onClick={copy}
            className="rounded-full border border-stone-2 px-4 py-2 text-sm font-semibold text-ink-soft hover:border-brand hover:text-brand-text"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            type="button"
            onClick={make}
            disabled={pending}
            className="text-sm font-medium text-ink-soft/60 hover:text-brand-text disabled:opacity-50"
          >
            {pending ? "…" : "Generate a new code"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={make}
          disabled={pending}
          className="mt-4 rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create a connect code"}
        </button>
      )}

      {code && (
        <p className="mt-3 text-xs text-ink-soft/50">
          Anyone with this code can join and edit your wedding. Generate a new
          code to revoke the old one.
        </p>
      )}
    </div>
  );
}
