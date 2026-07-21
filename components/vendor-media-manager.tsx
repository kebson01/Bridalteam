"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { addVendorMedia, deleteVendorMedia, type MediaState } from "@/app/vendor/actions";
import { supabaseBrowser } from "@/lib/supabase/browser";

export interface VendorMedia {
  id: string;
  image_url: string;
  title: string;
  media_type: string;
  like_count: number;
}

const INPUT =
  "w-full rounded-lg border border-stone-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand disabled:opacity-60";

export default function VendorMediaManager({
  orgId,
  media,
}: {
  orgId: string;
  media: VendorMedia[];
}) {
  const [type, setType] = useState<"photo" | "video" | "audio">("photo");
  const [state, action, pending] = useActionState<MediaState, FormData>(addVendorMedia, {
    error: null,
    added: false,
  });
  const [delPending, startDelete] = useTransition();

  // Photo file upload → Supabase Storage → public URL carried in a hidden field.
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploadError(null);
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError("Image must be under 8 MB.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${orgId}/${crypto.randomUUID()}.${ext}`;
      const supabase = supabaseBrowser();
      const { error } = await supabase.storage.from("vendor-media").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) {
        setUploadError("Upload failed. Please try again.");
      } else {
        const { data } = supabase.storage.from("vendor-media").getPublicUrl(path);
        setUploadUrl(data.publicUrl);
      }
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
        <h2 className="text-lg font-medium text-ink">Showcase your work</h2>
        <p className="mt-1 text-sm text-ink-soft/75">
          Add photos, performance videos or audio to the inspiration gallery.
          Couples can like, save and share them — and find their way back to you.
        </p>

        <form action={action} className="mt-4 space-y-3">
          <input type="hidden" name="org_id" value={orgId} />

          <div className="flex flex-wrap gap-2">
            {(["photo", "video", "audio"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                aria-pressed={type === t}
                className={`rounded-full border px-4 py-1.5 text-sm capitalize transition-colors ${
                  type === t ? "border-brand bg-brand text-white" : "border-stone-2 text-ink-soft hover:border-brand"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <input type="hidden" name="media_type" value={type} />

          <div className="grid gap-3 sm:grid-cols-2">
            <input name="title" required placeholder="Title (e.g. Sarah & Tom's first dance)" disabled={pending} className={INPUT} />
            <input name="theme" placeholder="Theme (optional)" disabled={pending} className={INPUT} />
          </div>

          {type === "photo" ? (
            <div>
              {/* The uploaded file's public URL travels in the form's url field. */}
              <input type="hidden" name="url" value={uploadUrl} />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                disabled={pending || uploading}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              {uploading && <p className="mt-2 text-xs text-ink-soft/60">Uploading…</p>}
              {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
              {uploadUrl && !uploading && (
                <div className="mt-2 flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={uploadUrl} alt="preview" className="h-14 w-14 rounded-lg object-cover" />
                  <span className="text-xs text-green-700">Ready to add.</span>
                </div>
              )}
            </div>
          ) : (
            <>
              <input
                name="url"
                required
                disabled={pending}
                placeholder={
                  type === "video"
                    ? "YouTube / Vimeo / video link (your performance reel)"
                    : "SoundCloud / audio link (your set or sample)"
                }
                className={INPUT}
              />
              <input name="poster" placeholder="Cover image URL (optional)" disabled={pending} className={INPUT} />
            </>
          )}

          {state.error && (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{state.error}</p>
          )}
          {state.added && (
            <p className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-800">Added to the gallery.</p>
          )}

          <button
            type="submit"
            disabled={pending || uploading || (type === "photo" && !uploadUrl)}
            className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Adding…" : "Add to gallery"}
          </button>
        </form>
      </div>

      {media.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft/50">Your gallery ({media.length})</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {media.map((m) => (
              <figure key={m.id} className="relative overflow-hidden rounded-2xl border border-stone-2 bg-white shadow-card">
                <div className="relative aspect-[4/5] bg-stone-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.image_url} alt={m.title} className="h-full w-full object-cover" />
                  <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                    {m.media_type}
                  </span>
                </div>
                <figcaption className="flex items-center justify-between gap-2 p-3">
                  <span className="truncate text-sm text-ink">{m.title}</span>
                  <button
                    type="button"
                    onClick={() => startDelete(() => deleteVendorMedia(m.id))}
                    disabled={delPending}
                    aria-label={`Remove ${m.title}`}
                    className="flex-none text-ink-soft/40 hover:text-red-600 disabled:opacity-40"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
