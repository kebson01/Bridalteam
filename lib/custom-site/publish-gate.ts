import { reviewSite, siteHash, UNAVAILABLE_MESSAGE, type PolicyVerdict, type SiteKind } from "@/lib/custom-site/policy";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Runs the content policy check on a draft and, if it passes, records the
 * approval so publish_custom_site / key_publish_site will accept it.
 *
 * Recording an approval is the one thing here that needs the service-role
 * key: couples must not be able to approve their own drafts, so
 * approve_custom_site_draft is executable by service_role only. It's only
 * called after reviewSite() has passed this exact HTML (matched by hash).
 */
export async function approveForPublish(
  weddingId: string,
  draft: { html: string; approvedHash: string | null },
  review: (html: string) => Promise<PolicyVerdict> = reviewSite,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return approve("approve_custom_site_draft", { p_wid: weddingId }, draft, review);
}

/** The same gate for a vendor's business website (lib/vendor-site). */
export async function approveVendorSiteForPublish(
  orgId: string,
  draft: { html: string; approvedHash: string | null },
  review: (html: string) => Promise<PolicyVerdict> = (html) => reviewSite(html, undefined, "business" satisfies SiteKind),
): Promise<{ ok: true } | { ok: false; error: string }> {
  return approve("approve_vendor_site_draft", { p_org: orgId }, draft, review);
}

async function approve(
  rpc: "approve_custom_site_draft" | "approve_vendor_site_draft",
  idArg: Record<string, string>,
  draft: { html: string; approvedHash: string | null },
  review: (html: string) => Promise<PolicyVerdict>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const hash = siteHash(draft.html);
  if (draft.approvedHash === hash) return { ok: true };

  const verdict = await review(draft.html);
  if (verdict.status === "unavailable") return { ok: false, error: UNAVAILABLE_MESSAGE };
  if (verdict.status === "fail") {
    return { ok: false, error: `Your site wasn't published: ${verdict.reason} Your draft is saved, so you can fix it and try again.` };
  }

  const admin = supabaseAdmin();
  if (!admin) {
    console.error("approveForPublish: SUPABASE_SERVICE_ROLE_KEY is not set");
    return { ok: false, error: UNAVAILABLE_MESSAGE };
  }
  const { data, error } = await admin.rpc(rpc, { ...idArg, p_hash: hash });
  if (error) {
    console.error(`${rpc} failed:`, error.code, error.message);
    return { ok: false, error: UNAVAILABLE_MESSAGE };
  }
  if (data !== true) return { ok: false, error: "Your draft changed while we were checking it. Please publish again." };
  return { ok: true };
}
