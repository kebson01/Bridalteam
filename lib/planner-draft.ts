/**
 * Keeps an in-progress planner conversation alive across a page load.
 *
 * ── The leak this closes ────────────────────────────────────────────────────
 * The anonymous demo is the product's best hook: three real answers, no
 * account, no card. But the conversation lived only in React state, so the
 * moment someone acted on the CTA the wall shows them — click "Create my free
 * account", navigate to /auth/signup — the thing they had just spent five
 * minutes building disappeared. They came back to a blank box and the canned
 * opener, having paid for an answer with an email address and received an
 * empty page.
 *
 * That is the worst possible moment to lose someone's work, because it is the
 * exact moment they decided the product was worth something.
 *
 * ── Why sessionStorage ──────────────────────────────────────────────────────
 * Same reasoning as lib/attribution.ts, and the same trade-off. It survives
 * navigation within the tab, which is the whole signup journey, and dies with
 * the tab, so nothing persists about people who never came back and there is
 * no cross-visit record to disclose or defend. Someone who signs up in a *new*
 * tab still loses the transcript; the alternative is keeping strangers'
 * half-written wedding plans on disk indefinitely, which is a much worse
 * trade for a feature this small.
 *
 * Nothing here reaches the network. The transcript stays in the visitor's own
 * browser until they send it to /api/plan themselves.
 */

const KEY = "bt_planner_draft";

/**
 * Caps. sessionStorage throws once the origin's quota is gone — and it throws
 * on the *write*, which would otherwise surface inside a render. A wedding
 * conversation that needs more than this is not one a restore helps.
 */
const MAX_MESSAGES = 40;
const MAX_CHARS = 60_000;

export type DraftMessage = { role: "user" | "assistant"; content: string };

function isMessage(value: unknown): value is DraftMessage {
  if (!value || typeof value !== "object") return false;
  const m = value as Record<string, unknown>;
  return (
    (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
  );
}

/** Persists the transcript. Never throws — a lost draft is not worth an error. */
export function saveDraft(messages: DraftMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = messages.slice(-MAX_MESSAGES);
    const json = JSON.stringify(trimmed);
    if (json.length > MAX_CHARS) return;
    sessionStorage.setItem(KEY, json);
  } catch {
    // Private mode, storage disabled, quota gone. Fine.
  }
}

/**
 * Reads the transcript back, or null if there isn't a usable one.
 *
 * Validates every entry rather than trusting the parse. This value is
 * `JSON.parse`d out of storage the visitor's own extensions can write to, and
 * it is rendered — so a malformed or hostile entry must be dropped here rather
 * than reaching the component.
 */
export function readDraft(): DraftMessage[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const messages = parsed.filter(isMessage).slice(-MAX_MESSAGES);
    return messages.length ? messages : null;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to do, and nothing worth telling anyone.
  }
}
