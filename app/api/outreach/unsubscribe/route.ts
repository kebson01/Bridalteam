import { NextResponse } from "next/server";
import { readOutreachConfig } from "@/lib/outreach/config";
import { verifyUnsubscribe } from "@/lib/outreach/tokens";
import { unsubscribeListing } from "@/lib/outreach/unsubscribe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Unsubscribe from the vendor claim campaign.
 *
 * Two callers, one endpoint:
 *  - A mail client's own "Unsubscribe" button (RFC 8058 one-click): a POST
 *    with body "List-Unsubscribe=One-Click". Answered with 200 and no page.
 *  - The form on /unsubscribe, which can also ask for the listing to be
 *    removed. Answered with a redirect back to that page's "done" state.
 *
 * POST only. Unsubscribing is a change, and link scanners and previewers open
 * every GET in an email; a GET that unsubscribed would unsubscribe people who
 * never clicked.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const orgId = url.searchParams.get("o") ?? "";
  const sig = url.searchParams.get("s") ?? "";
  const { config } = readOutreachConfig();
  if (!verifyUnsubscribe(config.secret, orgId, sig)) {
    return NextResponse.json({ error: "invalid link" }, { status: 400 });
  }

  const form = await req.formData().catch(() => null);
  const oneClick = form?.get("List-Unsubscribe") === "One-Click";
  const remove = form?.get("remove") === "1";

  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  await unsubscribeListing(db, orgId, remove && !oneClick);

  if (oneClick) return new NextResponse(null, { status: 200 });
  const done = new URL("/unsubscribe", SITE_URL);
  done.searchParams.set("done", remove ? "removed" : "unsubscribed");
  return NextResponse.redirect(done, 303);
}
