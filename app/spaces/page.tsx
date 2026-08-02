import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PageHero from "@/components/page-hero";
import { supabaseServer } from "@/lib/supabase/server";
import { listMySpaces } from "@/app/spaces/actions";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Design a space",
  description: "Snap a photo of any area and design it with real vendor products.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SpacesPage() {
  if (!SHOW_PLANNER_APP) notFound();
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/spaces");

  const spaces = await listMySpaces();

  return (
    <>
      <PageHero
        eyebrow="Design a space"
        title="Your spaces"
        subtitle="Photograph a room, wall or table and lay out real vendor products on it — then save and share."
      />
      <section className="mx-auto max-w-5xl px-5 py-12">
        <div className="mb-6">
          <Link
            href="/spaces/new"
            className="inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white"
          >
            + New space
          </Link>
        </div>

        {spaces.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-2 bg-white p-12 text-center">
            <h2 className="text-lg font-medium text-ink">No spaces yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft/75">
              Start by snapping a photo of the area you want to design — a ceremony backdrop,
              a reception table, a wall — then drop in products to see how they look.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {spaces.map((s) => (
              <Link
                key={s.id}
                href={`/spaces/${s.id}`}
                className="group overflow-hidden rounded-2xl border border-stone-2 bg-white shadow-card"
              >
                <div className="aspect-[4/3] overflow-hidden bg-stone-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.base_image_url}
                    alt={s.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                  <span className="truncate text-sm font-medium text-ink">{s.title}</span>
                  {s.is_public && <span className="flex-none text-[10px] font-semibold uppercase text-brand-dark">Shared</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
