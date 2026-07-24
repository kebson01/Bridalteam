/** Preset group types users can pick from when creating a private group. */
export const GROUP_PRESETS = [
  { kind: "bridesmaids", label: "Bridesmaids", emoji: "💐" },
  { kind: "groomsmen", label: "Groomsmen", emoji: "🤵" },
  { kind: "party", label: "Bridal party", emoji: "🎉" },
  { kind: "family", label: "Family", emoji: "🏡" },
  { kind: "invitees", label: "Invitees", emoji: "✉️" },
  { kind: "other", label: "Other", emoji: "👥" },
] as const;

export const VALID_GROUP_KINDS = new Set<string>([
  ...GROUP_PRESETS.map((p) => p.kind),
  "custom",
]);
