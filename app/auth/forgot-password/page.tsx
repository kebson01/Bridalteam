import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHero from "@/components/page-hero";
import ForgotPasswordPanel from "@/components/auth/forgot-password-panel";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset the password for your Bridal Team account.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  if (!SHOW_PLANNER_APP) notFound();

  return (
    <>
      <PageHero eyebrow="Account help" title="Forgot your password?" />
      <section className="mx-auto max-w-md px-5 py-16">
        <ForgotPasswordPanel />
      </section>
    </>
  );
}
