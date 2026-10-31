import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Stops all campaign email to a listing's address, and optionally takes the
 * listing off the site.
 *
 * Removal sets the listing back to draft rather than deleting it: it's off
 * the site immediately, and if the request was a mistake (or came from a
 * forwarded email) nothing is lost. The weekly report lists removal requests
 * so the listing can then be deleted for good (SQL in VENDOR-OUTREACH.md).
 * A listing someone has already claimed is theirs, so it is never unpublished
 * from here; they can do that themselves from their dashboard.
 */
export async function unsubscribeListing(db: SupabaseClient, orgId: string, removeListing: boolean): Promise<{ ok: boolean }> {
  const { data: row } = await db.from("vendor_outreach").select("email").eq("org_id", orgId).maybeSingle();
  const { data: claim } = await db.from("vendor_claims").select("contact_email").eq("org_id", orgId).limit(1).maybeSingle();
  const email = (row?.email ?? claim?.contact_email ?? "").trim().toLowerCase();
  if (!email) return { ok: false };

  await db.from("outreach_suppressions").upsert({ email, reason: "unsubscribed" }, { onConflict: "email", ignoreDuplicates: true });
  if (row) {
    await db.from("vendor_outreach").update({ status: "unsubscribed", updated_at: new Date().toISOString() }).eq("org_id", orgId).in("status", ["sent", "followed_up"]);
  }
  await db.from("outreach_events").insert({ org_id: orgId, email, kind: "unsubscribed" });

  if (removeListing) {
    const { count } = await db.from("org_members").select("org_id", { count: "exact", head: true }).eq("org_id", orgId);
    if (!count) {
      await db.from("vendor_profiles").update({ status: "draft" }).eq("org_id", orgId);
      await db.from("outreach_events").insert({ org_id: orgId, email, kind: "removal_requested" });
    }
  }
  return { ok: true };
}
