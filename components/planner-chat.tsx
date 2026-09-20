"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/events";
import { readDraft, saveDraft, type DraftMessage } from "@/lib/planner-draft";

type Role = "user" | "assistant";
interface Msg {
  role: Role;
  content: string;
}

const STARTER: Msg = {
  role: "assistant",
  content:
    "Hi! I'm your Bridal Team planning assistant. Tell me about your wedding — a date, a city, a guest count, a vibe — and I'll help with timelines, budgets, checklists and vendor ideas. What are we planning?",
};

/**
 * Escapes the five HTML-significant characters.
 *
 * This has to run BEFORE the markdown-ish replacements below, which
 * deliberately insert real tags — escaping afterwards would neuter those too.
 * Ordering within the function matters as well: `&` first, or the entities the
 * later replacements produce get double-escaped into visible `&amp;lt;`.
 *
 * Neither `*` nor `#` is HTML-significant, so escaping first leaves the
 * markdown syntax intact and the capture groups carry already-escaped text.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Very small markdown-ish renderer (headings, bold, bullets) — no deps.
 *
 * The output goes through dangerouslySetInnerHTML, so everything that is not
 * one of the three tags below has to arrive as text. Before escapeHtml() was
 * added, a model reply went in raw: ask the planner to echo
 * `<img src=x onerror=…>` and it rendered as a live element, and because the
 * CSP carries `script-src 'unsafe-inline'` the handler would run.
 *
 * That comment used to say the transcript "is never persisted and never
 * shared", and warned that persisting it would stop the problem being
 * self-inflicted. It is now persisted — lib/planner-draft.ts keeps it in
 * sessionStorage so it survives the walk to /auth/signup — so the warning has
 * been cashed in and is worth restating precisely rather than deleting.
 *
 * It is still self-XSS, for two reasons that both have to hold. sessionStorage
 * is per-tab and same-origin, so no second person ever reads that transcript;
 * and escapeHtml() below neutralises the payload on the way to the DOM
 * regardless of where the text came from. readDraft() additionally drops any
 * entry that is not {role, content} with a string body, because storage is
 * writable by the visitor's own extensions and this value gets rendered.
 *
 * What would break it: showing a transcript to a partner, restoring one across
 * accounts, or rendering it anywhere that does not go through escapeHtml().
 * Any of those turns this into a real XSS, silently.
 */
export function renderMessage(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const bolded = escapeHtml(line)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/^#{1,3}\s*(.+)$/, '<span class="font-semibold text-ink">$1</span>');
    const isBullet = /^\s*[-*•]\s+/.test(line);
    if (isBullet) {
      return (
        <li
          key={i}
          className="ml-4 list-disc marker:text-brand-text"
          dangerouslySetInnerHTML={{ __html: bolded.replace(/^\s*[-*•]\s+/, "") }}
        />
      );
    }
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return <p key={i} dangerouslySetInnerHTML={{ __html: bolded }} />;
  });
}

export default function PlannerChat({
  quickPrompts = [],
  heightClass = "h-[26rem]",
}: {
  quickPrompts?: string[];
  heightClass?: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([STARTER]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoNotice, setDemoNotice] = useState(false);
  /**
   * Set once the quota is spent. The API used to say "Sign up free" in bold
   * markdown and nothing rendered it as a link, so the one moment a visitor is
   * most interested — they just tried to ask another question and were stopped
   * — was a dead end with nothing to click.
   */
  const [cta, setCta] = useState<"signup" | "upgrade" | null>(null);
  /** The caller's own tier, learned from the first reply. Only "anon" is nudged. */
  const [tier, setTier] = useState<string | null>(null);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restored in an effect rather than as lazy initial state: this component is
  // still server-rendered, and reading sessionStorage during render would
  // either throw there or hand the client different markup than the server
  // produced. Same reason AttributionCapture does its work in an effect.
  useEffect(() => {
    const draft = readDraft();
    if (draft?.length) setMessages([STARTER, ...(draft as Msg[])]);
  }, []);

  // Persist on every change. The conversation has to survive the navigation to
  // /auth/signup -- losing it there means someone clicked the CTA, handed over
  // an email, and came back to an empty box, which is the worst possible
  // moment to throw their work away. The opener is dropped: it is canned, and
  // restoring it twice would show it twice.
  useEffect(() => {
    const body = messages.filter((m) => m !== STARTER) as DraftMessage[];
    if (body.length) saveDraft(body);
  }, [messages]);

  // Answers given so far, not counting the canned opener.
  const answers = messages.filter((m) => m.role === "assistant").length - 1;
  // One gentle offer after the second answer — they have seen it work by then,
  // and it lands before the wall rather than at it.
  const showNudge = tier === "anon" && !cta && !nudgeDismissed && answers >= 2;

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const nextMessages = [...messages, { role: "user" as Role, content }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      // Counted on a successful reply rather than on submit, so a dropped
      // request is not recorded as someone engaging with the planner.
      track("planner_message");
      setDemoNotice(Boolean(data.demo));
      if (data.limited) {
        // The conversion moment: they asked one more question and were stopped.
        // Fires at most once a session -- the CTA replaces the input.
        track("planner_limit");
        setCta(data.cta === "upgrade" ? "upgrade" : "signup");
      }
      if (typeof data.tier === "string") setTier(data.tier);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply ?? "Sorry, I hit a snag. Try again?" },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "I couldn't reach the planning service just now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  }

  return (
    <div className="w-full">
      {quickPrompts.length > 0 && (
        <ul className="mb-4 flex flex-wrap gap-2">
          {quickPrompts.map((q) => (
            <li key={q}>
              <button
                onClick={() => send(q)}
                disabled={loading}
                className="rounded-full border border-stone-2 bg-white px-4 py-2 text-sm text-ink-soft transition-colors hover:border-brand hover:text-brand-text disabled:opacity-50"
              >
                {q}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-3xl border border-stone-2 bg-white p-3 shadow-card">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-brand" />
          <span className="h-2.5 w-2.5 rounded-full bg-brand-amber" />
          <span className="h-2.5 w-2.5 rounded-full bg-stone-5" />
          <span className="ml-2 text-xs font-medium text-stone-1">
            Bridal Team · AI Planner
          </span>
        </div>

        <div
          ref={scrollRef}
          className={`${heightClass} space-y-4 overflow-y-auto rounded-2xl bg-stone-4 p-4`}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-sm bg-gradient-to-r from-brand to-brand-dark px-4 py-2.5 text-sm text-white"
                    : "max-w-[90%] space-y-1 rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm leading-relaxed text-ink-soft shadow-sm"
                }
              >
                {m.role === "assistant" ? renderMessage(m.content) : m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm">
                <span className="h-2 w-2 animate-pulse-dot rounded-full bg-brand-dark" />
                <span className="h-2 w-2 animate-pulse-dot rounded-full bg-brand-dark [animation-delay:0.2s]" />
                <span className="h-2 w-2 animate-pulse-dot rounded-full bg-brand-dark [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/*
          The offer, one answer before the wall. Dismissible, shown once, and
          only to anonymous visitors — a signed-in couple already has all of
          this and would just be nagged.
        */}
        {showNudge && (
          <div className="mt-3 flex items-start gap-3 rounded-2xl border border-brand/30 bg-brand-wash/60 px-4 py-3">
            <p className="flex-1 text-sm leading-relaxed text-ink-soft">
              Like where this is going?{" "}
              <Link href="/auth/signup" className="font-semibold text-brand-text underline">
                Create a free account
              </Link>{" "}
              and we&rsquo;ll keep this conversation, plus your checklist, budget and
              guest list.
            </p>
            <button
              type="button"
              onClick={() => setNudgeDismissed(true)}
              aria-label="Dismiss"
              className="-mr-1 shrink-0 rounded-full px-2 py-0.5 text-lg leading-none text-ink-soft/50 transition-colors hover:text-ink-soft"
            >
              &times;
            </button>
          </div>
        )}

        {/*
          The wall itself. Replaces the input rather than sitting beside it:
          leaving a live box there invites another question that can only
          produce the same refusal.

          Links go to /auth/signup, not the shorter /signup: that path is a
          legacy waitlist page that only redirects to the real screen while
          SIGNUPS_OPEN is true, and a conversion button is the last place
          that should quietly become a waitlist form.
        */}
        {cta ? (
          <div className="mt-3 rounded-2xl border border-brand/40 bg-brand-wash px-5 py-4 text-center">
            <p className="text-sm font-semibold text-ink">
              {cta === "signup"
                ? "That\u2019s the end of the demo"
                : "You\u2019ve used your AI chats for now"}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
              {cta === "signup"
                ? "Create a free account to keep planning \u2014 your conversation, checklist, budget and guest list all get saved, and you can invite your partner."
                : "Upgrade for more AI help, or come back a little later."}
            </p>
            <Link
              href={cta === "signup" ? "/auth/signup" : "/pricing"}
              className="mt-3 inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              {cta === "signup" ? "Create my free account" : "See plans"}
            </Link>
            {cta === "signup" && (
              <p className="mt-2 text-xs text-ink-soft/70">
                Free, no card needed.{" "}
                <Link href="/auth/login" className="underline">
                  Already have an account?
                </Link>
              </p>
            )}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="mt-3 flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your wedding…"
              className="flex-1 rounded-full border border-stone-2 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        )}

        {demoNotice && (
          <p className="px-3 pb-1 pt-2 text-center text-[11px] text-stone-1">
            Demo mode — add an <code>ANTHROPIC_API_KEY</code> to power replies with
            live Claude AI.
          </p>
        )}
      </div>
    </div>
  );
}
