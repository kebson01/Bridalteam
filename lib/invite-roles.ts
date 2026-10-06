/**
 * The roles someone can be invited into, and how they are labelled.
 *
 * Pure data, no server imports, so both the client forms and the server
 * actions can share one list. They used to keep separate copies — a Set in
 * app/w/[id]/team/actions.ts and a labelled array in components/invite-panel.tsx
 * — which is how `planner_staff` ended up valid on the server and missing from
 * the only form that could send it.
 */
export const INVITE_ROLE_LABELS: ReadonlyArray<readonly [string, string]> = [
  ["partner", "Partner"],
  ["maid_of_honor", "Maid of Honor"],
  ["matron_of_honor", "Matron of Honor"],
  ["best_man", "Best Man"],
  ["bridesmaid", "Bridesmaid"],
  ["groomsman", "Groomsman"],
  ["mother_of_bride", "Mother of the Bride"],
  ["father_of_bride", "Father of the Bride"],
  ["mother_of_groom", "Mother of the Groom"],
  ["father_of_groom", "Father of the Groom"],
  ["usher", "Usher"],
  ["junior_bridesmaid", "Junior Bridesmaid"],
  ["flower_girl", "Flower Girl"],
  ["ring_bearer", "Ring Bearer"],
  ["helper", "Helper"],
  ["planner", "Wedding planner"],
  ["planner_staff", "Planner's team"],
] as const;

export const INVITE_ROLES: ReadonlySet<string> = new Set(
  INVITE_ROLE_LABELS.map(([value]) => value),
);

/**
 * The three rows the onboarding step opens with.
 *
 * Not arbitrary: these are the people a couple can name without thinking, which
 * is what makes an invite step convert at the moment they have least patience.
 * Anyone else is one "Add another" away.
 */
export const FIRST_INVITE_ROLES = ["maid_of_honor", "bridesmaid", "mother_of_bride"] as const;

/** Enough to cover the people a couple names immediately; see lib/invites.ts. */
export const MAX_INVITES_PER_SUBMIT = 5;

export function isInviteRole(value: unknown): value is string {
  return typeof value === "string" && INVITE_ROLES.has(value);
}

/** Lowercased and trimmed, which is how the unique index sees it. */
export function normalizeEmail(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

export function isEmailish(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

export type InviteRow = { email: string; role: string };

/**
 * Turns the onboarding step's email_0/role_0, email_1/role_1 … fields into the
 * rows actually worth sending.
 *
 * Pure, and separate from the server action, because every rule here is a
 * judgement that deserves a test rather than a comment:
 *
 *   - **Blank rows are skipped, not rejected.** The form opens with three and
 *     most couples fill one or two, so an empty row is the normal case.
 *   - **Duplicates collapse.** Left to the unique index, typing one address
 *     twice would read back as one invite plus one puzzling "already invited".
 *   - **Your own address is dropped.** It would create a pending invite you can
 *     never accept, since you are already the wedding's owner.
 *   - **Capped.** More than a handful in one click is a guest list, and the
 *     guest list has its own import; it is also a send burst on a domain that
 *     carries transactional mail.
 *
 * `get` takes FormData.get directly.
 */
export function parseInviteRows(
  get: (key: string) => unknown,
  ownEmail: unknown = "",
  max: number = MAX_INVITES_PER_SUBMIT,
): InviteRow[] {
  const own = normalizeEmail(ownEmail);
  const seen = new Set<string>();
  const rows: InviteRow[] = [];

  for (let i = 0; i < max; i++) {
    const email = normalizeEmail(get(`email_${i}`));
    if (!email) continue;
    if (seen.has(email)) continue;
    if (own && email === own) continue;
    seen.add(email);
    const role = get(`role_${i}`);
    rows.push({ email, role: typeof role === "string" ? role : "helper" });
  }

  return rows;
}
