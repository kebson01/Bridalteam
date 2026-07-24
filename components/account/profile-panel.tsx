"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { squareAvatar } from "@/lib/image";

/** Initials fallback when there's no avatar yet. */
function initials(name: string, email: string): string {
  const source = name.trim() || email.split("@")[0] || "";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const chars = parts.length >= 2 ? parts[0][0] + parts[1][0] : source.slice(0, 2);
  return chars.toUpperCase() || "?";
}

/**
 * Profile basics: avatar photo and display name, both stored on the Supabase
 * user's metadata (full_name / avatar_url). The display name is what shows on
 * comments and anywhere we greet the user.
 */
export default function ProfilePanel({
  userId,
  email,
  initialName,
  initialAvatar,
}: {
  userId: string;
  email: string;
  initialName: string;
  initialAvatar: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFlash(null);
    setSavingName(true);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    setSavingName(false);
    if (error) {
      setError(error.message);
      return;
    }
    setFlash("Name saved.");
    router.refresh();
  }

  async function handleFile(file: File) {
    setError(null);
    setFlash(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    // Generous cap on the *original* — we downscale before upload, so the
    // stored file ends up tiny regardless.
    if (file.size > 15 * 1024 * 1024) {
      setError("Photo must be under 15 MB.");
      return;
    }
    setUploading(true);
    try {
      // Center-crop to a square and downscale so it frames cleanly and loads fast.
      const processed = await squareAvatar(file, 512);

      const supabase = supabaseBrowser();
      // Folder must be the user's id — storage RLS enforces it.
      const path = `${userId}/${crypto.randomUUID()}.${processed.ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, processed.blob, {
          cacheControl: "3600",
          upsert: false,
          contentType: processed.type,
        });
      if (upErr) {
        setError("Upload failed. Please try again.");
        return;
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: metaErr } = await supabase.auth.updateUser({
        data: { avatar_url: data.publicUrl },
      });
      if (metaErr) {
        setError(metaErr.message);
        return;
      }
      setAvatar(data.publicUrl);
      setFlash("Photo updated.");
      router.refresh();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
      <h2 className="text-lg font-medium text-ink">Profile</h2>

      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-16 w-16 flex-none overflow-hidden rounded-full bg-stone-4">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="Your profile photo" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-ink-soft">
              {initials(name, email)}
            </span>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="rounded-full border border-stone-2 px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-dark disabled:opacity-60"
          >
            {uploading ? "Uploading…" : avatar ? "Change photo" : "Add photo"}
          </button>
          <p className="mt-1.5 text-xs text-ink-soft/60">
            JPG, PNG or WebP. We&rsquo;ll crop it to a square automatically.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <form onSubmit={saveName} className="mt-6 max-w-md">
        <label className="block">
          <span className="text-sm font-medium text-ink-soft">Display name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            disabled={savingName}
            placeholder="Your name"
            className="mt-1.5 w-full rounded-lg border border-stone-2 px-4 py-3 text-sm text-ink outline-none focus:border-brand disabled:opacity-60"
          />
          <span className="mt-1.5 block text-xs text-ink-soft/60">
            Shown on your comments and around the app.
          </span>
        </label>

        <button
          type="submit"
          disabled={savingName || name.trim() === initialName.trim()}
          className="mt-4 rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
        >
          {savingName ? "Saving…" : "Save name"}
        </button>
      </form>

      {flash && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{flash}</p>
      )}
      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
