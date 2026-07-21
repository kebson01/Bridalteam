"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Triggers AI plan generation for a wedding, then refreshes so the seeded plan
 * appears. Generation can take a bit (a full plan is a sizeable model call), so
 * this owns a clear pending state.
 */
export default function GeneratePlanButton({
  weddingId,
  className,
  children,
}: {
  weddingId: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/w/${weddingId}/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: weddingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Couldn't generate a plan. Please try again.");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Please try again.");
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={generate} disabled={busy} className={className}>
        {busy ? "Building your plan…" : children}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-white/90">
          {error}
        </p>
      )}
    </>
  );
}
