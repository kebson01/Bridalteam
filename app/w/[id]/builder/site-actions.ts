"use server";

import { revalidatePath } from "next/cache";
import { approveForPublish } from "@/lib/custom-site/publish-gate";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { consumeAiQuota, QUOTA_UNMETERED } from "@/lib/ai-quota";
import { MAX_SITE_BYTES, buildSiteData, siteByteLength } from "@/lib/custom-site/runtime";
import { buildTemplateSite, sanitizeBrief } from "@/lib/custom-site/templates";
import { buildDesignerPrompt, designSite } from "@/lib/custom-site/ai";

/**
 * Server actions behind the custom site builder (components/wedding/site-builder.tsx).
 *
 * Permission checks live in the database: every write is an RPC that calls
 * can_edit_wedding() as the signed-in user (migration
 * 20261031200000_custom_wedding_sites.sql). These actions validate input and
 * turn database errors into sentences.
 */

export type SiteSource = "paste" | "template" | "ai" | "mcp";

export interface SiteVersion {
  id: string;
  source: SiteSource;
  note: string | null;
  created_at: string;
}

export interface SiteKey {
  id: string;
  label: string;
  hint: string;
  created_at: string;
  last_used_at: string | null;
}

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const UUID = /^[0-9a-f-]{36}$/i;

function explain(error: { code?: string; message?: string } | null, fallback: string): string {
  if (!error) return fallback;
  if (error.code === "42501") return "You don't have permission to edit this wedding's site.";
  if (error.code === "22001") return "That page is too big. Keep it under 500 KB (host large images elsewhere).";
  if (error.code === "P0002") return "Save a draft before publishing.";
  if (error.code === "BT001") return "Your draft changed since it was checked. Please publish again.";
  if (error.code === "54000") return "You've reached the limit. Remove one first.";
  console.error("site action failed:", error.code, error.message);
  return fallback;
}

async function signedIn() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function refresh(weddingId: string) {
  revalidatePath(`/w/${weddingId}/builder`);
  // The Guest website tab shows the site's status in its builder card.
  revalidatePath(`/w/${weddingId}/website`);
}

async function save(weddingId: string, html: string, source: "paste" | "template" | "ai", note: string | null) {
  const { supabase, user } = await signedIn();
  if (!user) return { ok: false as const, error: "Please sign in again." };
  const { data, error } = await supabase.rpc("save_custom_site", {
    p_wid: weddingId,
    p_html: html,
    p_source: source,
    p_note: note,
  });
  if (error) return { ok: false as const, error: explain(error, "Couldn't save your site. Please try again.") };
  refresh(weddingId);
  return { ok: true as const, savedAt: data as string };
}

export async function saveCustomSite(
  weddingId: string,
  html: string,
  note?: string,
): Promise<Result<{ savedAt: string }>> {
  if (!UUID.test(weddingId)) return { ok: false, error: "Unknown wedding." };
  if (typeof html !== "string" || !html.trim()) return { ok: false, error: "Paste some HTML first." };
  if (siteByteLength(html) > MAX_SITE_BYTES) {
    return { ok: false, error: "That page is too big. Keep it under 500 KB (host large images elsewhere)." };
  }
  return save(weddingId, html, "paste", note?.slice(0, 200) || "Edited in the code editor");
}

export async function applySiteTheme(weddingId: string, brief: unknown): Promise<Result<{ savedAt: string; html: string }>> {
  if (!UUID.test(weddingId)) return { ok: false, error: "Unknown wedding." };
  const clean = sanitizeBrief(brief);
  const html = buildTemplateSite(clean);
  const res = await save(weddingId, html, "template", `Started from the ${clean.theme} theme`);
  return res.ok ? { ...res, html } : res;
}

export async function designSiteWithAI(
  weddingId: string,
  request: string,
  revise: boolean,
): Promise<Result<{ savedAt: string; html: string }>> {
  if (!UUID.test(weddingId)) return { ok: false, error: "Unknown wedding." };
  const ask = (request ?? "").trim().slice(0, 2000);
  if (ask.length < 3) return { ok: false, error: "Tell the designer what you'd like." };

  const { supabase, user } = await signedIn();
  if (!user) return { ok: false, error: "Please sign in again." };

  // Editors only — checked before we spend an AI call on it.
  const { data: canEdit } = await supabase.rpc("can_edit_wedding", { w: weddingId });
  if (!canEdit) return { ok: false, error: "You don't have permission to edit this wedding's site." };

  const [{ data: w }, { data: registry }, { data: site }] = await Promise.all([
    supabase
      .from("weddings")
      .select("partner_one, partner_two, event_date, venue, city, region, welcome_message, cover_image_url, style")
      .eq("id", weddingId)
      .maybeSingle(),
    supabase.from("registry_links").select("label, url").eq("wedding_id", weddingId).order("position"),
    supabase.from("wedding_custom_sites").select("draft_html").eq("wedding_id", weddingId).maybeSingle(),
  ]);
  if (!w) return { ok: false, error: "Unknown wedding." };

  // Each design counts as one AI generation against the couple's plan.
  const admin = supabaseAdmin();
  if (!admin) console.error("AI quota not metered: SUPABASE_SERVICE_ROLE_KEY is not set.");
  const quota = admin ? await consumeAiQuota(admin, "generate", "", user.id) : QUOTA_UNMETERED;
  if (!quota.allowed) {
    return { ok: false, error: "You've used this month's AI designs. Paste your own code or connect your own assistant instead." };
  }

  const prompt = buildDesignerPrompt({
    data: buildSiteData({ ...w, registry: registry ?? [] }),
    style: (w as { style?: string | null }).style ?? null,
    request: ask,
    current: revise ? (site?.draft_html ?? null) : null,
  });
  const designed = await designSite(prompt);
  if (!designed.ok) return designed;

  const res = await save(weddingId, designed.html, "ai", `AI: ${ask.slice(0, 180)}`);
  return res.ok ? { ...res, html: designed.html } : res;
}

export async function publishCustomSite(weddingId: string): Promise<Result> {
  const { supabase, user } = await signedIn();
  if (!user) return { ok: false, error: "Please sign in again." };

  // Content policy check first (lib/custom-site/policy.ts). The database
  // refuses to publish a draft that hasn't passed, so this can't be skipped.
  const { data: site } = await supabase
    .from("wedding_custom_sites")
    .select("draft_html, draft_approved_hash")
    .eq("wedding_id", weddingId)
    .maybeSingle();
  if (!site?.draft_html) return { ok: false, error: "Save a draft before publishing." };
  const gate = await approveForPublish(weddingId, { html: site.draft_html, approvedHash: site.draft_approved_hash ?? null });
  if (!gate.ok) return gate;

  const { error } = await supabase.rpc("publish_custom_site", { p_wid: weddingId });
  if (error) return { ok: false, error: explain(error, "Couldn't publish. Please try again.") };
  refresh(weddingId);
  return { ok: true };
}

/** Switch guests between the built-in page and the custom one. Code is kept either way. */
export async function setSiteMode(weddingId: string, mode: "standard" | "custom"): Promise<Result> {
  if (mode !== "standard" && mode !== "custom") return { ok: false, error: "Unknown mode." };
  const { supabase, user } = await signedIn();
  if (!user) return { ok: false, error: "Please sign in again." };
  const { data, error } = await supabase
    .from("weddings")
    .update({ site_mode: mode, updated_at: new Date().toISOString() })
    .eq("id", weddingId)
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, error: explain(error ?? { code: "42501" }, "Couldn't switch. Please try again.") };
  refresh(weddingId);
  return { ok: true };
}

export async function listSiteVersions(weddingId: string): Promise<SiteVersion[]> {
  const { supabase } = await signedIn();
  const { data } = await supabase
    .from("wedding_site_versions")
    .select("id, source, note, created_at")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: false })
    .limit(30);
  return (data ?? []) as SiteVersion[];
}

export async function restoreSiteVersion(weddingId: string, versionId: string): Promise<Result<{ html: string }>> {
  if (!UUID.test(versionId)) return { ok: false, error: "Unknown version." };
  const { supabase, user } = await signedIn();
  if (!user) return { ok: false, error: "Please sign in again." };
  const { error } = await supabase.rpc("restore_custom_site_version", { p_version: versionId });
  if (error) return { ok: false, error: explain(error, "Couldn't restore that version.") };
  const { data } = await supabase.from("wedding_custom_sites").select("draft_html").eq("wedding_id", weddingId).maybeSingle();
  refresh(weddingId);
  return { ok: true, html: data?.draft_html ?? "" };
}

export async function listSiteKeys(weddingId: string): Promise<SiteKey[]> {
  const { supabase } = await signedIn();
  const { data } = await supabase
    .from("wedding_site_keys")
    .select("id, label, hint, created_at, last_used_at")
    .eq("wedding_id", weddingId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });
  return (data ?? []) as SiteKey[];
}

/** The raw key is returned exactly once; only its hash is stored. */
export async function createSiteKey(weddingId: string, label: string): Promise<Result<{ key: string; keys: SiteKey[] }>> {
  const { supabase, user } = await signedIn();
  if (!user) return { ok: false, error: "Please sign in again." };
  const { data, error } = await supabase.rpc("create_site_key", {
    p_wid: weddingId,
    p_label: (label ?? "").trim().slice(0, 60) || "My assistant",
  });
  if (error || typeof data !== "string") return { ok: false, error: explain(error, "Couldn't create a key.") };
  return { ok: true, key: data, keys: await listSiteKeys(weddingId) };
}

export async function revokeSiteKey(weddingId: string, keyId: string): Promise<Result<{ keys: SiteKey[] }>> {
  const { supabase, user } = await signedIn();
  if (!user) return { ok: false, error: "Please sign in again." };
  const { error } = await supabase.rpc("revoke_site_key", { p_id: keyId });
  if (error) return { ok: false, error: explain(error, "Couldn't revoke that key.") };
  return { ok: true, keys: await listSiteKeys(weddingId) };
}
