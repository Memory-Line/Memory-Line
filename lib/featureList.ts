// Extra features the admin can switch on for individual accounts (from the
// Accounts section of the admin page). Everything else on the site is the
// same for every account. Stored as User.features. Kept apart from
// lib/features.ts (which reads the database) so pages in the browser can
// list them too.
export const FEATURES = [
  {
    key: "professional-calendar",
    label: "Professional calendar",
    description: "A blank calendar for the home's own events",
  },
] as const;

export type FeatureKey = (typeof FEATURES)[number]["key"];

export function isFeatureKey(key: unknown): key is FeatureKey {
  return FEATURES.some((f) => f.key === key);
}
