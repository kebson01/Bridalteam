import { NextResponse } from "next/server";
import { readOutreachConfig } from "@/lib/outreach/config";
import { bearerMatches } from "@/lib/outreach/tokens";
import { runOutreach } from "@/lib/outreach/run";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Runs one day of the vendor claim email campaign (lib/outreach/run.ts).
 *
 * Called every weekday by .github/workflows/vendor-outreach.yml with
 * `Authorization: Bearer $OUTREACH_SECRET`. Add `?dry_run=1` to see who would
 * be emailed today without sending anything; a dry run works even while
 * OUTREACH_ENABLED is off, so the list can be checked before switching on.
 *
 * Responds with a JSON report: what was planned, sent, skipped and failed.
 */
export async function POST(req: Request) {
  const { config, missing } = readOutreachConfig();
  if (!config.secret || !bearerMatches(req.headers.get("authorization"), config.secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dryRun = new URL(req.url).searchParams.get("dry_run") === "1";
  if (!dryRun && !config.enabled) {
    return NextResponse.json({ status: "disabled", hint: "Set OUTREACH_ENABLED=true to send. Add ?dry_run=1 to preview." });
  }
  if (!dryRun && missing.length) {
    return NextResponse.json({ status: "not_configured", missing }, { status: 503 });
  }

  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ status: "not_configured", missing: ["SUPABASE_SERVICE_ROLE_KEY"] }, { status: 503 });

  try {
    const report = await runOutreach({ db, config }, dryRun);
    return NextResponse.json({ status: report.paused ? "paused" : "ok", ...(missing.length ? { missing } : {}), ...report });
  } catch (err) {
    console.error("outreach run failed:", err);
    return NextResponse.json({ status: "error", error: String(err).slice(0, 500) }, { status: 500 });
  }
}
