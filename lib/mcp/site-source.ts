import { supabasePublic } from "@/lib/supabase";
import { InvalidSiteKeyError, type SiteKeySource } from "@/lib/mcp/site-tools";

/**
 * The site tools' view of the database: the key_* functions from migration
 * 20261031200000_custom_wedding_sites.sql, called with the public anon key.
 * There is no user session on an MCP call — the site key is the
 * authorization, and each function checks it (and refuses revoked keys).
 */
export function supabaseSiteSource(key: string): SiteKeySource {
  const db = supabasePublic();

  async function call<T>(fn: string, args: Record<string, unknown>): Promise<T> {
    const { data, error } = await db.rpc(fn, { p_key: key, ...args });
    if (error) {
      if (error.code === "28000") throw new InvalidSiteKeyError();
      if (error.code === "22001") throw new Error("site too large");
      if (error.code === "54000") throw new Error("limit reached");
      throw new Error(`${fn} failed: ${error.code} ${error.message}`);
    }
    return data as T;
  }

  return {
    context: () => call<Record<string, unknown>>("key_site_context", {}),
    getSite: (which) => call<string | null>("key_get_site", { p_which: which }),
    saveDraft: (html, note) => call<string>("key_save_site", { p_html: html, p_note: note }),
    publish: () => call<string>("key_publish_site", {}),
    useStandard: () => call<void>("key_use_standard_site", {}),
    addRegistryLink: (label, url) => call<void>("key_add_registry_link", { p_label: label, p_url: url }),
  };
}
