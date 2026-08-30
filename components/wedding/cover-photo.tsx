"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setWeddingCover } from "@/app/wedding/actions";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { downscaleImage } from "@/lib/image";

/**
 * The photo at the top of the couple's public wedding page.
 *
 * Uploaded straight from the browser into wedding-media under the wedding's own
 * folder — the bucket policy checks can_edit_wedding on that folder, so a couple
 * can't write into someone else's wedding. The picture is downscaled first: a
 * modern phone photo is 4–8 MB, and guests open these on mobile data.
 */
export default function CoverPhoto({
  weddingId,
  initialUrl,
}: {
  weddingId: string;
  initialUrl: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("That photo is over 15 MB. Please choose a smaller one.");
      return;
    }

    setBusy(true);
    try {
      // 2000px on the long edge is plenty for a full-width hero and keeps the
      // file small enough to load quickly on a phone.
      const processed = await downscaleImage(file, 2000);
      const supabase = supabaseBrowser();
      const path = `${weddingId}/${crypto.randomUUID()}.${processed.ext}`;

      const { error: upErr } = await supabase.storage
        .from("wedding-media")
        .upload(path, processed.blob, { cacheControl: "3600", upsert: false, contentType: processed.type });
      if (upErr) {
        console.error("cover upload failed:", upErr.message);
        setError("Upload failed. Please try again.");
        return;
      }

      const { data } = supabase.storage.from("wedding-media").getPublicUrl(path);
      const res = await setWeddingCover(weddingId, data.publicUrl);
      if (!res.ok) {
        setError(res.error ?? "Couldn’t save that photo.");
        return;
      }
      setUrl(data.publicUrl);
      router.refresh();
    } catch {
      setError("Couldn’t read that image. Please try another.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function remove() {
    setError(null);
    start(async () => {
      // Only the reference is cleared; the file stays in storage. Deleting it
      // would break any page still holding the old URL, and the couple may well
      // put it back.
      const res = await setWeddingCover(weddingId, null);
      if (!res.ok) return setError(res.error ?? "Couldn’t remove that photo.");
      setUrl(null);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
      <h2 className="font-display text-lg font-semibold text-ink">Photo</h2>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-soft/75">
        A picture for the top of your guest page. Landscape works best &mdash; it sits behind your
        names.
      </p>

      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Your wedding page photo"
          className="mt-4 aspect-[16/7] w-full rounded-xl object-cover"
        />
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy || pending}
          className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Uploading…" : url ? "Replace photo" : "Upload a photo"}
        </button>
        {url && (
          <button
            type="button"
            onClick={remove}
            disabled={busy || pending}
            className="rounded-full border border-stone-2 px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-text disabled:opacity-60"
          >
            Remove
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}
