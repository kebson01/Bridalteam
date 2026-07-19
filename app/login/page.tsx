import type { Metadata } from "next";
import PageHero from "@/components/page-hero";
import AuthForm from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to your Bridal Team account.",
};

export default function LoginPage() {
  return (
    <>
      <PageHero eyebrow="Welcome back" title="Log in" />
      <section className="mx-auto max-w-md px-5 py-16">
        <AuthForm mode="login" />
      </section>
    </>
  );
}
