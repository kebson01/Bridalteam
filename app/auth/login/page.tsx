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

const ERROR_COPY: Record<string, string> = {
  expired:
    "That link has expired or was already used. Log in below — or request a fresh link if you still need it.",
  missing_code: "That link didn't work. Try logging in below, or request a new link.",
  invalid_code: "That link didn't work. Try logging in below, or request a new link.",
  unavailable: "We couldn't check your session just now. Please log in again.",
};

export default async function AuthLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  if (!SHOW_PLANNER_APP) notFound();
  const { next, error } = await searchParams;
  const notice = error ? ERROR_COPY[error] : undefined;

  return (
    <>
      <PageHero eyebrow="Welcome back" title="Log in" />
      <section className="mx-auto max-w-md px-5 py-16">
        {notice && (
          <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{notice}</p>
        )}
        <AuthPanel mode="login" next={next} />
      </section>
    </>
  );
}
