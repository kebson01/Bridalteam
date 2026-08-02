"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SHOW_PLANNER_APP } from "@/lib/flags";
import { supabaseBrowser } from "@/lib/supabase/browser";
import NotificationsBell from "@/components/notifications-bell";

// Primary nav — identical whether or not you're signed in, so the header
// doesn't reshuffle on login. Every destination is a public page (Community is
// now browsable signed-out). Auth-specific actions — Dashboard, account,
// log out — live in the right-hand cluster instead.
const NAV = [
  { label: "Community", href: "/community" },
  { label: "AI Planner", href: "/planner" },
  { label: "Inspiration", href: "/inspiration" },
  { label: "Design", href: "/spaces" },
  { label: "Find Vendors", href: "/vendors" },
  { label: "Guides", href: "/guides" },
  { label: "Pricing", href: "/pricing" },
];

// "Log in" is for people who already have an account, so once accounts exist it
// points at the real auth screen — never the pre-launch waitlist.
const LOGIN_HREF = SHOW_PLANNER_APP ? "/auth/login" : "/login";

type Viewer = { id: string; name: string; firstName: string; avatar: string; email: string };

function toViewer(user: {
  id?: string;
  email?: string;
  user_metadata?: { full_name?: string; avatar_url?: string };
} | null): Viewer | null {
  if (!user) return null;
  const email = user.email ?? "";
  const name = (user.user_metadata?.full_name ?? "").trim();
  const firstName = name.split(/\s+/)[0] || email.split("@")[0] || "there";
  return { id: user.id ?? "", name, firstName, avatar: user.user_metadata?.avatar_url ?? "", email };
}

/**
 * Tracks the signed-in viewer (name + avatar), so the header can greet them and
 * show "Dashboard / Log out" instead of "Log in / Start free". `signedIn` is
 * `null` until determined — we render the signed-out buttons until we know,
 * which is the common case.
 */
function useViewer() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);

  useEffect(() => {
    if (!SHOW_PLANNER_APP) {
      setSignedIn(false);
      return;
    }
    const supabase = supabaseBrowser();
    supabase.auth.getUser().then(({ data }) => {
      setSignedIn(!!data.user);
      setViewer(toViewer(data.user));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
      setViewer(toViewer(session?.user ?? null));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { signedIn, viewer };
}

/** Initials fallback for the avatar chip. */
function initialsOf(v: Viewer): string {
  const source = v.name || v.email.split("@")[0] || "";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const chars = parts.length >= 2 ? parts[0][0] + parts[1][0] : source.slice(0, 2);
  return chars.toUpperCase() || "?";
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { signedIn, viewer } = useViewer();

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
            unoptimized
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
                className="text-sm font-medium tracking-wide text-ink-soft transition-colors hover:text-brand-dark"
              >
                Dashboard
              </Link>
              {viewer && <NotificationsBell userId={viewer.id} />}
              <Link
                href="/account"
                className="group flex items-center gap-2 rounded-full border border-stone-2 py-1 pl-1 pr-3 transition-colors hover:border-brand"
                aria-label="Account settings"
              >
                {viewer?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={viewer.avatar}
                    alt=""
                    className="h-7 w-7 flex-none rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand/15 text-xs font-semibold text-brand-dark">
                    {viewer ? initialsOf(viewer) : ""}
                  </span>
                )}
                <span className="text-sm font-medium text-ink-soft transition-colors group-hover:text-brand-dark">
                  {viewer ? `Hi, ${viewer.firstName}` : "Account"}
                </span>
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

        {signedIn && viewer && (
          <div className="ml-auto mr-1 md:hidden">
            <NotificationsBell userId={viewer.id} />
          </div>
        )}
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
                <li>
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-stone-4"
                  >
                    {viewer?.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={viewer.avatar}
                        alt=""
                        className="h-9 w-9 flex-none rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand/15 text-sm font-semibold text-brand-dark">
                        {viewer ? initialsOf(viewer) : ""}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {viewer ? `Hi, ${viewer.firstName}` : "Account"}
                      </span>
                      <span className="block text-xs text-ink-soft/60">Account settings</span>
                    </span>
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
