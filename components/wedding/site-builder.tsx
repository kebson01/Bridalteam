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
} from "@/app/w/[id]/builder/site-actions";
import { setWeddingWebsite } from "@/app/wedding/actions";
import { PLACEHOLDERS, MAX_SITE_BYTES } from "@/lib/custom-site/runtime";
import { THEMES, THEME_IDS, type ThemeId } from "@/lib/custom-site/templates";
import { SANDBOX_IFRAME_ATTR } from "@/lib/custom-site/serve";
import { POLICY_SUMMARY } from "@/lib/custom-site/policy-summary";
import { retentionNote } from "@/lib/custom-site/retention";

type Tab = "themes" | "ai" | "code" | "own";

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "themes", label: "Themes", hint: "One tap" },
  { id: "ai", label: "Bridal Team AI", hint: "Describe it" },
  { id: "code", label: "Paste code", hint: "HTML, CSS & JS" },
  { id: "own", label: "Your own AI", hint: "Claude, ChatGPT…" },
];

/** One-tap additions to the AI brief. */
const AI_IDEAS = ["Add an FAQ section", "Add a travel & hotels section", "Make it feel more elegant", "Add a photo gallery"];

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

const btnSmall =
  "rounded-full border border-stone-2 px-3 py-1 text-xs font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-text";

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
  /** Kept as-is when publishing switches the website on. */
  welcome: string;
  /** How many registry links the couple has; they're managed in Settings. */
  registryCount: number;
  /** For the "comes down on" date (lib/custom-site/retention.ts). */
  eventDate: string | null;
  createdAt: string;
  /** Set when Bridal Team has taken the site down (app/admin/sites). */
  blockedReason?: string | null;
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
  const [websiteOn, setWebsiteOn] = useState(props.websitePublished);
  const [slug, setSlug] = useState(props.slug);
  const [tab, setTab] = useState<Tab>(props.initialDraft ? "code" : "themes");
  const [theme, setTheme] = useState<ThemeId>("classic");
  const [headline, setHeadline] = useState("");
  const [ask, setAsk] = useState("");
  const [revise, setRevise] = useState(Boolean(props.initialDraft));
  const [keyLabel, setKeyLabel] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [previewStamp, setPreviewStamp] = useState(() => Date.now());
  const [device, setDevice] = useState<"desktop" | "phone">("desktop");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();

  const hasDraft = draft.trim().length > 0;
  const unpublishedChanges = hasDraft && (!liveAt || (draftAt !== null && Date.parse(draftAt) > Date.parse(liveAt)));
  const liveUrl = slug ? `${siteUrl}/wedding/${slug}` : null;
  const settingsHref = `/w/${weddingId}/website?section=settings`;
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

  const guestsSeeCustom = mode === "custom" && Boolean(liveAt);
  const card = "rounded-2xl border border-stone-2 bg-white shadow-card";
  const status = !hasDraft
    ? "No custom draft yet"
    : `${draftSource ? `${SOURCE_LABEL[draftSource] ?? draftSource} draft` : "Draft"} saved ${when(draftAt)}${
        unpublishedChanges ? " · not published yet" : " · live"
      }`;

  return (
    <div className="space-y-4">
      {/* Which page guests get, and publishing: always at the top. */}
      <div className={`${card} flex flex-wrap items-center justify-between gap-3 px-4 py-3`}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-ink-soft/80">Guests see</span>
          <div className="flex rounded-full bg-stone-4 p-1" role="radiogroup" aria-label="Which page guests see">
            {(["standard", "custom"] as const).map((m) => {
              const active = m === "custom" ? guestsSeeCustom : !guestsSeeCustom;
              const disabled = m === "custom" && !liveAt;
              return (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={disabled || busy !== null}
                  title={disabled ? "Publish a custom draft to switch to it" : undefined}
                  onClick={() =>
                    run("mode", () => setSiteMode(weddingId, m), () => {
                      setMode(m);
                      setMsg({ kind: "ok", text: m === "custom" ? "Guests now see your custom site." : "Guests now see the standard page." });
                    })
                  }
                  className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    active ? "bg-white text-ink shadow-sm" : "text-ink-soft/70 hover:text-ink"
                  }`}
                >
                  {m === "standard" ? "Standard page" : "Custom site"}
                </button>
              );
            })}
          </div>
          <span className="text-xs text-ink-soft/70">{status}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {liveUrl && websiteOn && guestsSeeCustom && (
            <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-text hover:underline">
              View live site ↗
            </a>
          )}
          <button
            type="button"
            className={btn}
            disabled={busy !== null || !unpublishedChanges || Boolean(props.blockedReason)}
            onClick={() =>
              run(
                "publish",
                async () => {
                  const published = await publishCustomSite(weddingId);
                  if (!published.ok || websiteOn) return { ...published, address: slug };
                  // The website was off: switch it on too, so publishing means
                  // guests can actually see it. The first time, this also picks
                  // a web address from the couple's names.
                  const on = await setWeddingWebsite({ weddingId, published: true, welcome: props.welcome });
                  return on.ok
                    ? { ok: true as const, address: on.slug ?? slug, turnedOn: true }
                    : { ok: true as const, address: slug, turnOnFailed: true };
                },
                (r: { address: string | null; turnedOn?: boolean; turnOnFailed?: boolean }) => {
                  setLiveAt(new Date().toISOString());
                  setMode("custom");
                  if (r.turnedOn) setWebsiteOn(true);
                  if (r.address) setSlug(r.address);
                  const where = r.address ? ` at ${siteUrl.replace(/^https?:\/\//, "")}/wedding/${r.address}` : "";
                  setMsg({
                    kind: "ok",
                    text: r.turnOnFailed
                      ? "Published, but we couldn't switch your website on. Turn it on in Settings."
                      : r.turnedOn
                        ? `Your website is live${where}. You can change the address in Settings.`
                        : "Published — guests now see your custom site.",
                  });
                },
              )
            }
          >
            {busy === "publish"
              ? "Checking & publishing…"
              : hasDraft && !unpublishedChanges
                ? "Published"
                : websiteOn
                  ? "Publish to guests"
                  : "Publish & go live"}
          </button>
        </div>
      </div>

      {props.blockedReason && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">Bridal Team has taken your guest website down.</p>
          <p className="mt-1">Reason: {props.blockedReason}</p>
          <p className="mt-1 text-red-800/80">
            You can keep editing your draft, but you can&rsquo;t publish until we&rsquo;ve reviewed it again. Fix the
            issue, then{" "}
            <a href="/contact" className="font-semibold underline">
              contact us
            </a>
            .
          </p>
        </div>
      )}

      <p className="text-xs text-ink-soft/70">
        {retentionNote(props.eventDate, props.createdAt)} Download a copy any time from the preview.
      </p>

      {!websiteOn && (
        <p className="rounded-lg bg-stone-4 px-3 py-2 text-xs text-ink-soft/80">
          Your website isn&rsquo;t live yet.{" "}
          {hasDraft
            ? "Publishing your design switches it on"
            : "Publish a design, or switch on the standard page in Settings,"}{" "}
          {slug ? (
            <>
              at <span className="font-semibold text-ink">{siteUrl.replace(/^https?:\/\//, "")}/wedding/{slug}</span>.
            </>
          ) : (
            "and gives it a web address from your names."
          )}{" "}
          <a href={settingsHref} className="font-semibold text-brand-text hover:underline">
            Choose the address in Settings
          </a>
        </p>
      )}

      {msg && (
        <p
          role={msg.kind === "err" ? "alert" : "status"}
          className={`rounded-lg px-3 py-2 text-sm ${msg.kind === "err" ? "bg-red-50 text-red-700" : "bg-brand-wash text-ink"}`}
        >
          {msg.text}
        </p>
      )}

      <div className="flex flex-wrap items-start gap-4">
        {/* Build options. The code editor gets half the width; everything else a sidebar. */}
        <aside className={`min-w-0 space-y-4 ${tab === "code" ? "flex-[1_1_26rem]" : "flex-[1_1_20rem] lg:max-w-md"}`}>
          <div className={`${card} p-5`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft/70">How do you want to build?</p>
            <div className="mt-2.5 grid grid-cols-2 gap-2" role="tablist" aria-label="Ways to build">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    tab === t.id ? "border-brand bg-brand-wash ring-1 ring-brand" : "border-stone-2 hover:border-brand/50"
                  }`}
                >
                  <span className="block text-sm font-semibold text-ink">{t.label}</span>
                  <span className="block text-xs text-ink-soft/70">{t.hint}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 border-t border-stone-2 pt-4" role="tabpanel">
              {tab === "themes" && (
                <div>
                  <div className="grid grid-cols-2 gap-2">
                    {THEME_IDS.map((id) => {
                      const t = THEMES[id];
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setTheme(id)}
                          aria-pressed={theme === id}
                          className={`rounded-xl border p-2.5 text-left transition-colors ${
                            theme === id ? "border-brand ring-2 ring-brand/20" : "border-stone-2 hover:border-brand/50"
                          }`}
                        >
                          <span className="flex gap-1" aria-hidden="true">
                            {[t.bg, t.accent, t.ink].map((c) => (
                              <span key={c} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: c }} />
                            ))}
                          </span>
                          <span className="mt-1.5 block text-sm font-semibold text-ink">{t.label}</span>
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
                    Want a schedule, travel notes or FAQ? Ask the AI planner to &ldquo;make my wedding website&rdquo; and
                    tell it the details.
                  </p>
                  <button
                    type="button"
                    className={`${btn} mt-4 w-full`}
                    disabled={busy !== null}
                    onClick={() =>
                      run("theme", () => applySiteTheme(weddingId, { theme, headline }), (r) =>
                        savedDraft(r.html, r.savedAt, "template", `Draft created from the ${THEMES[theme].label} theme. It's in the preview.`),
                      )
                    }
                  >
                    {busy === "theme" ? "Building…" : hasDraft ? "Replace my draft with this theme" : "Use this theme"}
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
                    rows={6}
                    placeholder="A tropical beach wedding feel — turquoise and coral, big hero photo, a section about how we met in Nassau, and a gentle fade-in as you scroll."
                    className="mt-1 w-full rounded-lg border border-stone-2 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  />
                  <p className="mt-2 text-xs font-semibold text-ink-soft/70">Try</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {AI_IDEAS.map((idea) => (
                      <button
                        key={idea}
                        type="button"
                        onClick={() => {
                          setAsk((a) => {
                            const base = a.trim();
                            return (base ? `${base}${/[.!?]$/.test(base) ? "" : "."} ${idea}.` : `${idea}.`).slice(0, 2000);
                          });
                          if (hasDraft) setRevise(true);
                        }}
                        className="rounded-full border border-stone-2 px-2.5 py-1 text-xs text-ink-soft transition-colors hover:border-brand hover:text-brand-text"
                      >
                        {idea}
                      </button>
                    ))}
                  </div>
                  {hasDraft && (
                    <label className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
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
                    className={`${btn} mt-4 w-full`}
                    disabled={busy !== null || !props.aiOn || ask.trim().length < 3}
                    onClick={() =>
                      run("ai", () => designSiteWithAI(weddingId, ask, revise && hasDraft), (r) =>
                        savedDraft(r.html, r.savedAt, "ai", "Your AI-designed draft is ready. It's in the preview."),
                      )
                    }
                  >
                    {busy === "ai" ? "Designing… (about a minute)" : revise && hasDraft ? "Update my draft" : "Design my site"}
                  </button>
                  <p className="mt-2 text-center text-xs text-ink-soft/60">Each design uses one AI generation from your plan.</p>
                </div>
              )}

              {tab === "code" && (
                <div>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    rows={24}
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
                    <summary className="cursor-pointer font-semibold text-ink">Tip: placeholders Bridal Team fills in for you</summary>
                    <ul className="mt-2 space-y-1">
                      {PLACEHOLDERS.map((p) => (
                        <li key={p.attr}>
                          <code className="rounded bg-stone-4 px-1">{p.attr}</code> — {p.fills}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2">
                      Scripts and stylesheets can come from jsDelivr, cdnjs, unpkg, Tailwind, jQuery, Google&rsquo;s CDN
                      or Google Fonts; images and video from any https link; embeds from YouTube, Vimeo or Google Maps.
                      Pages run sandboxed: no forms, cookies, redirects or fetching data, and outside links open in a new
                      tab.
                    </p>
                  </details>
                  <button
                    type="button"
                    className={`${btn} mt-4`}
                    disabled={busy !== null || !code.trim() || codeBytes > MAX_SITE_BYTES || code === draft}
                    onClick={() =>
                      run("code", () => saveCustomSite(weddingId, code), (r) =>
                        savedDraft(code, r.savedAt, "paste", "Draft saved. It's in the preview."),
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
                  <div className="rounded-xl border border-brand/40 bg-brand-wash p-4">
                    <p className="font-semibold text-ink">Connect ChatGPT or Claude by signing in</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft/80">
                      Your assistant can then plan your whole wedding, not just the website: checklist, budget, guests,
                      seating, vendors and travel. You approve it on a Bridal Team page, and can disconnect it below.
                    </p>
                    <ol className="mt-3 space-y-1 text-xs text-ink-soft">
                      <li>
                        <span className="font-semibold text-brand-text">1</span> In ChatGPT or Claude, add a{" "}
                        <b className="text-ink">custom connector</b> (or &ldquo;custom MCP server&rdquo;) in its settings
                      </li>
                      <li>
                        <span className="font-semibold text-brand-text">2</span> Use this URL and choose <b className="text-ink">OAuth</b>{" "}
                        sign-in
                      </li>
                      <li>
                        <span className="font-semibold text-brand-text">3</span> Log in to Bridal Team, pick this wedding and click{" "}
                        <b className="text-ink">Allow</b>
                      </li>
                    </ol>
                    <KeyLine label="Connector URL" value={mcpBase} />
                  </div>

                  <details className="rounded-xl border border-stone-2 p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-ink">
                      Or connect with a key (website only)
                    </summary>
                    <p className="mt-2 text-xs text-ink-soft/80">
                      For Claude Code, Cursor and other tools that take a key instead of a sign-in. A key can read your
                      wedding details and registry, save drafts and publish your website — nothing else in your account.
                    </p>
                    <div className="mt-3 space-y-3">
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

                    </div>
                  </details>

                  <div className="rounded-xl bg-stone-4 p-4 text-xs text-ink-soft">
                    <p className="font-semibold text-ink">Then ask your assistant something like:</p>
                    <p className="mt-1 italic">
                      &ldquo;Use Bridal Team to design our wedding website. Start with get_site_guide. I want an elegant
                      black-tie look with a gold accent, a photo timeline of our story, and an FAQ. Use only real image
                      links. Save it as a draft so I can preview it.&rdquo;
                    </p>
                  </div>

                  {keys.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-sm font-semibold text-ink">Connected assistants</p>
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
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={`${card} p-5`}>
            <p className="text-sm font-semibold text-ink">Fills in automatically</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft/70">
              Names · date · countdown · location · cover photo · welcome · RSVP note
            </p>
            <div className="mt-2.5 flex items-center justify-between gap-2 text-sm">
              <span className="text-ink">
                Registry · {props.registryCount} {props.registryCount === 1 ? "link" : "links"}
              </span>
              <a href={`${settingsHref}#registry`} className="font-semibold text-brand-text hover:underline">
                Manage →
              </a>
            </div>
          </div>

          <details className={`${card} p-5`}>
            <summary className="cursor-pointer text-sm font-semibold text-ink">Content rules</summary>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft/70">
              Every custom site is checked before it goes live. If something needs changing, we&rsquo;ll say what, and
              your draft stays saved.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-ink-soft">
              {POLICY_SUMMARY.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </details>

          {versions.length > 0 && (
            <details className={`${card} p-5`}>
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
        </aside>

        {/* Live preview of the draft. */}
        <section
          className={`${card} min-w-0 overflow-hidden ${tab === "code" ? "flex-[1_1_26rem]" : "flex-[999_1_32rem]"}`}
          aria-label="Draft preview"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-2 px-4 py-2.5">
            <p className="text-sm font-semibold text-ink">
              Draft preview
              {draftSource && <span className="font-normal text-ink-soft/60"> · {SOURCE_LABEL[draftSource] ?? draftSource}</span>}
            </p>
            {hasDraft && (
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex rounded-full bg-stone-4 p-0.5" role="group" aria-label="Preview size">
                  {(["desktop", "phone"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={device === d}
                      onClick={() => setDevice(d)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        device === d ? "bg-white text-ink shadow-sm" : "text-ink-soft/70 hover:text-ink"
                      }`}
                    >
                      {d === "desktop" ? "Desktop" : "Phone"}
                    </button>
                  ))}
                </div>
                <button type="button" className={btnSmall} onClick={() => setPreviewStamp(Date.now())}>
                  Refresh
                </button>
                <button type="button" className={btnSmall} onClick={() => downloadHtml(draft)}>
                  Download my site
                </button>
                <a
                  href={`/sandbox/preview/${weddingId}?t=${previewStamp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={btnSmall}
                >
                  Full screen
                </a>
              </div>
            )}
          </div>
          {hasDraft ? (
            <div className={device === "phone" ? "flex justify-center bg-stone-4 p-5" : ""}>
              <iframe
                key={previewStamp}
                src={`/sandbox/preview/${weddingId}?t=${previewStamp}`}
                sandbox={SANDBOX_IFRAME_ATTR}
                title="Draft preview of your wedding website"
                className={
                  device === "phone"
                    ? "h-[44rem] w-[390px] max-w-full rounded-[2rem] border-[6px] border-ink bg-white"
                    : "block h-[44rem] w-full bg-white"
                }
              />
            </div>
          ) : (
            <div className="flex h-[28rem] flex-col items-center justify-center gap-2 px-6 text-center">
              <p className="font-display text-lg font-semibold text-ink">Your draft shows up here</p>
              <p className="max-w-sm text-sm text-ink-soft/70">
                Pick a theme, describe a design to our AI, paste your code or connect your own AI. Guests see nothing until
                you publish.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}


/** Saves the draft as an .html file the couple can keep or host elsewhere. */
function downloadHtml(html: string) {
  const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "wedding-website.html";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
