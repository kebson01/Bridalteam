"use client";

import { useState, useTransition } from "react";
import {
  applySiteTheme,
  createSiteKey,
  designSiteWithAI,
  publishCustomSite,
  restoreSiteVersion,
  revokeSiteKey,
  saveCustomSite,
  setSiteMode,
  listSiteVersions,
  type SiteKey,
  type SiteVersion,
} from "@/app/w/[id]/website/site-actions";
import { PLACEHOLDERS, MAX_SITE_BYTES } from "@/lib/custom-site/runtime";
import { THEMES, THEME_IDS, type ThemeId } from "@/lib/custom-site/templates";
import { SANDBOX_IFRAME_ATTR } from "@/lib/custom-site/serve";

type Tab = "themes" | "ai" | "code" | "own";

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "themes", label: "Themes", hint: "A finished site in one tap" },
  { id: "ai", label: "Bridal Team AI", hint: "Describe it, we design it" },
  { id: "code", label: "Paste code", hint: "Your own HTML, CSS & JS" },
  { id: "own", label: "Your own AI", hint: "Claude, ChatGPT & more" },
];

const SOURCE_LABEL: Record<string, string> = {
  paste: "Code editor",
  template: "Theme",
  ai: "Bridal Team AI",
  mcp: "Your AI",
};

const btn =
  "rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50";
const btnGhost =
  "rounded-full border border-stone-2 px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-text disabled:opacity-50";

function when(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export interface SiteBuilderProps {
  weddingId: string;
  siteUrl: string;
  mcpOn: boolean;
  aiOn: boolean;
  websitePublished: boolean;
  slug: string | null;
  initialMode: "standard" | "custom";
  initialDraft: string | null;
  initialDraftSource: string | null;
  initialDraftAt: string | null;
  initialLiveAt: string | null;
  initialVersions: SiteVersion[];
  initialKeys: SiteKey[];
}

export default function SiteBuilder(props: SiteBuilderProps) {
  const { weddingId, siteUrl } = props;
  const [mode, setMode] = useState(props.initialMode);
  const [draft, setDraft] = useState(props.initialDraft ?? "");
  const [code, setCode] = useState(props.initialDraft ?? "");
  const [draftAt, setDraftAt] = useState(props.initialDraftAt);
  const [draftSource, setDraftSource] = useState(props.initialDraftSource);
  const [liveAt, setLiveAt] = useState(props.initialLiveAt);
  const [versions, setVersions] = useState(props.initialVersions);
  const [keys, setKeys] = useState(props.initialKeys);
  const [tab, setTab] = useState<Tab>(props.initialDraft ? "code" : "themes");
  const [theme, setTheme] = useState<ThemeId>("classic");
  const [headline, setHeadline] = useState("");
  const [ask, setAsk] = useState("");
  const [revise, setRevise] = useState(Boolean(props.initialDraft));
  const [keyLabel, setKeyLabel] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [previewStamp, setPreviewStamp] = useState(() => Date.now());
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();

  const hasDraft = draft.trim().length > 0;
  const unpublishedChanges = hasDraft && (!liveAt || (draftAt !== null && Date.parse(draftAt) > Date.parse(liveAt)));
  const liveUrl = props.slug ? `${siteUrl}/wedding/${props.slug}` : null;
  const codeBytes = new TextEncoder().encode(code).length;
  const mcpBase = `${siteUrl}/api/mcp/site`;

  function run<T extends { ok: true } | { ok: false; error: string }>(
    label: string,
    fn: () => Promise<T>,
    after: (r: Extract<T, { ok: true }>) => void,
  ) {
    setMsg(null);
    setBusy(label);
    start(async () => {
      try {
        const r = await fn();
        if (r.ok) after(r as Extract<T, { ok: true }>);
        else setMsg({ kind: "err", text: (r as { error: string }).error });
      } catch {
        setMsg({ kind: "err", text: "Something went wrong. Please try again." });
      } finally {
        setBusy(null);
      }
    });
  }

  async function refreshVersions() {
    setVersions(await listSiteVersions(weddingId));
  }

  function savedDraft(html: string, savedAt: string, source: string, text: string) {
    setDraft(html);
    setCode(html);
    setDraftAt(savedAt);
    setDraftSource(source);
    setPreviewStamp(Date.now());
    setMsg({ kind: "ok", text });
    void refreshVersions();
  }

  return (
    <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Site design</h2>
          <p className="max-w-md text-sm text-ink-soft/70">
            Keep our standard page, or build your own — from a theme, with our AI, with your own code, or with your own AI
            assistant.
          </p>
        </div>
        <span
          className={`flex-none rounded-full px-3 py-1 text-xs font-semibold ${
            mode === "custom" && liveAt ? "bg-brand/10 text-brand-text" : "bg-stone-4 text-ink-soft/70"
          }`}
        >
          Guests see: {mode === "custom" && liveAt ? "Custom site" : "Standard page"}
        </span>
      </div>

      {/* Which page guests get */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Which page guests see">
        {(["standard", "custom"] as const).map((m) => {
          const active = m === "custom" ? mode === "custom" && Boolean(liveAt) : !(mode === "custom" && liveAt);
          const disabled = m === "custom" && !liveAt;
          return (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled || busy !== null}
              onClick={() =>
                run("mode", () => setSiteMode(weddingId, m), () => {
                  setMode(m);
                  setMsg({ kind: "ok", text: m === "custom" ? "Guests now see your custom site." : "Guests now see the standard page." });
                })
              }
              className={`rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                active ? "border-brand bg-brand-wash" : "border-stone-2 hover:border-brand/50"
              }`}
            >
              <p className="text-sm font-semibold text-ink">{m === "standard" ? "Standard page" : "Custom site"}</p>
              <p className="mt-0.5 text-xs text-ink-soft/70">
                {m === "standard"
                  ? "Bridal Team's built-in page: cover photo, welcome, RSVP note and registry."
                  : liveAt
                    ? `Your own design, last published ${when(liveAt)}.`
                    : "Publish a custom draft below to switch to it."}
              </p>
            </button>
          );
        })}
      </div>

      {!props.websitePublished && (
        <p className="mt-3 rounded-lg bg-stone-4 px-3 py-2 text-xs text-ink-soft/80">
          Your guest website is turned off, so guests can&rsquo;t see either page yet. Turn it on in the card above when
          you&rsquo;re ready.
        </p>
      )}

      {/* Ways to build */}
      <div className="mt-6 border-t border-stone-2 pt-5">
        <div className="flex gap-1 overflow-x-auto rounded-full bg-stone-4 p-1" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                tab === t.id ? "bg-white text-brand-text shadow-sm" : "text-ink-soft/70 hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-ink-soft/60">{TABS.find((t) => t.id === tab)?.hint}</p>

        <div className="mt-4">
          {tab === "themes" && (
            <div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {THEME_IDS.map((id) => {
                  const t = THEMES[id];
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTheme(id)}
                      aria-pressed={theme === id}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        theme === id ? "border-brand ring-2 ring-brand/20" : "border-stone-2 hover:border-brand/50"
                      }`}
                    >
                      <span className="flex gap-1" aria-hidden="true">
                        {[t.bg, t.accent, t.ink].map((c) => (
                          <span key={c} className="h-4 w-4 rounded-full border border-black/10" style={{ background: c }} />
                        ))}
                      </span>
                      <span className="mt-2 block text-sm font-semibold text-ink">{t.label}</span>
                      <span className="block text-xs text-ink-soft/70">{t.blurb}</span>
                    </button>
                  );
                })}
              </div>
              <label className="mt-4 block text-sm font-medium text-ink">
                Headline <span className="font-normal text-ink-soft/60">(optional)</span>
                <input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  maxLength={120}
                  placeholder="We can't wait to celebrate with you"
                  className="mt-1 w-full rounded-lg border border-stone-2 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </label>
              <p className="mt-2 text-xs text-ink-soft/60">
                Your names, date, location, cover photo and registry fill in automatically. Want a schedule, travel notes
                or FAQ? Ask the AI planner to &ldquo;make my wedding website&rdquo; and tell it the details.
              </p>
              <button
                type="button"
                className={`${btn} mt-4`}
                disabled={busy !== null}
                onClick={() =>
                  run("theme", () => applySiteTheme(weddingId, { theme, headline }), (r) =>
                    savedDraft(r.html, r.savedAt, "template", `Draft created from the ${THEMES[theme].label} theme. Preview it below.`),
                  )
                }
              >
                {busy === "theme" ? "Building…" : hasDraft ? "Replace my draft with this theme" : "Create my site"}
              </button>
            </div>
          )}

          {tab === "ai" && (
            <div>
              {!props.aiOn && (
                <p className="mb-3 rounded-lg bg-stone-4 px-3 py-2 text-xs text-ink-soft/80">
                  The AI designer isn&rsquo;t switched on yet. Themes, pasted code and your own AI all work.
                </p>
              )}
              <label className="block text-sm font-medium text-ink" htmlFor="site-ask">
                Describe the site you want
              </label>
              <textarea
                id="site-ask"
                value={ask}
                onChange={(e) => setAsk(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="A tropical beach wedding feel — turquoise and coral, big hero photo, a section about how we met in Nassau, and a gentle fade-in as you scroll."
                className="mt-1 w-full rounded-lg border border-stone-2 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
              {hasDraft && (
                <label className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
                  <input
                    type="checkbox"
                    checked={revise}
                    onChange={(e) => setRevise(e.target.checked)}
                    className="h-4 w-4 accent-[var(--color-brand-dark)]"
                  />
                  Change my current draft instead of starting over
                </label>
              )}
              <button
                type="button"
                className={`${btn} mt-4`}
                disabled={busy !== null || !props.aiOn || ask.trim().length < 3}
                onClick={() =>
                  run("ai", () => designSiteWithAI(weddingId, ask, revise && hasDraft), (r) =>
                    savedDraft(r.html, r.savedAt, "ai", "Your AI-designed draft is ready. Preview it below."),
                  )
                }
              >
                {busy === "ai" ? "Designing… (about a minute)" : revise && hasDraft ? "Update my draft" : "Design my site"}
              </button>
              <p className="mt-2 text-xs text-ink-soft/60">Each design uses one AI generation from your plan.</p>
            </div>
          )}

          {tab === "code" && (
            <div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={16}
                spellCheck={false}
                aria-label="Your site's HTML"
                placeholder={'<!doctype html>\n<html>\n<head><title>Our wedding</title></head>\n<body>\n  <h1 data-bt="names"></h1>\n  <p data-bt="date"></p>\n  <div data-bt="registry"></div>\n</body>\n</html>'}
                className="w-full rounded-lg border border-stone-2 bg-stone-4/50 px-3 py-2 font-mono text-xs leading-relaxed focus:border-brand focus:outline-none"
              />
              <div className="mt-1 flex justify-between text-xs text-ink-soft/60">
                <span>{code !== draft ? "Unsaved changes" : draftAt ? `Saved ${when(draftAt)}` : ""}</span>
                <span className={codeBytes > MAX_SITE_BYTES ? "text-red-700" : ""}>
                  {(codeBytes / 1024).toFixed(0)} / 500 KB
                </span>
              </div>
              <details className="mt-3 rounded-lg border border-stone-2 p-3 text-xs text-ink-soft">
                <summary className="cursor-pointer font-semibold text-ink">Placeholders Bridal Team fills in</summary>
                <ul className="mt-2 space-y-1">
                  {PLACEHOLDERS.map((p) => (
                    <li key={p.attr}>
                      <code className="rounded bg-stone-4 px-1">{p.attr}</code> — {p.fills}
                    </li>
                  ))}
                </ul>
                <p className="mt-2">
                  Scripts and fonts from any https CDN work. Pages run sandboxed: no forms, cookies or redirects, and
                  outside links open in a new tab.
                </p>
              </details>
              <button
                type="button"
                className={`${btn} mt-4`}
                disabled={busy !== null || !code.trim() || codeBytes > MAX_SITE_BYTES || code === draft}
                onClick={() =>
                  run("code", () => saveCustomSite(weddingId, code), (r) =>
                    savedDraft(code, r.savedAt, "paste", "Draft saved. Preview it below."),
                  )
                }
              >
                {busy === "code" ? "Saving…" : "Save draft"}
              </button>
            </div>
          )}

          {tab === "own" && (
            <div className="space-y-4 text-sm">
              {!props.mcpOn && (
                <p className="rounded-lg bg-stone-4 px-3 py-2 text-xs text-ink-soft/80">
                  Connecting your own AI is coming soon. You can create a key now; it will work as soon as it&rsquo;s
                  switched on.
                </p>
              )}
              <p className="text-ink-soft/80">
                Let Claude, ChatGPT or any assistant that supports MCP design your site in as much detail as you like. It
                can read your wedding details and registry, save drafts and — when you say so — publish. It can&rsquo;t
                see anything else in your account.
              </p>

              {newKey ? (
                <div className="rounded-xl border border-brand/40 bg-brand-wash p-4">
                  <p className="font-semibold text-ink">Your new key — copy it now, it won&rsquo;t be shown again.</p>
                  <KeyLine label="Connector URL (Claude & ChatGPT custom connectors)" value={`${mcpBase}/${newKey}`} />
                  <KeyLine label="Or the server URL" value={mcpBase} />
                  <KeyLine label="with this header" value={`Authorization: Bearer ${newKey}`} />
                  <KeyLine
                    label="Claude Code"
                    value={`claude mcp add --transport http bridalteam-site ${mcpBase} --header "Authorization: Bearer ${newKey}"`}
                  />
                  <p className="mt-3 text-xs text-ink-soft/70">
                    Treat the connector URL like a password: anyone with it can change your site. Revoke it below any
                    time.
                  </p>
                  <button type="button" className={`${btnGhost} mt-3`} onClick={() => setNewKey(null)}>
                    Done
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-end gap-2">
                  <label className="min-w-0 flex-1 text-sm font-medium text-ink">
                    Name this connection
                    <input
                      value={keyLabel}
                      onChange={(e) => setKeyLabel(e.target.value)}
                      maxLength={60}
                      placeholder="My Claude"
                      className="mt-1 w-full rounded-lg border border-stone-2 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                    />
                  </label>
                  <button
                    type="button"
                    className={btn}
                    disabled={busy !== null}
                    onClick={() =>
                      run("key", () => createSiteKey(weddingId, keyLabel), (r) => {
                        setNewKey(r.key);
                        setKeys(r.keys);
                        setKeyLabel("");
                      })
                    }
                  >
                    {busy === "key" ? "Creating…" : "Create a key"}
                  </button>
                </div>
              )}

              <div className="rounded-xl bg-stone-4 p-4 text-xs text-ink-soft">
                <p className="font-semibold text-ink">Then ask your assistant something like:</p>
                <p className="mt-1 italic">
                  &ldquo;Use the Bridal Team site tools to design our wedding website. Start with get_site_guide. I want
                  an elegant black-tie look with a gold accent, a photo timeline of our story, and an FAQ. Save it as a
                  draft so I can preview it.&rdquo;
                </p>
              </div>

              {keys.length > 0 && (
                <ul className="divide-y divide-stone-2 rounded-xl border border-stone-2">
                  {keys.map((k) => (
                    <li key={k.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink">{k.label}</span>
                        <span className="text-xs text-ink-soft/60">
                          …{k.hint} · {k.last_used_at ? `last used ${when(k.last_used_at)}` : "not used yet"}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="flex-none text-xs font-semibold text-red-700 hover:underline disabled:opacity-50"
                        disabled={busy !== null}
                        onClick={() =>
                          run("revoke", () => revokeSiteKey(weddingId, k.id), (r) => {
                            setKeys(r.keys);
                            setMsg({ kind: "ok", text: `“${k.label}” can no longer change your site.` });
                          })
                        }
                      >
                        Revoke
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {msg && (
        <p
          role={msg.kind === "err" ? "alert" : "status"}
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${msg.kind === "err" ? "bg-red-50 text-red-700" : "bg-brand-wash text-ink"}`}
        >
          {msg.text}
        </p>
      )}

      {/* Draft preview + publish */}
      {hasDraft && (
        <div className="mt-6 border-t border-stone-2 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-ink">Draft preview</h3>
              <p className="text-xs text-ink-soft/60">
                {draftSource ? `${SOURCE_LABEL[draftSource] ?? draftSource} · ` : ""}saved {when(draftAt)}
                {unpublishedChanges ? " · not published yet" : " · live"}
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" className={btnGhost} onClick={() => setPreviewStamp(Date.now())}>
                Refresh
              </button>
              <a
                href={`/sandbox/preview/${weddingId}?t=${previewStamp}`}
                target="_blank"
                rel="noopener noreferrer"
                className={btnGhost}
              >
                Full screen
              </a>
            </div>
          </div>
          <iframe
            key={previewStamp}
            src={`/sandbox/preview/${weddingId}?t=${previewStamp}`}
            sandbox={SANDBOX_IFRAME_ATTR}
            title="Draft preview of your wedding website"
            className="mt-3 h-[34rem] w-full rounded-xl border border-stone-2 bg-white"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={btn}
              disabled={busy !== null || !unpublishedChanges}
              onClick={() =>
                run("publish", () => publishCustomSite(weddingId), () => {
                  const now = new Date().toISOString();
                  setLiveAt(now);
                  setMode("custom");
                  setMsg({
                    kind: "ok",
                    text: props.websitePublished
                      ? "Published — guests now see your custom site."
                      : "Published. Turn on your guest website above so guests can see it.",
                  });
                })
              }
            >
              {busy === "publish" ? "Publishing…" : unpublishedChanges ? "Publish to guests" : "Published"}
            </button>
            {liveUrl && props.websitePublished && mode === "custom" && liveAt && (
              <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-text hover:underline">
                View live site →
              </a>
            )}
          </div>
        </div>
      )}

      {versions.length > 0 && (
        <details className="mt-6 border-t border-stone-2 pt-5">
          <summary className="cursor-pointer text-sm font-semibold text-ink">Version history ({versions.length})</summary>
          <ul className="mt-3 divide-y divide-stone-2 text-sm">
            {versions.map((v, i) => (
              <li key={v.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-ink">{v.note ?? SOURCE_LABEL[v.source]}</span>
                  <span className="text-xs text-ink-soft/60">
                    {SOURCE_LABEL[v.source]} · {when(v.created_at)}
                    {i === 0 ? " · current draft" : ""}
                  </span>
                </span>
                <span className="flex flex-none gap-3 text-xs font-semibold">
                  <a
                    href={`/sandbox/preview/${weddingId}?v=${v.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink-soft hover:text-brand-text"
                  >
                    View
                  </a>
                  {i > 0 && (
                    <button
                      type="button"
                      disabled={busy !== null}
                      className="text-brand-text hover:underline disabled:opacity-50"
                      onClick={() =>
                        run("restore", () => restoreSiteVersion(weddingId, v.id), (r) =>
                          savedDraft(r.html, new Date().toISOString(), v.source, "Restored as your draft. Publish it when you're ready."),
                        )
                      }
                    >
                      Restore
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function KeyLine({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-ink-soft/70">{label}</p>
      <div className="mt-1 flex items-center gap-2 rounded-lg border border-stone-2 bg-white p-1.5">
        <code className="min-w-0 flex-1 truncate px-1.5 text-xs text-ink">{value}</code>
        <button
          type="button"
          onClick={() =>
            navigator.clipboard?.writeText(value).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            })
          }
          className="flex-none rounded-md bg-stone-4 px-2.5 py-1 text-xs font-semibold text-brand-text"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
