"use client";

import { useState, useTransition } from "react";
import { addRegistryLink, deleteRegistryLink, type RegistryLink } from "@/app/wedding/actions";

export default function RegistryManager({
  weddingId,
  initialLinks,
}: {
  weddingId: string;
  initialLinks: RegistryLink[];
}) {
  const [links, setLinks] = useState<RegistryLink[]>(initialLinks);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function add() {
    setError(null);
    start(async () => {
      const res = await addRegistryLink({ weddingId, label, url });
      if (!res.ok || !res.link) {
        setError(res.error ?? "Couldn't add that link.");
        return;
      }
      setLinks((l) => [...l, res.link!]);
      setLabel("");
      setUrl("");
    });
  }

  function remove(id: string) {
    setLinks((l) => l.filter((x) => x.id !== id));
    deleteRegistryLink(id);
  }

  return (
    <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
      <h2 className="font-display text-lg font-semibold text-ink">Registry</h2>
      <p className="text-sm text-ink-soft/70">
        Link the registries you're using — they'll show on your guest website.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Store (e.g. Amazon)"
          maxLength={80}
          className="w-full rounded-lg border border-stone-2 px-3 py-2.5 text-sm outline-none focus:border-brand sm:w-40"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Link (https://…)"
          className="w-full flex-1 rounded-lg border border-stone-2 px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={add}
          disabled={pending || !label.trim() || !url.trim()}
          className="flex-none rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

      {links.length > 0 && (
        <ul className="mt-4 space-y-2">
          {links.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 rounded-lg border border-stone-2 px-3 py-2">
              <span className="min-w-0">
                <b className="text-sm text-ink">{l.label}</b>
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-brand-dark hover:underline">
                  {l.url}
                </a>
              </span>
              <button
                type="button"
                onClick={() => remove(l.id)}
                aria-label="Remove link"
                className="flex-none text-ink-soft/40 hover:text-red-600"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
