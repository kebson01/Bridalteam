/**
 * Vendor lookups for the on-site AI planner (/api/plan).
 *
 * These are the same `search_vendors` and `get_vendor` tools the MCP server
 * gives Claude and ChatGPT (lib/mcp/tools.ts), so the planner on our own site
 * recommends from exactly the directory an outside assistant sees: published
 * profiles only, read with the anon key, featured first.
 *
 * Unlike the propose_* tools (lib/planner-actions.ts), which end the turn and
 * become cards, these are *read* tools: /api/plan runs them, sends the result
 * back as a tool_result and lets the model carry on. They are offered to every
 * visitor, signed in or not, since nothing here touches a wedding.
 *
 * One change on the way through: absolute bridalteam.com links become
 * site-relative paths. The chat renderer (components/planner-chat.tsx) only
 * turns paths starting with "/" into links, which keeps a model, or a vendor
 * description it quotes, from putting an off-site link in the chat.
 */

import { createTools, type ToolRegistry, type VendorSource } from "@/lib/mcp/tools";
import { SITE_URL } from "@/lib/site";

export const VENDOR_LOOKUP_NAMES = ["search_vendors", "get_vendor"] as const;

/** Most lookup rounds per chat turn before the model must answer. */
export const MAX_LOOKUP_ROUNDS = 3;

export function vendorLookupRegistry(source: VendorSource): ToolRegistry {
  return createTools(source);
}

/**
 * The lookup tools in Messages API form. Derived from the MCP definitions so
 * the two never drift, and deterministic, so they stay in the cached prefix.
 */
export function vendorLookupTools(registry: ToolRegistry) {
  return VENDOR_LOOKUP_NAMES.map((name) => {
    const def = registry.byName.get(name)?.definition;
    if (!def) throw new Error(`MCP tool ${name} is missing`);
    return { name: def.name, description: def.description, input_schema: def.inputSchema };
  });
}

/** Rewrites absolute links to this site as paths ("https://bridalteam.com/v/x" -> "/v/x"). */
export function relativizeSiteLinks<T>(value: T, origin: string = SITE_URL): T {
  const json = JSON.stringify(value);
  if (json === undefined) return value;
  const escaped = origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return JSON.parse(json.replace(new RegExp(`${escaped}(?=/)`, "g"), ""));
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: unknown;
}

export function isVendorLookup(name: string | undefined): boolean {
  return (VENDOR_LOOKUP_NAMES as readonly string[]).includes(name ?? "");
}

/**
 * Tool results for every tool_use block in one assistant turn, in order. The
 * API requires a result for each call, so propose_* calls made alongside a
 * lookup get a short acknowledgement (they are already shown as cards).
 */
export async function toolResultsFor(
  blocks: ToolUseBlock[],
  registry: ToolRegistry,
): Promise<{ type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean }[]> {
  return Promise.all(
    blocks.map(async (b) => {
      if (!isVendorLookup(b.name)) {
        return {
          type: "tool_result" as const,
          tool_use_id: b.id,
          content: "Shown to the couple as a card. Nothing is saved until they tap Add.",
        };
      }
      const tool = registry.byName.get(b.name)!;
      const args = b.input && typeof b.input === "object" ? (b.input as Record<string, unknown>) : {};
      try {
        const result = await tool.run(args);
        if ("error" in result) {
          return { type: "tool_result" as const, tool_use_id: b.id, content: result.error, is_error: true };
        }
        return {
          type: "tool_result" as const,
          tool_use_id: b.id,
          content: JSON.stringify(relativizeSiteLinks(result.data)),
        };
      } catch (err) {
        console.error(`planner ${b.name} failed:`, err);
        return {
          type: "tool_result" as const,
          tool_use_id: b.id,
          content: "The vendor directory could not be read just now.",
          is_error: true,
        };
      }
    }),
  );
}
