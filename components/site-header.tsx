"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const NAV = [
  { label: "How it works", href: "#how" },
  { label: "AI Planner", href: "#planner" },
  { label: "Find Vendors", href: "#vendors" },
  { label: "Inspiration", href: "#inspiration" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

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

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium tracking-wide text-ink-soft transition-colors hover:text-brand-dark"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href="#planner"
            className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(243,103,5,0.7)] transition-transform hover:-translate-y-0.5"
          >
            Start free
          </a>
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
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-stone-4"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <a
                href="#planner"
                onClick={() => setOpen(false)}
                className="block rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-3 text-center text-sm font-semibold text-white"
              >
                Start free
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
