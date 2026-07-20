import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHero from "@/components/page-hero";
import AuthPanel from "@/components/auth/auth-panel";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Log In",
  description: "Sign in to your Bridal Team planner.",
  robots: { index: false, follow: false },
};

export default async function AuthLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (!SHOW_PLANNER_APP) notFound();
  const { next } = await searchParams;

  return (
    <>
      <PageHero eyebrow="Welcome back" title="Log in" />
      <section className="mx-auto max-w-md px-5 py-16">
        <AuthPanel mode="login" next={next} />
      </section>
    </>
  );
}
