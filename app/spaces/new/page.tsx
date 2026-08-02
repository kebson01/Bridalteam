import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import PageHero from "@/components/page-hero";
import SpaceCapture from "@/components/spaces/space-capture";
import { supabaseServer } from "@/lib/supabase/server";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "New space",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewSpacePage() {
  if (!SHOW_PLANNER_APP) notFound();
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/spaces/new");

  return (
    <>
      <PageHero eyebrow="Design a space" title="Start with a photo" />
      <section className="mx-auto max-w-3xl px-5 py-12">
        <SpaceCapture userId={user.id} />
      </section>
    </>
  );
}
