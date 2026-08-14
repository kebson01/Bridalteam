import Image from "next/image";
import Link from "next/link";
import { SHOW_VENDOR_DIRECTORY, SHOW_PLANNER_APP } from "@/lib/flags";
import InstallAppLink from "@/components/install-app-link";

// Existing account holders log in through the real auth screen once it exists.
const LOGIN_HREF = SHOW_PLANNER_APP ? "/auth/login" : "/login";

// One flat, wrapping row of links — no more three-column tower.
const LINKS = [
  { label: "How it works", href: "/#how" },
  { label: "AI Planner", href: "/planner" },
  ...(SHOW_VENDOR_DIRECTORY ? [{ label: "Find Vendors", href: "/vendors" }] : []),
  { label: "Inspiration", href: "/inspiration" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Log in", href: LOGIN_HREF },
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
      <div className="mx-auto max-w-6xl px-5 py-7">
        <div className="flex items-center justify-between gap-4">
          <Image
            src="/brand/logo.svg"
            alt="Bridal Team"
            width={180}
            height={49}
            unoptimized
            className="h-7 w-auto brightness-0 invert"
          />
          <div className="flex gap-2">
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-brand hover:bg-brand hover:text-white"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d={s.d} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <nav className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-[13px] text-white/60 transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          <InstallAppLink className="text-[13px] text-white/60 transition-colors hover:text-white" />
        </nav>

        <p className="mt-5 border-t border-white/10 pt-4 text-xs text-white/40">
          © {year} Bridal Team. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
