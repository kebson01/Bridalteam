"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SHOW_PLANNER_APP } from "@/lib/flags";
import { supabaseBrowser } from "@/lib/supabase/browser";

const NAV = [
  { label: "How it works", href: "/#how" },
  { label: "AI Planner", href: "/planner" },
  { label: "Find Vendors", href: "/vendors" },
  { label: "Inspiration", href: "/inspiration" },
  { label: "Pricing", href: "/pricing" },
];

// "Log in" is for people who already have an account, so once accounts exist it
// points at the real auth screen — never the pre-launch waitlist.
const LOGIN_HREF = SHOW_PLANNER_APP ? "/auth/login" : "/login";

/**
 * Tracks whether someone is signed in, so the header can show "Dashboard /
 * Log out" instead of "Log in / Start free". `null` means not yet determined —
 * we render the signed-out buttons until we know, which is the common case.
 */
function useSignedIn() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!SHOW_PLANNER_APP) {
      setSignedIn(false);
      return;
    }
    const supabase = supabaseBrowser();
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(!!session),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return signedIn;
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const signedIn = useSignedIn();

  async function logout() {
    await supabaseBrowser().auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-stone-2/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
        <Link href="/" className="flex items-center" aria-label="Bridal Team home">
          <Image
            src="/brand/logo.svg"
            alt="Bridal Team"
            width={168}
            height={46}
            priority
            className="h-9 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium tracking-wide text-ink-soft transition-colors hover:text-brand-dark"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {signedIn ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-ink-soft transition-colors hover:text-brand-dark"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-stone-2 px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-dark"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href={LOGIN_HREF}
                className="text-sm font-medium text-ink-soft transition-colors hover:text-brand-dark"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(243,103,5,0.7)] transition-transform hover:-translate-y-0.5"
              >
                Start free
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-ink md:hidden"
        >
          <svg width="22" height="16" viewBox="0 0 23 15.3" fill="currentColor">
            <path d="M0,0h23v2.6H0V0 M0,6.4h23v2.6H0V6.4 M0,12.8h23v2.6H0V12.8z" />
          </svg>
        </button>
      </div>

      {open && (
        <nav className="border-t border-stone-2 bg-white px-5 py-4 md:hidden">
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-stone-4"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {signedIn ? (
              <>
                <li>
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-stone-4"
                  >
                    Dashboard
                  </Link>
                </li>
                <li className="pt-2">
                  <button
                    type="button"
                    onClick={logout}
                    className="block w-full rounded-full border border-stone-2 px-5 py-3 text-center text-sm font-semibold text-ink-soft"
                  >
                    Log out
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    href={LOGIN_HREF}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-stone-4"
                  >
                    Log in
                  </Link>
                </li>
                <li className="pt-2">
                  <Link
                    href="/signup"
                    onClick={() => setOpen(false)}
                    className="block rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-3 text-center text-sm font-semibold text-white"
                  >
                    Start free
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
