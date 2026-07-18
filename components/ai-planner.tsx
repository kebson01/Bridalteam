"use client";

import { useRef, useState } from "react";

type Role = "user" | "assistant";
interface Msg {
  role: Role;
  content: string;
}

const QUICK_PROMPTS = [
  "Build me a 12-month planning timeline",
  "Estimate a budget for 120 guests in Austin",
  "What vendors should I book first?",
  "Ideas for a rustic autumn vibe",
];

const STARTER: Msg = {
  role: "assistant",
  content:
    "Hi! I'm your Bridal Team planning assistant. Tell me about your wedding — a date, a city, a guest count, a vibe — and I'll help with timelines, budgets, checklists and vendor ideas. What are we planning?",
};

// Very small markdown-ish renderer (headings, bold, bullets) — no deps.
function render(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const bolded = line
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/^#{1,3}\s*(.+)$/, '<span class="font-semibold text-ink">$1</span>');
    const isBullet = /^\s*[-*•]\s+/.test(line);
    if (isBullet) {
      return (
        <li
          key={i}
          className="ml-4 list-disc marker:text-brand-dark"
          dangerouslySetInnerHTML={{
            __html: bolded.replace(/^\s*[-*•]\s+/, ""),
          }}
        />
      );
    }
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return <p key={i} dangerouslySetInnerHTML={{ __html: bolded }} />;
  });
}

export default function AIPlanner() {
  const [messages, setMessages] = useState<Msg[]>([STARTER]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoNotice, setDemoNotice] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      setDemoNotice(Boolean(data.demo));
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
    <section id="planner" className="relative overflow-hidden bg-ink py-24">
      <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-brand-dark/25 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-amber">
            Live AI demo
          </p>
          <h2 className="mt-3 text-3xl font-light uppercase tracking-wide sm:text-4xl">
            Meet your AI planning assistant
          </h2>
          <p className="mt-4 max-w-md text-white/70">
            This is the heart of the new Bridal Team. Ask anything about your
            wedding and get real, tailored guidance — timelines, budgets,
            checklists and vendor picks — in seconds.
          </p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((q) => (
              <li key={q}>
                <button
                  onClick={() => send(q)}
                  disabled={loading}
                  className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/90 transition-colors hover:border-brand hover:bg-white/10 disabled:opacity-50"
                >
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/95 p-3 shadow-2xl backdrop-blur">
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
            className="h-[26rem] space-y-4 overflow-y-auto rounded-2xl bg-stone-4 p-4"
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
                  {m.role === "assistant" ? render(m.content) : m.content}
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

          {demoNotice && (
            <p className="px-3 pb-1 pt-2 text-center text-[11px] text-stone-1">
              Demo mode — add an <code>ANTHROPIC_API_KEY</code> to power replies
              with live Claude AI.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
