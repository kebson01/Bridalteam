import type { Metadata } from "next";
import PageHero from "@/components/page-hero";
import AuthPanel from "@/components/auth/auth-panel";

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
