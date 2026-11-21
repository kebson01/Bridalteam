"use client";

import { useCallback, useEffect, useState } from "react";
import type { Venue } from "@/lib/supabase";
import { useAdmin } from "@/components/admin/admin-shell";
import { Badge, Card, CardTitle, Empty, Field, Icon, Notice, PageHeader, btn, field, table } from "@/components/admin/ui";

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
  const { expired } = useAdmin();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [bulk, setBulk] = useState("");

  // Sign-in is the admin shell's job: its httpOnly session cookie rides along
  // on these same-origin fetches and app/api/admin/venues checks it with
  // adminGuard. A 401 means the session ran out, so hand back to sign-in.
  const load = useCallback(async () => {
    const res = await fetch("/api/admin/venues");
    if (res.status === 401) return expired();
    const data = await res.json();
    setVenues(data.venues ?? []);
    setLoaded(true);
  }, [expired]);

  useEffect(() => {
    load();
  }, [load]);

  // This page used to keep the admin password in sessionStorage for its own
  // sign-in. The cookie replaces that, so clear anything left behind.
  useEffect(() => {
    try {
      sessionStorage.removeItem("bt_admin_user");
      sessionStorage.removeItem("bt_admin_pw");
    } catch {
      // Storage blocked: nothing to clear.
    }
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const editing = Boolean(form.id);
    const res = await fetch("/api/admin/venues", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.status === 401) {
      setBusy(false);
      return expired();
    }
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg({ text: data.error ?? "Something went wrong.", ok: false });
      return;
    }
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    if (res.status === 401) {
      setBusy(false);
      return expired();
    }
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.status === 401) return expired();
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

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Couples"
        title="Venues"
        subtitle="Add, edit and remove the venues and vendors couples browse, one at a time or many at once from a CSV."
        actions={
          <>
            <a href="#bulk-import" className={btn.secondary}>
              <Icon name="upload" className="size-4 text-ink-soft/60" />
              Bulk import
            </a>
            <a href="#venue-form" className={btn.primary}>
              <Icon name="plus" className="size-4" />
              Add venue
            </a>
          </>
        }
      />

      {msg && <Notice tone={msg.ok ? "success" : "error"}>{msg.text}</Notice>}

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Add / edit form */}
        <Card tone={form.id ? "brand" : undefined} className="xl:col-span-3">
          <form id="venue-form" onSubmit={save} className="scroll-mt-24 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-medium text-ink">{form.id ? "Edit venue" : "Add a venue"}</h2>
              {form.id && (
                <Badge tone="brand" dot>
                  Editing {form.name || "venue"}
                </Badge>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" hint="required">
                <input required placeholder="The Grand Hall" className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Category">
                <input placeholder="Venue" className={field} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </Field>
              <Field label="City">
                <input placeholder="Miami" className={field} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </Field>
              <Field label="State">
                <input placeholder="FL" className={field} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </Field>
              <Field label="Price">
                <select className={field} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}>
                  <option value="$">$ — budget</option>
                  <option value="$$">$$ — mid</option>
                  <option value="$$$">$$$ — premium</option>
                </select>
              </Field>
              <Field label="Capacity" hint="guests">
                <input type="number" placeholder="200" className={field} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
              </Field>
              <Field label="Tag">
                <input placeholder="Garden · 200 guests" className={field} value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} />
              </Field>
              <Field label="Image URL">
                <input placeholder="https://…" className={field} value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
              </Field>
              <Field label="Website" className="sm:col-span-2">
                <input placeholder="https://…" className={field} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <textarea rows={3} className={field} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Field>
            </div>
            <label className="flex items-center gap-2.5 text-sm text-ink-soft">
              <input
                type="checkbox"
                className="size-4 rounded accent-brand"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              />
              Featured (show first)
            </label>
            <div className="flex flex-wrap gap-3 border-t border-stone-2 pt-5">
              <button disabled={busy} className={btn.primary}>
                {busy ? "Saving…" : form.id ? "Update venue" : "Add venue"}
              </button>
              {form.id && (
                <button type="button" onClick={() => setForm(EMPTY)} className={btn.secondary}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </Card>

        {/* Bulk import */}
        <Card className="space-y-4 xl:col-span-2">
          <div id="bulk-import" className="scroll-mt-24">
            <h2 className="font-display text-xl font-medium text-ink">Bulk import (CSV)</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft/70">
              Paste a CSV with a header row to add many vendors at once. Only <strong className="text-ink">name</strong> is
              required; other columns are optional and unknown ones are ignored.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5" aria-label="Recognized columns">
            {BULK_FIELDS.map((f) => (
              <code key={f} className="rounded-md bg-stone-4 px-1.5 py-0.5 text-[11px] text-ink-soft">
                {f}
              </code>
            ))}
          </div>
          <textarea
            rows={7}
            aria-label="CSV to import"
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            placeholder={
              "name,category,city,state,price\n" +
              "The Grand Hall,Venue,Miami,FL,$$$\n" +
              "Bloom & Co,Florist,Coral Springs,FL,$$\n" +
              "Sunset Sounds,DJ,Fort Lauderdale,FL,$$"
            }
            className={`${field} font-mono text-xs`}
          />
          <button type="button" onClick={bulkImport} disabled={busy || !bulk.trim()} className={btn.primary}>
            <Icon name="upload" className="size-4" />
            {busy ? "Importing…" : "Import CSV"}
          </button>
        </Card>
      </div>

      {/* Existing venues */}
      <Card className="space-y-4">
        <CardTitle count={venues.length}>Venues</CardTitle>
        {venues.length === 0 ? (
          <Empty>{loaded ? "No venues yet — add your first one above." : "Loading venues…"}</Empty>
        ) : (
          <div className={table.wrap}>
            <table className={table.table}>
              <thead>
                <tr className={table.headRow}>
                  <th className={table.th}>Name</th>
                  <th className={table.th}>Location</th>
                  <th className={table.th}>Price</th>
                  <th className={table.th}>Tag</th>
                  <th className={`${table.th} text-right`}>Action</th>
                </tr>
              </thead>
              <tbody className={table.body}>
                {venues.map((v) => (
                  <tr key={v.id} className={`${table.row} ${form.id === v.id ? "bg-brand-wash" : ""}`}>
                    <td className={table.td}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-ink">{v.name}</span>
                        {v.featured && <Badge tone="brand">Featured</Badge>}
                      </div>
                      {v.category && <div className="text-xs text-ink-soft/60">{v.category}</div>}
                    </td>
                    <td className={`${table.td} text-ink-soft/65`}>{[v.city, v.state].filter(Boolean).join(", ") || "—"}</td>
                    <td className={`${table.td} text-ink-soft/85`}>{v.price || "—"}</td>
                    <td className={`${table.td} text-ink-soft/85`}>{v.tag || "—"}</td>
                    <td className={`${table.td} whitespace-nowrap text-right`}>
                      <button type="button" onClick={() => edit(v)} className={btn.small}>
                        Edit
                      </button>
                      <button type="button" onClick={() => remove(v.id)} className={btn.dangerQuiet}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
