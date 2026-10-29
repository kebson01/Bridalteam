import type { Metadata } from "next";
import PageHero from "@/components/page-hero";
import ResetPasswordPanel from "@/components/auth/reset-password-panel";

export const metadata: Metadata = {
  title: "Set a New Password",
  description: "Choose a new password for your Bridal Team account.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <>
      <PageHero eyebrow="Account help" title="Set a new password" />
      <section className="mx-auto max-w-md px-5 py-16">
        <ResetPasswordPanel />
      </section>
    </>
  );
}
