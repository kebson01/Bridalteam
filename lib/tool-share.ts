import { parseIsoDate } from "@/lib/checklist";

/**
 * Shareable results for the free tools. A tool's inputs live in the page URL
 * (?total=30000&guests=120), so a couple can send their budget split,
 * checklist or table count to a partner or parent as a link, and opening the
 * link shows the same result.
 *
 * Only the inputs go in the URL, never anything personal, and every value is
 * parsed and bounded here before a tool uses it: a link is something anyone
 * can edit. The pages keep their canonical URL without the query, so shared
 * links don't become extra pages in search results.
 */

const intIn = (raw: string | null, min: number, max: number): number | null => {
  if (raw === null || !/^\d{1,9}$/.test(raw)) return null;
  const n = Number(raw);
  return n >= min && n <= max ? n : null;
};

export interface BudgetShare {
  total: number | null;
  guests: number | null;
}

export function readBudgetShare(params: URLSearchParams): BudgetShare {
  return { total: intIn(params.get("total"), 1, 10_000_000), guests: intIn(params.get("guests"), 1, 5000) };
}

export function budgetQuery(total: number, guests: number | null): string {
  const q = new URLSearchParams();
  if (total > 0 && total <= 10_000_000) q.set("total", String(Math.round(total)));
  if (guests && guests > 0 && guests <= 5000) q.set("guests", String(guests));
  return q.toString();
}

export function readChecklistShare(params: URLSearchParams): string | null {
  const d = params.get("date");
  return d && parseIsoDate(d) !== null ? d : null;
}

export function checklistQuery(date: string): string {
  return parseIsoDate(date) !== null ? new URLSearchParams({ date }).toString() : "";
}

export interface TablesShare {
  guests: number | null;
  seats: number | null;
  head: number | null;
}

export function readTablesShare(params: URLSearchParams): TablesShare {
  return {
    guests: intIn(params.get("guests"), 1, 5000),
    seats: intIn(params.get("seats"), 1, 50),
    head: intIn(params.get("head"), 0, 100),
  };
}

export function tablesQuery(guests: number, seats: number, head: number): string {
  if (!(guests > 0 && guests <= 5000 && seats > 0 && seats <= 50)) return "";
  const q = new URLSearchParams({ guests: String(guests), seats: String(seats) });
  if (head > 0 && head <= 100) q.set("head", String(head));
  return q.toString();
}

/**
 * Puts the tool's inputs in the address bar without adding history entries
 * or reloading, so the URL is always the shareable one.
 */
export function replaceQuery(query: string) {
  const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    window.history.replaceState(window.history.state, "", url);
  }
}
