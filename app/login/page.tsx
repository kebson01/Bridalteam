import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PageHero from "@/components/page-hero";
import AuthForm from "@/components/auth-form";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to your Bridal Team account.",
};

export default function LoginPage() {
  // Once real accounts exist this legacy path just forwards to the auth screen,
  // so there is a single login rather than this and /auth/login side by side.
  if (SHOW_PLANNER_APP) redirect("/auth/login");

  return (
    <>
      <PageHero eyebrow="Welcome back" title="Log in" />
      <section className="mx-auto max-w-md px-5 py-16">
        <AuthForm mode="login" />
      </section>
    </>
  );
}
