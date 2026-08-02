"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { saveItems, setSpacePublic, deleteSpace, type SpaceItem } from "@/app/spaces/actions";

export type Product = { image_url: string; title: string | null };

type Item = SpaceItem & { key: string };

let seq = 0;
const newKey = () => `k${seq++}`;

/**
 * Touch-first "design your space" canvas: place vendor product images over a
 * base photo, then move / resize / rotate / restack / remove each one. Works on
 * any phone (pointer events, no AR). Read-only for shared (non-owner) views.
 */
export default function SpaceEditor({
  spaceId,
  baseImageUrl,
  initialItems,
  products,
  isPublic,
  readOnly = false,
}: {
  spaceId: string;
  baseImageUrl: string;
  initialItems: SpaceItem[];
  products: Product[];
  isPublic: boolean;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ key: string } | null>(null);

  const [items, setItems] = useState<Item[]>(() =>
    initialItems.map((it) => ({ ...it, key: newKey() })),
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pub, setPub] = useState(isPublic);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const sel = items.find((i) => i.key === selected) ?? null;

  function mutate(key: string, patch: Partial<Item>) {
    setItems((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)));
    setDirty(true);
  }

  function addProduct(p: Product) {
    const z = items.reduce((m, i) => Math.max(m, i.z), 0) + 1;
    const key = newKey();
    setItems((list) => [
      ...list,
      { key, source_image_url: p.image_url, label: p.title ?? null, x: 0.5, y: 0.5, scale: 0.3, rotation: 0, z },
    ]);
    setSelected(key);
    setDirty(true);
    setPickerOpen(false);
  }

  function onPointerDown(e: ReactPointerEvent, key: string) {
    if (readOnly) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { key };
    setSelected(key);
  }
  function onPointerMove(e: ReactPointerEvent) {
    if (!drag.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    mutate(drag.current.key, { x, y });
  }
  function onPointerUp() {
    drag.current = null;
  }

  function remove(key: string) {
    setItems((list) => list.filter((i) => i.key !== key));
    setSelected(null);
    setDirty(true);
  }
  function bump(key: string, dz: number) {
    mutate(key, { z: (items.find((i) => i.key === key)?.z ?? 0) + dz });
  }

  async function save() {
    setSaving(true);
    const payload: SpaceItem[] = items.map((i) => ({
      source_image_url: i.source_image_url,
      label: i.label,
      x: i.x,
      y: i.y,
      scale: i.scale,
      rotation: i.rotation,
      z: i.z,
    }));
    const res = await saveItems(spaceId, payload);
    setSaving(false);
    if (res.ok) setDirty(false);
  }

  async function toggleShare() {
    const next = !pub;
    setPub(next);
    await setSpacePublic(spaceId, next);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/spaces/${spaceId}`);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function onDelete() {
    if (!confirm("Delete this space? This can't be undone.")) return;
    const res = await deleteSpace(spaceId);
    if (res.ok) router.push("/spaces");
  }

  return (
    <div className="space-y-4">
      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative w-full touch-none select-none overflow-hidden rounded-2xl border border-stone-2 bg-stone-1"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelected(null);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={baseImageUrl} alt="Your space" className="block w-full" draggable={false} />
        {[...items]
          .sort((a, b) => a.z - b.z)
          .map((it) => (
            // eslint-disable-next-line jsx-a11y/no-static-element-interactions
            <div
              key={it.key}
              onPointerDown={(e) => onPointerDown(e, it.key)}
              className={`absolute cursor-move ${
                selected === it.key ? "outline outline-2 outline-brand" : ""
              }`}
              style={{
                left: `${it.x * 100}%`,
                top: `${it.y * 100}%`,
                width: `${it.scale * 100}%`,
                transform: `translate(-50%, -50%) rotate(${it.rotation}deg)`,
                zIndex: it.z + 1,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.source_image_url} alt={it.label ?? ""} className="w-full" draggable={false} />
            </div>
          ))}
      </div>

      {readOnly ? (
        <p className="text-center text-sm text-ink-soft/60">
          A space shared from Bridal Team.{" "}
          <a href="/spaces/new" className="font-semibold text-brand-dark hover:underline">
            Design your own →
          </a>
        </p>
      ) : (
        <>
          {/* Selected-item toolbar */}
          {sel && (
            <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-stone-2 bg-white p-2 shadow-card">
              <ToolBtn onClick={() => mutate(sel.key, { scale: Math.max(0.05, sel.scale - 0.04) })}>Smaller</ToolBtn>
              <ToolBtn onClick={() => mutate(sel.key, { scale: Math.min(1.5, sel.scale + 0.04) })}>Larger</ToolBtn>
              <ToolBtn onClick={() => mutate(sel.key, { rotation: sel.rotation - 15 })}>⟲</ToolBtn>
              <ToolBtn onClick={() => mutate(sel.key, { rotation: sel.rotation + 15 })}>⟳</ToolBtn>
              <ToolBtn onClick={() => bump(sel.key, 1)}>Front</ToolBtn>
              <ToolBtn onClick={() => bump(sel.key, -1)}>Back</ToolBtn>
              <ToolBtn onClick={() => remove(sel.key)} danger>
                Remove
              </ToolBtn>
            </div>
          )}

          {/* Primary actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-semibold text-white"
            >
              + Add product
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || !dirty}
              className="rounded-full border border-stone-2 px-5 py-2.5 text-sm font-semibold text-ink-soft hover:border-brand disabled:opacity-50"
            >
              {saving ? "Saving…" : dirty ? "Save" : "Saved"}
            </button>
            <button
              type="button"
              onClick={toggleShare}
              className="rounded-full border border-stone-2 px-4 py-2.5 text-sm font-semibold text-ink-soft hover:border-brand"
            >
              {pub ? "Shared · public" : "Make shareable"}
            </button>
            {pub && (
              <button type="button" onClick={copyLink} className="text-sm font-semibold text-brand-dark hover:underline">
                Copy link
              </button>
            )}
            <button type="button" onClick={onDelete} className="ml-auto text-sm text-ink-soft/50 hover:text-red-600">
              Delete
            </button>
          </div>

          {/* Product picker */}
          {pickerOpen && (
            <div className="rounded-2xl border border-stone-2 bg-white p-3 shadow-card">
              {products.length === 0 ? (
                <p className="p-4 text-center text-sm text-ink-soft/60">
                  No products to place yet — add media to a vendor gallery first.
                </p>
              ) : (
                <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                  {products.map((p) => (
                    <button
                      key={p.image_url}
                      type="button"
                      onClick={() => addProduct(p)}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-stone-2 hover:border-brand"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image_url} alt={p.title ?? ""} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <p className="text-center text-xs text-ink-soft/50">
            Tap a product to add it · drag to move · use the toolbar to resize, rotate and layer.
          </p>
        </>
      )}
    </div>
  );
}

function ToolBtn({
  children,
  onClick,
  danger = false,
}: {
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
        danger ? "text-red-600 hover:bg-red-50" : "text-ink-soft hover:bg-stone-4"
      }`}
    >
      {children}
    </button>
  );
}
