import { supabasePublic } from "@/lib/supabase";
import { approveVendorSiteForPublish } from "@/lib/custom-site/publish-gate";
import { BizPublishError, InvalidBizKeyError, type BizSiteSource } from "@/lib/mcp/biz-site-tools";

/**
 * The vendor site tools' view of the database: the vkey_* functions from
 * migration 20261115190000_vendor_websites.sql, called with the public anon
 * key. There's no session on an MCP call; the key is the authorization and
 * each function checks it (and refuses revoked keys).
 */
export function supabaseBizSiteSource(key: string): BizSiteSource {
  const db = supabasePublic();

  async function call<T>(fn: string, args: Record<string, unknown>): Promise<T> {
    const { data, error } = await db.rpc(fn, { p_key: key, ...args });
    if (error) {
      if (error.code === "28000") throw new InvalidBizKeyError();
      if (error.code === "22001") throw new Error("site too large");
      if (error.code === "BT003") throw new BizPublishError("Bridal Team took this website down for breaking its content rules, so it can't be published. The vendor has been emailed the reason.");
      if (error.code === "BT004") throw new BizPublishError("Websites go live with Pro or Featured. The vendor can upgrade on the Plan & Account tab of their Bridal Team vendor account.");
      if (error.code === "BT005") throw new BizPublishError("The vendor needs to choose a web address on the Website tab of their Bridal Team vendor account first.");
      if (error.code === "BT001") throw new BizPublishError("The draft changed while it was being checked. Call publish_site again.");
      throw new Error(`${fn} failed: ${error.code} ${error.message}`);
    }
    return data as T;
  }

  return {
    context: () => call<Record<string, unknown>>("vkey_site_context", {}),
    getSite: (which) => call<string | null>("vkey_get_site", { p_which: which }),
    saveDraft: (html, note) => call<string>("vkey_save_site", { p_html: html, p_note: note }),
    // Same content check as the Publish button; the database refuses drafts the server hasn't approved.
    publish: async () => {
      const [orgId, html] = await Promise.all([
        call<string>("vkey_org_id", {}),
        call<string | null>("vkey_get_site", { p_which: "draft" }),
      ]);
      if (!html) throw new BizPublishError("There's no draft to publish yet. Save one with save_site_draft first.");
      const gate = await approveVendorSiteForPublish(orgId, { html, approvedHash: null });
      if (!gate.ok) throw new BizPublishError(gate.error);
      return call<string>("vkey_publish_site", {});
    },
  };
}
