import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHero from "@/components/page-hero";
import AuthPanel from "@/components/auth/auth-panel";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Create Your Account",
  description: "Start planning with Bridal Team.",
  robots: { index: false, follow: false },
};

export default async function AuthSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (!SHOW_PLANNER_APP) notFound();
  const { next } = await searchParams;

  return (
    <>
      <PageHero eyebrow="Get started" title="Create your account" />
      <section className="mx-auto max-w-md px-5 py-16">
        <AuthPanel mode="signup" next={next} />
      </section>
    </>
  );
}
