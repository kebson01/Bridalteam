"use client";

import { useState, useTransition } from "react";
import { addVendor, updateVendor, deleteVendor, type VendorPatch } from "@/app/w/[id]/vendors/actions";

export interface WeddingVendor {
  id: string;
  name: string;
  category: string | null;
  status: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  cost_cents: number;
  paid_cents: number;
  next_payment_date: string | null;
  contract_signed: boolean;
  next_appointment: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  considering: "Considering",
  contacted: "Contacted",
  booked: "Booked",
  declined: "Declined",
};
const STATUS_STYLE: Record<string, string> = {
  considering: "bg-stone-2 text-ink-soft",
  contacted: "bg-amber-100 text-amber-800",
  booked: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-700",
};

const money = (c: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(c / 100);
const dollarStr = (c: number) => (c ? (c / 100).toFixed(2) : "");

const field =
  "rounded-lg border border-stone-2 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand disabled:opacity-50";

function VendorCard({
  vendor,
  weddingId,
  disabled,
  onPatch,
  onDelete,
}: {
  vendor: WeddingVendor;
  weddingId: string;
  disabled: boolean;
  onPatch: (id: string, patch: VendorPatch) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <article className="rounded-2xl border border-stone-2 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <input
            defaultValue={vendor.name}
            disabled={disabled}
            onBlur={(e) => e.target.value !== vendor.name && onPatch(vendor.id, { name: e.target.value })}
            className="w-full truncate border-none bg-transparent text-lg font-medium text-ink outline-none"
          />
          <input
            defaultValue={vendor.category ?? ""}
            disabled={disabled}
            placeholder="Category"
            onBlur={(e) =>
              (e.target.value || "") !== (vendor.category ?? "") &&
              onPatch(vendor.id, { category: e.target.value })
            }
            className="w-full border-none bg-transparent text-sm text-ink-soft/70 outline-none"
          />
        </div>
        <select
          value={vendor.status}
          disabled={disabled}
          onChange={(e) => onPatch(vendor.id, { status: e.target.value })}
          className={`flex-none rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[vendor.status]}`}
        >
          {Object.entries(STATUS_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* Money line — always visible */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-soft/50">Cost</span>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-soft/50">$</span>
            <input
              inputMode="decimal"
              defaultValue={dollarStr(vendor.cost_cents)}
              disabled={disabled}
              placeholder="0"
              onBlur={(e) => onPatch(vendor.id, { costDollars: parseFloat(e.target.value) || 0 })}
              className={`${field} w-full pl-6 text-right`}
            />
          </div>
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-soft/50">Paid</span>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-soft/50">$</span>
            <input
              inputMode="decimal"
              defaultValue={dollarStr(vendor.paid_cents)}
              disabled={disabled}
              placeholder="0"
              onBlur={(e) => onPatch(vendor.id, { paidDollars: parseFloat(e.target.value) || 0 })}
              className={`${field} w-full pl-6 text-right`}
            />
          </div>
        </label>
      </div>

      {vendor.cost_cents > 0 && vendor.paid_cents < vendor.cost_cents && (
        <p className="mt-2 text-xs text-ink-soft/60">
          {money(vendor.cost_cents - vendor.paid_cents)} remaining
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-3 text-sm font-semibold text-brand-text hover:text-brand-deep"
      >
        {open ? "Hide details" : "Contact, contract & dates"}
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-stone-2 pt-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <input defaultValue={vendor.contact_name ?? ""} disabled={disabled} placeholder="Contact name"
              onBlur={(e) => onPatch(vendor.id, { contact_name: e.target.value })} className={field} />
            <input defaultValue={vendor.email ?? ""} disabled={disabled} placeholder="Email" type="email"
              onBlur={(e) => onPatch(vendor.id, { email: e.target.value })} className={field} />
            <input defaultValue={vendor.phone ?? ""} disabled={disabled} placeholder="Phone"
              onBlur={(e) => onPatch(vendor.id, { phone: e.target.value })} className={field} />
            <input defaultValue={vendor.website ?? ""} disabled={disabled} placeholder="Website"
              onBlur={(e) => onPatch(vendor.id, { website: e.target.value })} className={field} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-sm text-ink-soft">
              Next appointment
              <input type="date" defaultValue={vendor.next_appointment ?? ""} disabled={disabled}
                onBlur={(e) => onPatch(vendor.id, { next_appointment: e.target.value })} className={`${field} mt-1 w-full`} />
            </label>
            <label className="block text-sm text-ink-soft">
              Next payment due
              <input type="date" defaultValue={vendor.next_payment_date ?? ""} disabled={disabled}
                onBlur={(e) => onPatch(vendor.id, { next_payment_date: e.target.value })} className={`${field} mt-1 w-full`} />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" defaultChecked={vendor.contract_signed} disabled={disabled}
              onChange={(e) => onPatch(vendor.id, { contract_signed: e.target.checked })}
              className="h-4 w-4 rounded border-stone-2 text-brand focus:ring-brand" />
            Contract signed
          </label>
          <button type="button" onClick={() => onDelete(vendor.id)} disabled={disabled}
            className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50">
            Remove vendor
          </button>
        </div>
      )}
    </article>
  );
}

export default function VendorManager({
  vendors,
  weddingId,
}: {
  vendors: WeddingVendor[];
  weddingId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

  const patch = (id: string, p: VendorPatch) => startTransition(() => updateVendor(id, weddingId, p));
  const remove = (id: string) => startTransition(() => deleteVendor(id, weddingId));
  const add = () => {
    if (!name.trim()) return;
    startTransition(() => addVendor(weddingId, name, category));
    setName("");
    setCategory("");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-dashed border-stone-2 bg-stone-4 p-4">
        <p className="mb-3 text-sm font-medium text-ink-soft">Add a vendor</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Business name"
            className={`${field} flex-1`} />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (e.g. Florist)"
            className={`${field} sm:w-48`} />
          <button type="button" onClick={add} disabled={pending}
            className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-2 text-sm font-semibold text-white disabled:opacity-60">
            Add
          </button>
        </div>
      </div>

      {vendors.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-soft/60">
          No vendors yet. Add the ones you&rsquo;re considering or have booked.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {vendors.map((v) => (
            <VendorCard
              key={v.id}
              vendor={v}
              weddingId={weddingId}
              disabled={pending}
              onPatch={patch}
              onDelete={remove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
