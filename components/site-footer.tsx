import Image from "next/image";
import Link from "next/link";
import { SHOW_VENDOR_DIRECTORY, SHOW_PLANNER_APP } from "@/lib/flags";
import InstallAppLink from "@/components/install-app-link";

// Existing account holders log in through the real auth screen once it exists.
const LOGIN_HREF = SHOW_PLANNER_APP ? "/auth/login" : "/login";

const COLUMNS = [
  {
    title: "Plan",
    links: [
      { label: "AI Planner", href: "/planner" },
      ...(SHOW_VENDOR_DIRECTORY
        ? [{ label: "Find Vendors", href: "/vendors" }]
        : []),
      { label: "Inspiration", href: "/inspiration" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "For vendors", href: "/for-vendors" },
      { label: "How it works", href: "/#how" },
      { label: "Log in", href: LOGIN_HREF },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Pricing", href: "/pricing" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

const SOCIAL = [
  { label: "Facebook", href: "https://www.facebook.com/bridalteam", d: "M13 22v-8h3l1-4h-4V8c0-1 .5-2 2-2h2V2.5C18 2.5 16.5 2 15 2c-3 0-5 1.8-5 5v3H7v4h3v8h3Z" },
  { label: "Instagram", href: "https://www.instagram.com/bridalteam", d: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5-2h.01M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z" },
  { label: "Pinterest", href: "https://www.pinterest.com/bridalteam", d: "M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.5 2.2-.8 3.4-.2 1 .5 1.8 1.5 1.8 1.8 0 3-2.3 3-5 0-2-1.4-3.5-3.9-3.5a4.5 4.5 0 0 0-4.7 4.5c0 .9.3 1.5.7 2 .2.2.2.3.1.5l-.2.9c-.1.3-.3.4-.6.2-1.2-.5-1.8-1.9-1.8-3.5 0-2.6 2.2-5.7 6.6-5.7 3.5 0 5.8 2.5 5.8 5.3 0 3.6-2 6.3-5 6.3-1 0-1.9-.5-2.2-1.1l-.6 2.4c-.2.8-.7 1.7-1 2.3A10 10 0 1 0 12 2Z" },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <Image
              src="/brand/logo.svg"
              alt="Bridal Team"
              width={180}
              height={49}
              unoptimized
              className="h-8 w-auto brightness-0 invert"
            />
            <p className="mt-3 text-xs leading-relaxed text-white/55">
              Fun, simple wedding planning — reimagined for today and powered by AI.
            </p>
            <div className="mt-4 flex gap-2.5">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-brand hover:bg-brand hover:text-white"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d={s.d} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns — a compact 3-across grid, even on mobile */}
          <div className="grid grid-cols-3 gap-6 sm:gap-10">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber">
                  {col.title}
                </h4>
                <ul className="mt-3 space-y-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-[13px] text-white/60 transition-colors hover:text-white"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-4 text-xs text-white/45 sm:flex-row">
          <p>© {year} Bridal Team. All rights reserved.</p>
          <nav className="flex flex-wrap justify-center gap-4">
            <Link href="/privacy" className="hover:text-white/80">Privacy</Link>
            <Link href="/terms" className="hover:text-white/80">Terms</Link>
            <Link href={LOGIN_HREF} className="hover:text-white/80">Log in</Link>
            <InstallAppLink className="hover:text-white/80" />
          </nav>
        </div>
      </div>
    </footer>
  );
}
