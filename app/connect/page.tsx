import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PageHero from "@/components/page-hero";
import ConnectForm from "@/components/connect-form";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Connect to a Wedding",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ConnectPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/connect");

  return (
    <>
      <PageHero
        eyebrow="For planners"
        title="Connect to a couple"
        subtitle="Enter the connect code your couple shared with you to join their wedding and start managing it together."
      />
      <section className="mx-auto max-w-md px-5 py-16">
        <ConnectForm />
      </section>
    </>
  );
}
