import Link from "next/link";
import JsonLd from "@/components/json-ld";
import CopyField from "@/components/copy-field";
import { breadcrumbSchema, faqSchema } from "@/lib/structured-data";
import { pageMetadata, SITE_URL } from "@/lib/site";
import { SIGNUP_URL } from "@/lib/config";
import { MCP_RESOURCE_PATH } from "@/lib/oauth/core";

/**
 * Public page telling couples they can plan with the AI they already use:
 * Bridal Team is an MCP server (lib/mcp), so ChatGPT, Claude and other MCP
 * clients can connect to it.
 *
 * Two ways in, and the page must keep them straight:
 *  - Signed in (OAuth): /api/mcp/site. The couple approves one wedding on
 *    /oauth/authorize, and the assistant can then read and change that
 *    wedding (lib/mcp/planner-tools.ts, lib/mcp/site-tools.ts).
 *  - No account: /api/mcp, read-only public tools (lib/mcp/tools.ts).
 *  Both need MCP_ENABLED=true (lib/flags.ts); both were live when this page
 *  was written. If that flag is ever turned off, take this page down too.
 *
 * Every claim here is something those tools actually do. Keep it that way.
 */

export const metadata = pageMetadata({
  path: "/connect-your-ai",
  title: "Plan Your Wedding with ChatGPT or Claude",
  ogTitle: "Connect ChatGPT or Claude to Bridal Team",
  description:
    "Connect ChatGPT, Claude or any MCP assistant to your Bridal Team wedding. Ask it to build your checklist, budget, guest list and seating, in your own words.",
});

const PLANNER_URL = `${SITE_URL}${MCP_RESOURCE_PATH}`;
const PUBLIC_URL = `${SITE_URL}/api/mcp`;

const CAN_DO: Array<[string, string]> = [
  ["Checklist", "Build a dated starter checklist, add and update tasks, and tick them off."],
  ["Budget", "Set up a starter budget and add or change line items, in dollars."],
  ["Guests & RSVPs", "Add households, update details, and record RSVPs and meal choices."],
  ["Seating & floor plans", "Seat guests at tables and save venue layouts."],
  ["Vendors, travel & registry", "Keep your vendor list, travel details and registry links up to date."],
  ["Your wedding website", "Draft, design and publish your guest website."],
];

const PROMPTS = [
  "Look at my Bridal Team wedding and tell me what I should do this month.",
  "Add my aunt Linda's family, 4 guests, to the guest list.",
  "Make a starter budget for $35,000 and show me where it goes.",
  "Seat the Johnson family at table 6.",
  "Mark the florist deposit as done and add a task to confirm the final count by May 1.",
];

const FAQS = [
  {
    q: "Which assistants work?",
    a: "Any assistant that supports custom connectors, also called MCP servers or apps. That includes ChatGPT and Claude. Custom connectors may depend on your plan with them; look for \"connectors\" in the assistant's settings.",
  },
  {
    q: "Is it safe? What can the assistant see?",
    a: "Only the one wedding you approve, and only after you log in to Bridal Team and click Allow. It can't see your password or other weddings. Assistants are told to check with you before deleting anything or recording an RSVP, and deleted checklist tasks can be restored.",
  },
  {
    q: "How do I disconnect it?",
    a: "Open your wedding, go to Website, then Design, then Your own AI, and remove the connection. It stops working right away.",
  },
  {
    q: "Does it cost anything?",
    a: "Connecting is free with a Bridal Team account. Your assistant's own plan is separate.",
  },
];

export default function ConnectYourAiPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Connect your AI", path: "/connect-your-ai" },
        ])}
      />
      <JsonLd data={faqSchema(FAQS)} />

      <section className="mx-auto max-w-4xl px-5 pb-16 pt-10 sm:pt-14">
        <header className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-wash px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text">
            ✦ Works with ChatGPT &amp; Claude
          </span>
          <h1 className="mt-4 text-4xl font-medium leading-tight text-ink sm:text-5xl">
            Plan with the AI <span className="text-brand-text">you already use</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft/80">
            Connect your favorite assistant to your Bridal Team wedding. Ask in your own words, and it updates your
            checklist, budget, guest list and seating for you.
          </p>
        </header>

        {/* How to connect */}
        <div className="mt-10 rounded-3xl border border-stone-2 bg-gradient-to-br from-white to-brand-wash/70 p-6 shadow-card sm:p-8">
          <h2 className="text-2xl font-medium text-ink">Connect in three steps</h2>
          <ol className="mt-5 space-y-4">
            {[
              [
                "Add a custom connector",
                "In ChatGPT or Claude, open settings and add a custom connector (it may be called a custom MCP server or app).",
              ],
              ["Paste this URL and choose OAuth sign-in", "Use the connector URL below. When it asks how to sign in, pick OAuth."],
              [
                "Log in and click Allow",
                "Your assistant opens a Bridal Team page. Log in, choose your wedding and click Allow. That's it.",
              ],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-deep font-display text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-ink">{title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink-soft/80">{body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6">
            <CopyField label="Connector URL" value={PLANNER_URL} />
          </div>
          <p className="mt-4 text-sm text-ink-soft/80">
            New to Bridal Team?{" "}
            <Link href={SIGNUP_URL} className="font-semibold text-brand-text hover:text-brand-deep">
              Create your free account
            </Link>{" "}
            and add your wedding first.
          </p>
        </div>

        {/* What it can do */}
        <section className="mt-14">
          <h2 className="text-2xl font-medium text-ink sm:text-3xl">What your assistant can do</h2>
          <p className="mt-1 text-sm text-ink-soft/70">Everything you can do on Bridal Team, by asking.</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {CAN_DO.map(([title, body]) => (
              <li key={title} className="rounded-2xl border border-stone-2 bg-white p-5 shadow-sm">
                <h3 className="font-medium text-ink">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft/80">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Things to ask */}
        <section className="mt-14">
          <h2 className="text-2xl font-medium text-ink sm:text-3xl">Things to ask</h2>
          <ul className="mt-5 space-y-2">
            {PROMPTS.map((p) => (
              <li key={p} className="flex gap-3 rounded-2xl bg-brand-wash/60 px-4 py-3 text-sm text-ink">
                <span aria-hidden className="text-brand">✦</span>
                <span>&ldquo;{p}&rdquo;</span>
              </li>
            ))}
          </ul>
        </section>

        {/* No account */}
        <section className="mt-14 rounded-3xl border border-stone-2 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-medium text-ink">Just looking? No account needed</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft/80">
            Connect this URL instead, with no sign-in, and your assistant can search Florida wedding vendors, split a
            budget, work out how many tables you need, build a dated checklist and read our planning guides. It
            can&apos;t see or change anything of yours.
          </p>
          <div className="mt-4">
            <CopyField label="Public connector URL" value={PUBLIC_URL} />
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-14">
          <h2 className="text-2xl font-medium text-ink sm:text-3xl">Questions</h2>
          <div className="mt-4 space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-stone-2 bg-white px-5 py-4 open:shadow-card">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink">
                  {f.q}
                  <span aria-hidden className="text-lg leading-none text-ink-soft/50 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft/85">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-12 text-center">
          <p className="text-ink-soft/70">Rather not set anything up?</p>
          <Link
            href="/planner"
            className="mt-3 inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-7 py-3 text-sm font-semibold text-white"
          >
            ✦ Use the Bridal Team AI planner
          </Link>
        </div>
      </section>
    </>
  );
}
