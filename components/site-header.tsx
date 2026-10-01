"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  SHOW_PLANNER_APP,
  SHOW_COMMUNITY,
  SHOW_VENDOR_DIRECTORY,
} from "@/lib/flags";
import { SIGNUP_URL, LOGIN_URL } from "@/lib/config";
import { supabaseBrowser } from "@/lib/supabase/browser";
import NotificationsBell from "@/components/notifications-bell";

/**
 * Primary navigation. Identical whether or not you're signed in, so the header
 * doesn't reshuffle on login; auth-specific actions — Dashboard, account, log
 * out — live in the right-hand cluster instead.
 *
 * Community and Find Vendors are gated, and the gate is the point: both pages
 * render an honest empty state today, so a tab for either one spends a
 * visitor's first click telling them nobody else is here. The footer already
 * hid Find Vendors behind this flag while the header advertised it, which is
 * how the two ended up disagreeing about whether the directory was ready —
 * both now read the same flags, so they cannot drift apart again.
 *
 * Neither page is removed or blocked. Someone who follows a direct link, or a
 * vendor checking their own listing, still gets there.
 */
const NAV = [
  ...(SHOW_COMMUNITY ? [{ label: "Community", href: "/community" }] : []),
  { label: "AI Planner", href: "/planner" },
  { label: "Inspiration", href: "/inspiration" },
  ...(SHOW_VENDOR_DIRECTORY ? [{ label: "Find Vendors", href: "/vendors" }] : []),
  { label: "Guides", href: "/guides" },
  { label: "Pricing", href: "/pricing" },
];

type Viewer = { id: string; name: string; firstName: string; avatar: string; email: string };

/**
 * Which homes this viewer actually has.
 *
 * Both pages already handle the dual-role case — someone planning their own
 * wedding while listing their business. /dashboard asks for a couple or
 * planner_company org specifically and /vendor asks for a vendor org, each
 * with a comment explaining that reading "whichever org_members row comes
 * back first" sent such a user to the wrong home on row order.
 *
 * The navigation never got the same treatment. It offered one link,
 * "Dashboard", and /dashboard redirects a vendor-ONLY user on to /vendor — so
 * single-role vendors reached their listing by accident of that redirect,
 * and a dual-role vendor had no link to it at all. Their only route was a
 * button on /account that said "Manage billing".
 *
 * `null` means not determined yet (or the lookup failed). Everything below
 * treats that as "just show Dashboard", which is exactly today's behaviour —
 * so a failed lookup degrades to the status quo rather than hiding a link
 * someone needs.
 */
type Roles = { vendor: boolean; couple: boolean } | null;

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
  const [roles, setRoles] = useState<Roles>(null);

  useEffect(() => {
    if (!SHOW_PLANNER_APP) {
      setSignedIn(false);
      return;
    }
    const supabase = supabaseBrowser();

    // RLS ("Members read their org") already scopes this to orgs the caller
    // belongs to, so no filter is needed and none should be added — a client
    // filter here would be decoration, not access control.
    async function loadRoles() {
      try {
        const { data, error } = await supabase.from("organizations").select("type");
        if (error) throw new Error(`${error.code}: ${error.message}`);
        const types = (data ?? []).map((o: { type: string | null }) => o.type);
        setRoles({
          vendor: types.includes("vendor"),
          couple: types.some((t) => t === "couple" || t === "planner_company"),
        });
      } catch (err) {
        // Leave roles null: the header falls back to the single Dashboard
        // link, which is what it has always shown.
        console.error("header: could not resolve viewer roles:", err);
        setRoles(null);
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      setSignedIn(!!data.user);
      setViewer(toViewer(data.user));
      if (data.user) void loadRoles();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
      setViewer(toViewer(session?.user ?? null));
      // Roles belong to the account, so they have to be re-resolved on a
      // switch and cleared on sign-out — otherwise the previous user's
      // "Vendor account" link survives into the next session.
      if (session) void loadRoles();
      else setRoles(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { signedIn, viewer, roles };
}

/**
 * The signed-in destinations to offer, in order.
 *
 * A vendor-only viewer gets "Vendor account" rather than "Dashboard": the
 * destination is the same either way thanks to the /dashboard redirect, but
 * the label stops describing a page they never see. A dual-role viewer gets
 * both, which is the whole point of this function.
 */
export function homeLinks(roles: Roles): Array<{ label: string; href: string }> {
  const DASHBOARD = { label: "Dashboard", href: "/dashboard" };
  const VENDOR = { label: "Vendor account", href: "/vendor" };
  if (!roles) return [DASHBOARD];
  if (roles.vendor && roles.couple) return [DASHBOARD, VENDOR];
  if (roles.vendor) return [VENDOR];
  return [DASHBOARD];
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
  const { signedIn, viewer, roles } = useViewer();
  const homes = homeLinks(roles);

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
              className="text-sm font-medium tracking-wide text-ink-soft transition-colors hover:text-brand-text"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {signedIn ? (
            <>
              {homes.map((home) => (
                <Link
                  key={home.href}
                  href={home.href}
                  className="text-sm font-medium tracking-wide text-ink-soft transition-colors hover:text-brand-text"
                >
                  {home.label}
                </Link>
              ))}
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
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand/15 text-xs font-semibold text-brand-text">
                    {viewer ? initialsOf(viewer) : ""}
                  </span>
                )}
                <span className="text-sm font-medium text-ink-soft transition-colors group-hover:text-brand-text">
                  {viewer ? `Hi, ${viewer.firstName}` : "Account"}
                </span>
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-stone-2 px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-text"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href={LOGIN_URL}
                className="text-sm font-medium text-ink-soft transition-colors hover:text-brand-text"
              >
                Log in
              </Link>
              <Link
                href={SIGNUP_URL}
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
                {homes.map((home) => (
                  <li key={home.href}>
                    <Link
                      href={home.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-stone-4"
                    >
                      {home.label}
                    </Link>
                  </li>
                ))}
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
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand/15 text-sm font-semibold text-brand-text">
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
                    href={LOGIN_URL}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-stone-4"
                  >
                    Log in
                  </Link>
                </li>
                <li className="pt-2">
                  <Link
                    href={SIGNUP_URL}
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
