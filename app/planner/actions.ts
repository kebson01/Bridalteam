"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { PROPOSAL_TARGET, sanitizeProposal, type ProposalKind } from "@/lib/planner-actions";
import { buildTemplateSite } from "@/lib/custom-site/templates";

export interface ApplyResult {
  ok: boolean;
  error?: string;
  added?: number;
  href?: string;
}

const TABLE: Record<Exclude<ProposalKind, "website">, string> = {
  tasks: "tasks",
  budget: "budget_items",
  vendors: "wedding_vendors",
  guests: "wedding_guests",
};

/**
 * Saves the items a couple confirmed from an AI planner suggestion.
 *
 * No permission checks here beyond RLS: every insert runs as the signed-in
 * user, so a wedding they can't edit refuses the write exactly as it would
 * from the checklist or budget page. The items are re-validated because they
 * come back from the browser, not from our own server.
 */
export async function applyProposal(
  weddingId: string,
  kind: ProposalKind,
  items: unknown[],
): Promise<ApplyResult> {
  const proposal = sanitizeProposal(kind, items);
  if (!weddingId || !proposal) return { ok: false, error: "Nothing to add." };

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to save this to your wedding." };

  // A website brief becomes a themed draft (not a row per item), saved through
  // the same permission-checked RPC the site builder uses. Guests see nothing
  // until the couple publishes it there.
  if (proposal.kind === "website") {
    const { error } = await supabase.rpc("save_custom_site", {
      p_wid: weddingId,
      p_html: buildTemplateSite(proposal.items[0]),
      p_source: "template",
      p_note: `AI planner: ${proposal.items[0].theme} theme`,
    });
    if (error) {
      console.error("applyProposal website failed:", error.code, error.message);
      return {
        ok: false,
        error: error.code === "42501" ? "You don't have permission to edit this wedding." : "Couldn't save the site. Please try again.",
      };
    }
    const href = PROPOSAL_TARGET.website.path(weddingId);
    revalidatePath(href);
    return { ok: true, added: 1, href };
  }

  const table = TABLE[proposal.kind];

  // wedding_guests is ordered by name and has no position column.
  if (proposal.kind === "guests") {
    const rows = proposal.items.map((item) => ({ wedding_id: weddingId, ...item }));
    return insert(supabase, weddingId, proposal.kind, table, rows);
  }

  // Everything else goes after the existing rows, keeping the couple's order.
  const { data: last } = await supabase
    .from(table)
    .select("position")
    .eq("wedding_id", weddingId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const start = ((last?.position as number | undefined) ?? 0) + 1;
  const rows = proposal.items.map((item, i) => ({
    wedding_id: weddingId,
    position: start + i,
    ...item,
    ...(proposal.kind === "tasks" ? { created_by: user.id } : {}),
  }));
  return insert(supabase, weddingId, proposal.kind, table, rows);
}

async function insert(
  supabase: Awaited<ReturnType<typeof supabaseServer>>,
  weddingId: string,
  kind: ProposalKind,
  table: string,
  rows: Record<string, unknown>[],
): Promise<ApplyResult> {
  const { error, count } = await supabase.from(table).insert(rows, { count: "exact" });
  if (error) {
    console.error("applyProposal failed:", table, error.code, error.message);
    return {
      ok: false,
      error:
        error.code === "42501"
          ? "You don't have permission to edit this wedding."
          : "Couldn't save those. Please try again.",
    };
  }

  const href = PROPOSAL_TARGET[kind].path(weddingId);
  revalidatePath(`/w/${weddingId}`);
  revalidatePath(href);
  return { ok: true, added: count ?? rows.length, href };
}
