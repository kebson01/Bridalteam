"use client";

import { useState, useTransition } from "react";
import {
  applyVendorSiteTheme,
  claimVendorSiteSlug,
  createVendorSiteKey,
  designVendorSiteWithAI,
  listVendorSiteVersions,
  publishVendorSite,
  restoreVendorSiteVersion,
  revokeVendorSiteKey,
  saveVendorSite,
  setVendorSiteOnline,
  type VendorSiteKey,
  type VendorSiteVersion,
} from "@/app/vendor/site-actions";
import { MAX_SITE_BYTES, PLACEHOLDERS } from "@/lib/vendor-site/runtime";
import { VENDOR_THEMES, VENDOR_THEME_IDS, type VendorThemeId } from "@/lib/vendor-site/templates";
import { toSlug } from "@/lib/vendor-site/slug";
import { SANDBOX_IFRAME_ATTR } from "@/lib/custom-site/serve";

/**
 * The vendor's Website tab: a business site at bridalteam.com/biz/<slug>,
 * built from a theme, Bridal Team's AI, pasted code or their own AI, filled
 * live from their listing. The vendor counterpart of couples' site builder
 * (components/wedding/site-builder.tsx); see app/vendor/site-actions.ts.
 */

type Tab = "themes" | "ai" | "code" | "own";

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "themes", label: "Themes", hint: "One tap" },
  { id: "ai", label: "Bridal Team AI", hint: "Describe it" },
  { id: "code", label: "Paste code", hint: "HTML, CSS & JS" },
  { id: "own", label: "Your own AI", hint: "Claude, ChatGPT…" },
];

const AI_IDEAS = [
  "Make it feel more luxurious",
  "Put our reviews near the top",
  "Add a section about how booking works",
  "Use a dark, moody look",
];

const SOURCE_LABEL: Record<string, string> = { paste: "Code editor", template: "Theme", ai: "Bridal Team AI", mcp: "Your AI" };

const btn =
  "rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50";
const btnGhost =
  "rounded-full border border-stone-2 px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-text disabled:opacity-50";
const btnSmall =
  "rounded-full border border-stone-2 px-3 py-1 text-xs font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-text";
const input = "w-full rounded-lg border border-stone-2 px-3 py-2 text-sm focus:border-brand focus:outline-none";
const card = "rounded-2xl border border-stone-2 bg-white shadow-[0_1px_2px_rgba(34,34,34,0.04)]";

function when(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export interface VendorSiteBuilderProps {
  orgId: string;
  siteUrl: string;
  businessName: string;
  /** Pro or Featured right now: publishing and the AI designer need it. */
  planOk: boolean;
  aiOn: boolean;
  mcpOn: boolean;
  slug: string | null;
  published: boolean;
  blockedReason: string | null;
  initialDraft: string | null;
  initialDraftSource: string | null;
  initialDraftAt: string | null;
  initialLiveAt: string | null;
  initialVersions: VendorSiteVersion[];
  initialKeys: VendorSiteKey[];
}

export default function VendorSiteBuilder(props: VendorSiteBuilderProps) {
  const { orgId, siteUrl, planOk } = props;
  const host = siteUrl.replace(/^https?:\/\//, "");
  const [draft, setDraft] = useState(props.initialDraft ?? "");
  const [code, setCode] = useState(props.initialDraft ?? "");
  const [draftAt, setDraftAt] = useState(props.initialDraftAt);
  const [draftSource, setDraftSource] = useState(props.initialDraftSource);
  const [liveAt, setLiveAt] = useState(props.initialLiveAt);
  const [online, setOnline] = useState(props.published);
  const [slug, setSlug] = useState(props.slug);
  const [slugInput, setSlugInput] = useState(props.slug ?? toSlug(props.businessName));
  const [editingSlug, setEditingSlug] = useState(!props.slug);
  const [versions, setVersions] = useState(props.initialVersions);
  const [keys, setKeys] = useState(props.initialKeys);
  const [tab, setTab] = useState<Tab>(props.initialDraft ? "code" : "themes");
  const [theme, setTheme] = useState<VendorThemeId>("classic");
  const [headline, setHeadline] = useState("");
  const [ask, setAsk] = useState("");
  const [revise, setRevise] = useState(Boolean(props.initialDraft));
  const [keyLabel, setKeyLabel] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  // 0 on first render so server and browser agree; bumped to Date.now() to reload the preview.
  const [previewStamp, setPreviewStamp] = useState(0);
  const [device, setDevice] = useState<"desktop" | "phone">("desktop");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();

  const hasDraft = draft.trim().length > 0;
  const unpublishedChanges = hasDraft && (!liveAt || (draftAt !== null && Date.parse(draftAt) > Date.parse(liveAt)));
  const liveUrl = slug ? `${siteUrl}/biz/${slug}` : null;
  const codeBytes = new TextEncoder().encode(code).length;
  const mcpBase = `${siteUrl}/api/mcp/biz`;
  const blocked = Boolean(props.blockedReason);

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

  function savedDraft(html: string, savedAt: string, source: string, text: string) {
    setDraft(html);
    setCode(html);
    setDraftAt(savedAt);
    setDraftSource(source);
    setPreviewStamp(Date.now());
    setMsg({ kind: "ok", text });
    void listVendorSiteVersions(orgId).then(setVersions);
  }

  const status = blocked
    ? "Taken down by Bridal Team"
    : !liveAt
      ? hasDraft
        ? "Draft only, not published yet"
        : "No website yet"
      : online
        ? unpublishedChanges
          ? `Online · you have changes saved ${when(draftAt)} that aren't published`
          : `Online · published ${when(liveAt)}`
        : "Offline · visitors can't see it";

  return (
    <div className="space-y-4">
      {/* Address, status and publishing: always at the top. */}
      <div className={`${card} space-y-4 p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">Your web address</p>
            {editingSlug ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-sm text-ink-soft/70">{host}/biz/</span>
                <input
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value)}
                  maxLength={40}
                  aria-label="Web address"
                  className={`${input} w-56`}
                />
                <button
                  type="button"
                  className={btnGhost}
                  disabled={busy !== null || !slugInput.trim()}
                  onClick={() =>
                    run("slug", () => claimVendorSiteSlug(orgId, slugInput), (r) => {
                      setSlug(r.slug);
                      setSlugInput(r.slug);
                      setEditingSlug(false);
                      setMsg({ kind: "ok", text: `Your address is ${host}/biz/${r.slug}.` });
                    })
                  }
                >
                  {busy === "slug" ? "Saving…" : "Save address"}
                </button>
                {slug && (
                  <button type="button" className="text-xs font-semibold text-ink-soft/60 hover:text-ink" onClick={() => setEditingSlug(false)}>
                    Cancel
                  </button>
                )}
              </div>
            ) : (
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-base font-medium text-ink">
                  {host}/biz/{slug}
                </span>
                <button type="button" className="text-xs font-semibold text-brand-text hover:underline" onClick={() => setEditingSlug(true)}>
                  Change
                </button>
                {liveUrl && online && liveAt && !blocked && (
                  <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-brand-text hover:underline">
                    View live site ↗
                  </a>
                )}
              </p>
            )}
            <p className="mt-1.5 flex items-center gap-2 text-xs text-ink-soft/70">
              <span
                className={`h-1.5 w-1.5 rounded-full ${blocked ? "bg-red-600" : liveAt && online ? "bg-green-600" : "bg-stone-5"}`}
                aria-hidden
              />
              {status}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {liveAt && !blocked && (
              <button
                type="button"
                className={btnGhost}
                disabled={busy !== null || (!online && !planOk)}
                onClick={() =>
                  run("online", () => setVendorSiteOnline(orgId, !online), () => {
                    setOnline(!online);
                    setMsg({ kind: "ok", text: online ? "Your website is offline. Nothing was deleted." : "Your website is back online." });
                  })
                }
              >
                {busy === "online" ? "Saving…" : online ? "Take offline" : "Bring back online"}
              </button>
            )}
            <button
              type="button"
              className={btn}
              disabled={busy !== null || !hasDraft || !planOk || blocked || (!unpublishedChanges && online)}
              onClick={() =>
                run("publish", () => publishVendorSite(orgId, slugInput), (r) => {
                  setLiveAt(new Date().toISOString());
                  setOnline(true);
                  setSlug(r.slug);
                  setSlugInput(r.slug);
                  setEditingSlug(false);
                  setMsg({ kind: "ok", text: `Your website is live at ${host}/biz/${r.slug}.` });
                })
              }
            >
              {busy === "publish" ? "Checking & publishing…" : liveAt && !unpublishedChanges && online ? "Published" : liveAt ? "Publish changes" : "Publish my website"}
            </button>
          </div>
        </div>

        {!planOk && (
          <p className="rounded-lg bg-brand-wash px-4 py-3 text-sm text-ink-soft">
            Design your website now. Publishing it, and the Bridal Team AI designer, are part of Pro and Featured.{" "}
            {/* A full page load, so the workspace opens on the Plan tab. */}
            <a href="/vendor?tab=plan" className="font-semibold text-brand-text hover:underline">
              See plans
            </a>
          </p>
        )}
        {blocked && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="font-semibold">Bridal Team has taken your website down.</p>
            <p className="mt-1">Reason: {props.blockedReason}</p>
            <p className="mt-1 text-red-800/80">
              You can keep editing your draft, but you can&rsquo;t publish until we&rsquo;ve reviewed it again. Fix the issue, then{" "}
              <a href="/contact" className="font-semibold underline">
                contact us
              </a>
              .
            </p>
          </div>
        )}
        {msg && (
          <p
            role={msg.kind === "err" ? "alert" : "status"}
            className={`rounded-lg px-3 py-2 text-sm ${msg.kind === "err" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800"}`}
          >
            {msg.text}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-start gap-4">
        <aside className={`min-w-0 space-y-4 ${tab === "code" ? "flex-[1_1_26rem]" : "flex-[1_1_20rem] lg:max-w-sm"}`}>
          <div className={`${card} p-5`}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">How do you want to build?</p>
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
                    {VENDOR_THEME_IDS.map((id) => {
                      const t = VENDOR_THEMES[id];
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
                    Tagline <span className="font-normal text-ink-soft/60">(optional)</span>
                    <input
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      maxLength={120}
                      placeholder="Packed dance floors since 2012"
                      className={`${input} mt-1`}
                    />
                  </label>
                  <p className="mt-2 text-xs text-ink-soft/60">
                    Your packages, photos, reviews, FAQs and contact details fill in from your listing and stay up to date.
                  </p>
                  <button
                    type="button"
                    className={`${btn} mt-4 w-full`}
                    disabled={busy !== null}
                    onClick={() =>
                      run("theme", () => applyVendorSiteTheme(orgId, { theme, headline }), (r) =>
                        savedDraft(r.html, r.savedAt, "template", `Draft created from the ${VENDOR_THEMES[theme].label} theme. It's in the preview.`),
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
                  {props.aiOn && !planOk && (
                    <p className="mb-3 rounded-lg bg-brand-wash px-3 py-2 text-xs text-ink-soft">
                      The AI designer is part of Pro and Featured.
                    </p>
                  )}
                  <label className="block text-sm font-medium text-ink" htmlFor="biz-site-ask">
                    Describe the website you want
                  </label>
                  <textarea
                    id="biz-site-ask"
                    value={ask}
                    onChange={(e) => setAsk(e.target.value)}
                    maxLength={2000}
                    rows={6}
                    placeholder="Sleek and modern, black and gold, a big photo of a packed dance floor at the top, our packages side by side, and a bold 'Check availability' button."
                    className={`${input} mt-1`}
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
                    disabled={busy !== null || !props.aiOn || !planOk || ask.trim().length < 3}
                    onClick={() =>
                      run("ai", () => designVendorSiteWithAI(orgId, ask, revise && hasDraft), (r) =>
                        savedDraft(r.html, r.savedAt, "ai", "Your AI-designed draft is ready. It's in the preview."),
                      )
                    }
                  >
                    {busy === "ai" ? "Designing… (about a minute)" : revise && hasDraft ? "Update my draft" : "Design my website"}
                  </button>
                </div>
              )}

              {tab === "code" && (
                <div>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    rows={24}
                    spellCheck={false}
                    aria-label="Your website's HTML"
                    placeholder={'<!doctype html>\n<html>\n<head><title>My business</title></head>\n<body>\n  <h1 data-bt="business-name"></h1>\n  <p data-bt="about"></p>\n  <div data-bt="packages"></div>\n  <a data-bt="contact">Check availability</a>\n</body>\n</html>'}
                    className="w-full rounded-lg border border-stone-2 bg-stone-4/50 px-3 py-2 font-mono text-xs leading-relaxed focus:border-brand focus:outline-none"
                  />
                  <div className="mt-1 flex justify-between text-xs text-ink-soft/60">
                    <span>{code !== draft ? "Unsaved changes" : draftAt ? `Saved ${when(draftAt)}` : ""}</span>
                    <span className={codeBytes > MAX_SITE_BYTES ? "text-red-700" : ""}>{(codeBytes / 1024).toFixed(0)} / 500 KB</span>
                  </div>
                  <details className="mt-3 rounded-lg border border-stone-2 p-3 text-xs text-ink-soft">
                    <summary className="cursor-pointer font-semibold text-ink">Placeholders Bridal Team fills from your listing</summary>
                    <ul className="mt-2 space-y-1">
                      {PLACEHOLDERS.map((p) => (
                        <li key={p.attr}>
                          <code className="rounded bg-stone-4 px-1">{p.attr}</code> — {p.fills}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2">
                      Scripts and stylesheets can come from jsDelivr, cdnjs, unpkg, Tailwind, jQuery, Google&rsquo;s CDN or Google
                      Fonts; images and video from any https link; embeds from YouTube, Vimeo or Google Maps. Pages run sandboxed: no
                      forms, cookies, redirects or fetching data, and outside links open in a new tab.
                    </p>
                  </details>
                  <button
                    type="button"
                    className={`${btn} mt-4`}
                    disabled={busy !== null || !code.trim() || codeBytes > MAX_SITE_BYTES || code === draft}
                    onClick={() =>
                      run("code", () => saveVendorSite(orgId, code), (r) => savedDraft(code, r.savedAt, "paste", "Draft saved. It's in the preview."))
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
                      Connecting your own AI is coming soon. You can create a key now; it will work as soon as it&rsquo;s switched on.
                    </p>
                  )}
                  <p className="text-xs leading-relaxed text-ink-soft/80">
                    Let Claude, ChatGPT, Cursor or another assistant design your website. A key lets it read your listing and save and
                    publish your website, nothing else in your account.
                  </p>
                  {newKey ? (
                    <div className="rounded-xl border border-brand/40 bg-brand-wash p-4">
                      <p className="font-semibold text-ink">Your new key — copy it now, it won&rsquo;t be shown again.</p>
                      <KeyLine label="Connector URL (Claude & ChatGPT custom connectors)" value={`${mcpBase}/${newKey}`} />
                      <KeyLine label="Or the server URL" value={mcpBase} />
                      <KeyLine label="with this header" value={`Authorization: Bearer ${newKey}`} />
                      <KeyLine
                        label="Claude Code"
                        value={`claude mcp add --transport http bridalteam-biz ${mcpBase} --header "Authorization: Bearer ${newKey}"`}
                      />
                      <p className="mt-3 text-xs text-ink-soft/70">
                        Treat the connector URL like a password: anyone with it can change your website. Revoke it below any time.
                      </p>
                      <button type="button" className={`${btnGhost} mt-3`} onClick={() => setNewKey(null)}>
                        Done
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-end gap-2">
                      <label className="min-w-0 flex-1 text-sm font-medium text-ink">
                        Name this connection
                        <input value={keyLabel} onChange={(e) => setKeyLabel(e.target.value)} maxLength={60} placeholder="My Claude" className={`${input} mt-1`} />
                      </label>
                      <button
                        type="button"
                        className={btn}
                        disabled={busy !== null}
                        onClick={() =>
                          run("key", () => createVendorSiteKey(orgId, keyLabel), (r) => {
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
                      &ldquo;Use Bridal Team to design my business website. Start with get_site_guide. I want a bold, modern look with my
                      packages front and center. Save it as a draft so I can preview it.&rdquo;
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
                                run("revoke", () => revokeVendorSiteKey(orgId, k.id), (r) => {
                                  setKeys(r.keys);
                                  setMsg({ kind: "ok", text: `“${k.label}” can no longer change your website.` });
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
            <p className="text-sm font-semibold text-ink">Fills in from your listing</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft/70">
              Name · about · packages · photos · reviews · FAQs · phone, email and socials. Edit your listing and your website updates
              too.
            </p>
            <a href="/vendor" className="mt-2 inline-block text-sm font-semibold text-brand-text hover:underline">
              Edit my listing →
            </a>
          </div>

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
                      <a href={`/sandbox/biz-preview/${orgId}?v=${v.id}`} target="_blank" rel="noopener noreferrer" className="text-ink-soft hover:text-brand-text">
                        View
                      </a>
                      {i > 0 && (
                        <button
                          type="button"
                          disabled={busy !== null}
                          className="text-brand-text hover:underline disabled:opacity-50"
                          onClick={() =>
                            run("restore", () => restoreVendorSiteVersion(orgId, v.id), (r) =>
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
                <a href={`/sandbox/biz-preview/${orgId}?t=${previewStamp}`} target="_blank" rel="noopener noreferrer" className={btnSmall}>
                  Full screen
                </a>
              </div>
            )}
          </div>
          {hasDraft ? (
            <div className={device === "phone" ? "flex justify-center bg-stone-4 p-5" : ""}>
              <iframe
                key={previewStamp}
                src={`/sandbox/biz-preview/${orgId}?t=${previewStamp}`}
                sandbox={SANDBOX_IFRAME_ATTR}
                title="Draft preview of your website"
                className={
                  device === "phone"
                    ? "h-[44rem] w-[390px] max-w-full rounded-[2rem] border-[6px] border-ink bg-white"
                    : "block h-[44rem] w-full bg-white"
                }
              />
            </div>
          ) : (
            <div className="flex h-[28rem] flex-col items-center justify-center gap-2 px-6 text-center">
              <p className="text-lg font-medium text-ink">Your website shows up here</p>
              <p className="max-w-sm text-sm text-ink-soft/70">
                Pick a theme to start in one tap, describe a design to our AI, paste your own code or connect your own AI. Visitors see
                nothing until you publish.
              </p>
            </div>
          )}
        </section>
      </div>
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
