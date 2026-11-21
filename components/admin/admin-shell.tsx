"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Icon, btn, field, type IconName } from "@/components/admin/ui";

/**
 * The admin app around every /admin page: one sign-in for all of them, a top
 * bar, and a sidebar to every section. Pages render only their own content.
 *
 * Signing in sets the httpOnly admin session cookie (/api/admin/login); every
 * admin API checks it server-side (lib/admin-auth.ts adminGuard), so this
 * screen is only the front door, not the lock. A page whose request comes back
 * 401 calls useAdmin().expired() to bring the sign-in card back.
 */

type NavItem = { href: string; label: string; icon: IconName };
const NAV: { title: string; items: NavItem[] }[] = [
  { title: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: "home" }] },
  {
    title: "Vendors",
    items: [
      { href: "/admin/leads", label: "Vendor leads", icon: "inbox" },
      { href: "/admin/claims", label: "Claims by phone", icon: "key" },
      { href: "/admin/promotions", label: "Promotions", icon: "tag" },
      { href: "/admin/vendor-sites", label: "Vendor websites", icon: "globe" },
    ],
  },
  {
    title: "Couples",
    items: [
      { href: "/admin/sites", label: "Guest websites", icon: "sites" },
      { href: "/admin/venues", label: "Venues", icon: "building" },
    ],
  },
  { title: "Insights", items: [{ href: "/admin/analytics", label: "Analytics", icon: "chart" }] },
];

type Status = "checking" | "signed-out" | "signed-in";
const AdminContext = createContext<{ username: string; expired: () => void }>({ username: "", expired: () => {} });

/** For admin pages: who is signed in, and a way to say the session ran out (a 401). */
export function useAdmin() {
  return useContext(AdminContext);
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/admin";
  const [status, setStatus] = useState<Status>("checking");
  const [username, setUsername] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const check = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/session", { cache: "no-store" });
      if (!res.ok) {
        setStatus("signed-out");
        return;
      }
      const json = await res.json().catch(() => ({}));
      setUsername(typeof json.username === "string" ? json.username : "");
      setStatus("signed-in");
    } catch {
      setStatus("signed-out");
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  // Close the phone menu after navigating.
  useEffect(() => setMenuOpen(false), [pathname]);

  async function lock() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Clear the screen regardless; the cookie expires on its own.
    }
    setStatus("signed-out");
    setUsername("");
  }

  if (status === "checking") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-stone-4/60">
        <p className="text-sm text-ink-soft/60">Loading admin…</p>
      </div>
    );
  }
  if (status === "signed-out") return <SignIn onSignedIn={check} />;

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));

  const nav = (
    <nav aria-label="Admin sections" className="space-y-6">
      {NAV.map((group) => (
        <div key={group.title}>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft/45">{group.title}</p>
          <ul className="mt-2 space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                      active ? "bg-ink font-semibold text-white" : "font-medium text-ink-soft/80 hover:bg-white hover:text-ink"
                    }`}
                  >
                    <Icon name={item.icon} className={`size-[18px] flex-none ${active ? "text-white" : "text-brand-text"}`} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <AdminContext.Provider value={{ username, expired: () => setStatus("signed-out") }}>
      <div className="min-h-screen bg-stone-4/60">
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b border-stone-2 bg-white/95 backdrop-blur-md print:hidden">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-controls="admin-sidebar"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                className="rounded-full p-2 text-ink-soft hover:bg-stone-4 lg:hidden"
              >
                <Icon name={menuOpen ? "close" : "menu"} className="size-5" />
              </button>
              <Link href="/admin" className="flex items-center gap-3" aria-label="Admin dashboard">
                <Image src="/brand/logo.svg" alt="Bridal Team" width={168} height={46} unoptimized className="h-8 w-auto" />
              </Link>
              <span className="hidden items-center gap-2 rounded-full border border-brand/25 bg-brand-wash px-3 py-1 text-xs font-semibold text-brand-text sm:inline-flex">
                <span className="size-2 rounded-full bg-brand" />
                Admin
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {username && <span className="hidden text-xs text-ink-soft/60 md:inline">Signed in as {username}</span>}
              <a href="/" target="_blank" rel="noreferrer" className={`${btn.secondary} hidden px-3.5 py-2 sm:inline-flex`}>
                <Icon name="external" className="size-4 text-ink-soft/60" />
                View site
              </a>
              <button type="button" onClick={lock} className={`${btn.secondary} px-3.5 py-2`}>
                <Icon name="lock" className="size-4 text-ink-soft/60" />
                Lock
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto flex max-w-[1440px]">
          {/* Sidebar: fixed column on large screens, a drop-down panel on phones */}
          <aside
            id="admin-sidebar"
            className={`${menuOpen ? "block" : "hidden"} fixed inset-x-0 top-16 z-30 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-stone-2 bg-stone-4 px-4 py-5 shadow-card lg:sticky lg:block lg:h-[calc(100vh-4rem)] lg:w-60 lg:flex-none lg:border-b-0 lg:border-r lg:bg-transparent lg:px-3 lg:py-8 lg:shadow-none`}
          >
            {nav}
          </aside>
          <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">{children}</main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}

function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Couldn't sign in.");
        return;
      }
      setPassword("");
      onSignedIn();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-stone-4/60 px-4 py-20 sm:px-5">
      <div className="mx-auto max-w-md rounded-3xl border border-stone-2 bg-white p-8 shadow-card">
        <Image src="/brand/logo.svg" alt="Bridal Team" width={168} height={46} unoptimized className="h-9 w-auto" />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-text">Platform administration</p>
        <h1 className="mt-1.5 font-display text-3xl font-medium text-ink">Admin sign-in</h1>
        <p className="mt-2 text-sm text-ink-soft/70">Enter the admin username and password to continue.</p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            aria-label="Username"
            className={field}
          />
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            aria-label="Password"
            className={field}
          />
          <button type="submit" disabled={busy} className={`${btn.primary} w-full`}>
            {busy ? "One moment…" : "Sign in"}
          </button>
        </form>
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        <p className="mt-6 text-xs text-ink-soft/50">
          Set <code>ADMIN_USERNAME</code>, <code>ADMIN_PASSWORD</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code> in your server
          environment to enable admin.
        </p>
      </div>
    </div>
  );
}
