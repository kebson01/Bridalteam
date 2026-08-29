import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import VendorManager, { type WeddingVendor } from "@/components/vendor-manager";
import WeddingNav from "@/components/wedding-nav";
import { supabaseServer } from "@/lib/supabase/server";
import { flashFrom } from "@/lib/flash";
import FlashBanner from "@/components/flash-banner";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Vendors",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const money = (c: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(c / 100);

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-2 bg-white p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft/50">{label}</p>
      <p className="mt-2 text-2xl font-light text-ink">{value}</p>
    </div>
  );
}

export default async function VendorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!SHOW_PLANNER_APP) notFound();
  const { id } = await params;
  // Failure message from a server action that bounced back here.
  const flash = flashFrom(await searchParams);

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/w/${id}/vendors`);

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, partner_one, partner_two")
    .eq("id", id)
    .maybeSingle();
  if (!wedding) notFound();

  const { data: vendors } = await supabase
    .from("wedding_vendors")
    .select("id, name, category, status, contact_name, email, phone, website, cost_cents, paid_cents, next_payment_date, contract_signed, next_appointment")
    .eq("wedding_id", id)
    .order("position");

  const rows = (vendors ?? []) as WeddingVendor[];
  const booked = rows.filter((v) => v.status === "booked").length;
  const totalCost = rows.reduce((s, v) => s + v.cost_cents, 0);
  const totalPaid = rows.reduce((s, v) => s + v.paid_cents, 0);
  const names = [wedding.partner_one, wedding.partner_two].filter(Boolean).join(" & ");

  return (
    <div className="bg-stone-4/40 min-h-screen">
      <div className="border-b border-stone-2 bg-white">
        <div className="mx-auto max-w-4xl px-5 py-8">
          <Link href={`/w/${id}`} className="text-sm font-semibold text-brand-text hover:text-brand-deep">
            ← Back to plan
          </Link>
          <h1 className="mt-3 text-3xl font-light uppercase tracking-wide text-ink">Vendors</h1>
          {names && <p className="mt-1 text-sm text-ink-soft/70">{names}</p>}
          <WeddingNav weddingId={id} active="vendors" />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 py-10">
        <FlashBanner message={flash} />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Vendors" value={String(rows.length)} />
          <Stat label="Booked" value={String(booked)} />
          <Stat label="Total cost" value={money(totalCost)} />
          <Stat label="Paid so far" value={money(totalPaid)} />
        </div>

        <div className="mt-8">
          <VendorManager vendors={rows} weddingId={id} />
        </div>
      </div>
    </div>
  );
}
