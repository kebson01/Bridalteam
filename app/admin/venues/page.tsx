"use client";

import { useCallback, useEffect, useState } from "react";
import type { Venue } from "@/lib/supabase";

const EMPTY = {
  id: "",
  name: "",
  category: "Venue",
  city: "",
  state: "",
  price: "$$",
  capacity: "",
  tag: "",
  description: "",
  image_url: "",
  website: "",
  featured: false,
};
type Form = typeof EMPTY;

// Columns recognized by the bulk importer (match the venues table).
const BULK_FIELDS = [
  "name", "category", "city", "state", "price", "capacity",
  "tag", "description", "image_url", "website", "featured",
] as const;

/** Split one CSV line, honoring double-quoted fields (and "" escapes). */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else inQuotes = false;
      } else cur += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur); cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

/** Parse pasted CSV (first line = headers) into row objects keyed by header. */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (cells[i] ?? "").trim(); });
    return row;
  });
}

export default function AdminVenuesPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [form, setForm] = useState<Form>(EMPTY);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [bulk, setBulk] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/venues");
    const data = await res.json();
    setVenues(data.venues ?? []);
  }, []);

  useEffect(() => {
    if (unlocked) load();
  }, [unlocked, load]);

  // Restore previously entered credentials for convenience.
  useEffect(() => {
    const savedPw = sessionStorage.getItem("bt_admin_pw");
    if (savedPw) {
      setUsername(sessionStorage.getItem("bt_admin_user") ?? "");
      setPassword(savedPw);
      setUnlocked(true);
    }
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const editing = Boolean(form.id);
    const res = await fetch("/api/admin/venues", {
      method: editing ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-user": username,
        "x-admin-password": password,
      },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg({ text: data.error ?? "Something went wrong.", ok: false });
      return;
    }
    sessionStorage.setItem("bt_admin_user", username);
    sessionStorage.setItem("bt_admin_pw", password);
    setMsg({ text: editing ? "Venue updated." : "Venue added.", ok: true });
    setForm(EMPTY);
    load();
  }

  async function bulkImport() {
    const parsed = parseCsv(bulk);
    if (parsed.length === 0) {
      setMsg({ text: "Paste a CSV with a header row and at least one vendor.", ok: false });
      return;
    }
    const rows = parsed.map((r) => {
      const row: Record<string, unknown> = {};
      for (const f of BULK_FIELDS) {
        const val = r[f];
        if (val === undefined || val === "") continue;
        row[f] = f === "featured" ? /^(true|yes|1)$/i.test(val) : val;
      }
      return row;
    });

    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/venues", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-user": username,
        "x-admin-password": password,
      },
      body: JSON.stringify({ rows }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg({ text: data.error ?? "Import failed.", ok: false });
      return;
    }
    setMsg({
      text: `Imported ${data.inserted} vendor(s)${data.skipped ? `, skipped ${data.skipped} without a name` : ""}.`,
      ok: true,
    });
    setBulk("");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this venue?")) return;
    const res = await fetch("/api/admin/venues", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-user": username,
        "x-admin-password": password,
      },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg({ text: data.error ?? "Delete failed.", ok: false });
      return;
    }
    setMsg({ text: "Venue deleted.", ok: true });
    load();
  }

  function edit(v: Venue) {
    setForm({
      id: v.id,
      name: v.name ?? "",
      category: v.category ?? "Venue",
      city: v.city ?? "",
      state: v.state ?? "",
      price: v.price ?? "$$",
      capacity: v.capacity != null ? String(v.capacity) : "",
      tag: v.tag ?? "",
      description: v.description ?? "",
      image_url: v.image_url ?? "",
      website: v.website ?? "",
      featured: v.featured ?? false,
    });
    setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!unlocked) {
    return (
      <section className="mx-auto max-w-md px-5 py-24">
        <h1 className="text-2xl font-light uppercase tracking-wide text-ink">Venue admin</h1>
        <p className="mt-2 text-sm text-ink-soft/70">
          Enter your admin username and password to manage venues.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (password) setUnlocked(true);
          }}
          className="mt-6 space-y-3"
        >
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full rounded-lg border border-stone-2 px-4 py-3 text-sm outline-none focus:border-brand"
          />
          <div className="flex gap-2">
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="flex-1 rounded-lg border border-stone-2 px-4 py-3 text-sm outline-none focus:border-brand"
            />
            <button className="rounded-lg bg-gradient-to-r from-brand to-brand-dark px-5 py-3 text-sm font-semibold text-white">
              Unlock
            </button>
          </div>
        </form>
        <p className="mt-4 text-xs text-ink-soft/50">
          Set <code>ADMIN_USERNAME</code>, <code>ADMIN_PASSWORD</code> and{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> in your environment to enable saving.
        </p>
      </section>
    );
  }

  const field =
    "w-full rounded-lg border border-stone-2 px-3 py-2.5 text-sm outline-none focus:border-brand";

  return (
    <section className="mx-auto max-w-5xl px-5 py-14">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-light uppercase tracking-wide text-ink">Venue admin</h1>
        <button
          onClick={() => {
            sessionStorage.removeItem("bt_admin_user");
            sessionStorage.removeItem("bt_admin_pw");
            setUnlocked(false);
          }}
          className="text-sm text-ink-soft/60 hover:text-brand-dark"
        >
          Lock
        </button>
      </div>

      {msg && (
        <div
          className={`mt-4 rounded-lg px-4 py-3 text-sm ${
            msg.ok ? "bg-brand/10 text-brand-deep" : "bg-red-50 text-red-600"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Add / edit form */}
      <form
        onSubmit={save}
        className="mt-6 rounded-2xl border border-stone-2 bg-white p-6 shadow-card"
      >
        <h2 className="text-lg font-medium text-ink">
          {form.id ? "Edit venue" : "Add a venue"}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input required placeholder="Name *" className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Category (Venue)" className={field} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input placeholder="City" className={field} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input placeholder="State" className={field} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <select className={field} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}>
            <option value="$">$ — budget</option>
            <option value="$$">$$ — mid</option>
            <option value="$$$">$$$ — premium</option>
          </select>
          <input type="number" placeholder="Capacity (guests)" className={field} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          <input placeholder="Tag, e.g. 'Garden · 200 guests'" className={field} value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} />
          <input placeholder="Image URL" className={field} value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          <input placeholder="Website" className={`${field} sm:col-span-2`} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          <textarea placeholder="Description" rows={3} className={`${field} sm:col-span-2`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
          Featured (show first)
        </label>
        <div className="mt-5 flex gap-3">
          <button
            disabled={busy}
            className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : form.id ? "Update venue" : "Add venue"}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={() => setForm(EMPTY)}
              className="rounded-full border border-stone-2 px-6 py-2.5 text-sm font-medium text-ink-soft"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Bulk import */}
      <div className="mt-6 rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
        <h2 className="text-lg font-medium text-ink">Bulk import (CSV)</h2>
        <p className="mt-1 text-sm text-ink-soft/70">
          Paste a CSV with a header row to add many vendors at once. Recognized columns:{" "}
          <code className="text-xs">
            name, category, city, state, price, capacity, tag, description, image_url, website,
            featured
          </code>
          . Only <strong>name</strong> is required; other columns are optional and unknown ones
          are ignored.
        </p>
        <textarea
          rows={7}
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          placeholder={
            "name,category,city,state,price\n" +
            "The Grand Hall,Venue,Miami,FL,$$$\n" +
            "Bloom & Co,Florist,Coral Springs,FL,$$\n" +
            "Sunset Sounds,DJ,Fort Lauderdale,FL,$$"
          }
          className={`${field} mt-4 font-mono text-xs`}
        />
        <button
          type="button"
          onClick={bulkImport}
          disabled={busy || !bulk.trim()}
          className="mt-3 rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Importing…" : "Import CSV"}
        </button>
      </div>

      {/* Existing venues */}
      <h2 className="mt-10 text-lg font-medium text-ink">
        Venues <span className="text-ink-soft/50">({venues.length})</span>
      </h2>
      <div className="mt-4 space-y-3">
        {venues.map((v) => (
          <div
            key={v.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-stone-2 bg-white px-4 py-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-ink">{v.name}</span>
                {v.featured && (
                  <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-dark">
                    Featured
                  </span>
                )}
              </div>
              <p className="truncate text-sm text-ink-soft/70">
                {[v.city, v.state].filter(Boolean).join(", ")}
                {v.price ? ` · ${v.price}` : ""}
                {v.tag ? ` · ${v.tag}` : ""}
              </p>
            </div>
            <div className="flex flex-none gap-2">
              <button onClick={() => edit(v)} className="rounded-lg border border-stone-2 px-3 py-1.5 text-sm text-ink-soft hover:border-brand hover:text-brand-dark">
                Edit
              </button>
              <button onClick={() => remove(v.id)} className="rounded-lg border border-stone-2 px-3 py-1.5 text-sm text-red-500 hover:border-red-300">
                Delete
              </button>
            </div>
          </div>
        ))}
        {venues.length === 0 && (
          <p className="text-sm text-ink-soft/60">No venues yet — add your first one above.</p>
        )}
      </div>
    </section>
  );
}
