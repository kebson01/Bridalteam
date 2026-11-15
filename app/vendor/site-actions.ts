"use server";

import { revalidatePath } from "next/cache";
import { approveVendorSiteForPublish } from "@/lib/custom-site/publish-gate";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { consumeAiQuota, QUOTA_UNMETERED } from "@/lib/ai-quota";
import { vendorSlugProblemMessage as slugProblemMessage, toSlug } from "@/lib/vendor-site/slug";
import { MAX_SITE_BYTES, buildVendorSiteData, siteByteLength, type VendorSitePayload } from "@/lib/vendor-site/runtime";
import { buildVendorTemplateSite, sanitizeVendorBrief, VENDOR_THEMES } from "@/lib/vendor-site/templates";
import { buildVendorDesignerPrompt, designSite } from "@/lib/vendor-site/ai";
import { effectivePlan, PLAN_COLUMNS, type PlanSource } from "@/lib/tiers";

/**
 * Server actions behind the vendor website builder
 * (components/vendor/vendor-site-builder.tsx). Permission checks, the plan
 * requirement and the content-check gate all live in the database
 * (migration 20261115190000_vendor_websites.sql); these validate input and
 * turn database errors into sentences.
 */

export type VendorSiteSource = "paste" | "template" | "ai" | "mcp";

export interface VendorSiteVersion {
  id: string;
  source: VendorSiteSource;
  note: string | null;
  created_at: string;
}

export interface VendorSiteKey {
  id: string;
  label: string;
  hint: string;
  created_at: string;
  last_used_at: string | null;
}

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const UUID = /^[0-9a-f-]{36}$/i;
const PLAN_MESSAGE = "Your website goes live with Pro or Featured. Upgrade on the Plan & Account tab to publish it.";

function explain(error: { code?: string; message?: string } | null, fallback: string): string {
  if (!error) return fallback;
  if (error.code === "42501") return "You don't have permission to edit this business's website.";
  if (error.code === "22001") return "That page is too big. Keep it under 500 KB (host large images elsewhere).";
  if (error.code === "P0002") return "Save a draft before publishing.";
  if (error.code === "BT001") return "Your draft changed since it was checked. Please publish again.";
  if (error.code === "BT002") return slugProblemMessage(error.message ?? "");
  if (error.code === "BT003")
    return "Bridal Team took this website down for breaking our content rules. Check your email for details, update it, then contact us to review it.";
  if (error.code === "BT004") return PLAN_MESSAGE;
  if (error.code === "BT005") return "Choose your web address first.";
  if (error.code === "54000") return "You've reached the limit. Remove one first.";
  console.error("vendor site action failed:", error.code, error.message);
  return fallback;
}

async function signedIn() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

const refresh = () => revalidatePath("/vendor");

async function save(orgId: string, html: string, source: "paste" | "template" | "ai", note: string | null) {
  const { supabase, user } = await signedIn();
  if (!user) return { ok: false as const, error: "Please sign in again." };
  const { data, error } = await supabase.rpc("save_vendor_site", { p_org: orgId, p_html: html, p_source: source, p_note: note });
  if (error) return { ok: false as const, error: explain(error, "Couldn't save your website. Please try again.") };
  refresh();
  return { ok: true as const, savedAt: data as string };
}

export async function saveVendorSite(orgId: string, html: string): Promise<Result<{ savedAt: string }>> {
  if (!UUID.test(orgId)) return { ok: false, error: "Unknown business." };
  if (typeof html !== "string" || !html.trim()) return { ok: false, error: "Paste some HTML first." };
  if (siteByteLength(html) > MAX_SITE_BYTES) {
    return { ok: false, error: "That page is too big. Keep it under 500 KB (host large images elsewhere)." };
  }
  return save(orgId, html, "paste", "Edited in the code editor");
}

export async function applyVendorSiteTheme(orgId: string, brief: unknown): Promise<Result<{ savedAt: string; html: string }>> {
  if (!UUID.test(orgId)) return { ok: false, error: "Unknown business." };
  const clean = sanitizeVendorBrief(brief);
  const html = buildVendorTemplateSite(clean);
  const res = await save(orgId, html, "template", `Started from the ${VENDOR_THEMES[clean.theme].label} theme`);
  return res.ok ? { ...res, html } : res;
}

/** The plan the vendor has right now, read as the signed-in member. */
async function hasSitePlan(supabase: Awaited<ReturnType<typeof supabaseServer>>, orgId: string): Promise<boolean> {
  const { data } = await supabase.from("organizations").select(PLAN_COLUMNS).eq("id", orgId).maybeSingle();
  const plan = effectivePlan(data as PlanSource | null);
  return plan === "pro" || plan === "featured";
}

export async function designVendorSiteWithAI(
  orgId: string,
  request: string,
  revise: boolean,
): Promise<Result<{ savedAt: string; html: string }>> {
  if (!UUID.test(orgId)) return { ok: false, error: "Unknown business." };
  const ask = (request ?? "").trim().slice(0, 2000);
  if (ask.length < 3) return { ok: false, error: "Tell the designer what you'd like." };

  const { supabase, user } = await signedIn();
  if (!user) return { ok: false, error: "Please sign in again." };

  // Members only, and the AI designer is part of Pro: checked before spending an AI call.
  const { data: payload, error } = await supabase.rpc("vendor_site_payload", { p_org: orgId });
  if (error || !payload) return { ok: false, error: explain(error, "Unknown business.") };
  if (!(await hasSitePlan(supabase, orgId))) return { ok: false, error: PLAN_MESSAGE };

  const admin = supabaseAdmin();
  if (!admin) console.error("AI quota not metered: SUPABASE_SERVICE_ROLE_KEY is not set.");
  const quota = admin ? await consumeAiQuota(admin, "generate", "", user.id) : QUOTA_UNMETERED;
  if (!quota.allowed) {
    return { ok: false, error: "You've used this month's AI designs. Paste your own code or connect your own assistant instead." };
  }

  const { data: site } = revise
    ? await supabase.from("vendor_sites").select("draft_html").eq("org_id", orgId).maybeSingle()
    : { data: null };
  const prompt = buildVendorDesignerPrompt({
    data: buildVendorSiteData(payload as VendorSitePayload),
    request: ask,
    current: revise ? ((site as { draft_html?: string | null } | null)?.draft_html ?? null) : null,
  });
  const designed = await designSite(prompt);
  if (!designed.ok) return designed;

  const res = await save(orgId, designed.html, "ai", `AI: ${ask.slice(0, 180)}`);
  return res.ok ? { ...res, html: designed.html } : res;
}

/** Picks or changes the web address (bridalteam.com/biz/<slug>). */
export async function claimVendorSiteSlug(orgId: string, input: string): Promise<Result<{ slug: string }>> {
  const slug = toSlug(input ?? "");
  if (!slug) return { ok: false, error: slugProblemMessage("format") };
  const { supabase, user } = await signedIn();
  if (!user) return { ok: false, error: "Please sign in again." };
  const { data, error } = await supabase.rpc("claim_vendor_site_slug", { p_org: orgId, p_slug: slug });
  if (error) return { ok: false, error: explain(error, "Couldn't save that address.") };
  refresh();
  return { ok: true, slug: data as string };
}

/**
 * Content check, then publish. A first publish without an address takes one
 * from the business name.
 */
export async function publishVendorSite(orgId: string, suggestedSlug?: string): Promise<Result<{ slug: string }>> {
  const { supabase, user } = await signedIn();
  if (!user) return { ok: false, error: "Please sign in again." };

  const { data: site } = await supabase
    .from("vendor_sites")
    .select("slug, draft_html, draft_approved_hash")
    .eq("org_id", orgId)
    .maybeSingle();
  if (!site?.draft_html) return { ok: false, error: "Save a draft before publishing." };
  if (!(await hasSitePlan(supabase, orgId))) return { ok: false, error: PLAN_MESSAGE };

  let slug = site.slug as string | null;
  if (!slug) {
    const claimed = await claimVendorSiteSlug(orgId, suggestedSlug ?? "");
    if (!claimed.ok) return { ok: false, error: `${claimed.error} Pick an address below, then publish.` };
    slug = claimed.slug;
  }

  const gate = await approveVendorSiteForPublish(orgId, { html: site.draft_html, approvedHash: site.draft_approved_hash ?? null });
  if (!gate.ok) return gate;

  const { error } = await supabase.rpc("publish_vendor_site", { p_org: orgId });
  if (error) return { ok: false, error: explain(error, "Couldn't publish. Please try again.") };
  refresh();
  return { ok: true, slug };
}

export async function setVendorSiteOnline(orgId: string, online: boolean): Promise<Result> {
  const { supabase, user } = await signedIn();
  if (!user) return { ok: false, error: "Please sign in again." };
  const { error } = await supabase.rpc("set_vendor_site_online", { p_org: orgId, p_online: Boolean(online) });
  if (error) return { ok: false, error: explain(error, "Couldn't change that. Please try again.") };
  refresh();
  return { ok: true };
}

export async function listVendorSiteVersions(orgId: string): Promise<VendorSiteVersion[]> {
  const { supabase } = await signedIn();
  const { data } = await supabase
    .from("vendor_site_versions")
    .select("id, source, note, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(30);
  return (data ?? []) as VendorSiteVersion[];
}

export async function restoreVendorSiteVersion(orgId: string, versionId: string): Promise<Result<{ html: string }>> {
  if (!UUID.test(versionId)) return { ok: false, error: "Unknown version." };
  const { supabase, user } = await signedIn();
  if (!user) return { ok: false, error: "Please sign in again." };
  const { error } = await supabase.rpc("restore_vendor_site_version", { p_version: versionId });
  if (error) return { ok: false, error: explain(error, "Couldn't restore that version.") };
  const { data } = await supabase.from("vendor_sites").select("draft_html").eq("org_id", orgId).maybeSingle();
  refresh();
  return { ok: true, html: (data?.draft_html as string | null) ?? "" };
}

export async function listVendorSiteKeys(orgId: string): Promise<VendorSiteKey[]> {
  const { supabase } = await signedIn();
  const { data } = await supabase
    .from("vendor_site_keys")
    .select("id, label, hint, created_at, last_used_at")
    .eq("org_id", orgId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });
  return (data ?? []) as VendorSiteKey[];
}

/** The raw key is returned exactly once; only its hash is stored. */
export async function createVendorSiteKey(orgId: string, label: string): Promise<Result<{ key: string; keys: VendorSiteKey[] }>> {
  const { supabase, user } = await signedIn();
  if (!user) return { ok: false, error: "Please sign in again." };
  const { data, error } = await supabase.rpc("create_vendor_site_key", {
    p_org: orgId,
    p_label: (label ?? "").trim().slice(0, 60) || "My assistant",
  });
  if (error || typeof data !== "string") return { ok: false, error: explain(error, "Couldn't create a key.") };
  return { ok: true, key: data, keys: await listVendorSiteKeys(orgId) };
}

export async function revokeVendorSiteKey(orgId: string, keyId: string): Promise<Result<{ keys: VendorSiteKey[] }>> {
  const { supabase, user } = await signedIn();
  if (!user) return { ok: false, error: "Please sign in again." };
  const { error } = await supabase.rpc("revoke_vendor_site_key", { p_id: keyId });
  if (error) return { ok: false, error: explain(error, "Couldn't revoke that key.") };
  return { ok: true, keys: await listVendorSiteKeys(orgId) };
}
