"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { downscaleImage } from "@/lib/image";
import { createSpace } from "@/app/spaces/actions";

/**
 * Step 1 of a space: capture or upload a photo of the real area. On phones the
 * capture hint opens the rear camera; on desktop it's a file picker. Works on
 * every device — no AR/WebXR required.
 */
export default function SpaceCapture({ userId }: { userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose a photo.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Photo must be under 15 MB.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const processed = await downscaleImage(file, 1600);
      const supabase = supabaseBrowser();
      const path = `${userId}/${crypto.randomUUID()}.${processed.ext}`;
      const { error: upErr } = await supabase.storage
        .from("post-media")
        .upload(path, processed.blob, { cacheControl: "3600", upsert: false, contentType: processed.type });
      if (upErr) {
        setError("Upload failed. Please try again.");
        setBusy(false);
        return;
      }
      const { data } = supabase.storage.from("post-media").getPublicUrl(path);
      const res = await createSpace(data.publicUrl, "photo");
      if (res.id) {
        router.push(`/spaces/${res.id}`);
        return;
      }
      setError(res.error === "sign_in" ? "Please log in and try again." : res.error ?? "Couldn't create the space.");
      setBusy(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <label
        className={`flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-stone-2 bg-stone-1 text-center transition-colors hover:border-brand ${
          busy ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFile}
          disabled={busy}
          className="hidden"
        />
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-dark">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
        <span className="text-base font-semibold text-ink">
          {busy ? "Uploading…" : "Take or choose a photo"}
        </span>
        <span className="max-w-xs px-6 text-sm text-ink-soft/70">
          Snap the room, wall, table or backdrop you want to design. You&rsquo;ll place
          products on it next.
        </span>
      </label>
      {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
