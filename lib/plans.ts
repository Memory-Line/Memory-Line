// The two pricing tiers (User.plan) and what's Premium-only. Kept apart
// from lib/featureList.ts: those are admin-granted extras for individual
// accounts, this is the plan every account is on. See lib/viewer.ts for
// how a page checks it (viewer.isPremium), same pattern as viewer.has(...).
export const PLANS = [
  { key: "standard", label: "Standard" },
  { key: "premium", label: "Premium" },
] as const;

export type PlanKey = (typeof PLANS)[number]["key"];

export function isPlanKey(key: unknown): key is PlanKey {
  return PLANS.some((p) => p.key === key);
}

// Categories a Standard account can see in menus and lists, but can't
// play, print or download from — every action button on their rows is
// replaced with an "Upgrade to Premium" prompt. Enforced again in
// app/api/download so a direct link can't be used to get around it.
export const PREMIUM_ONLY_CATEGORIES = new Set([
  "Communication Cards",
  "BSL Tools",
  "Physical & Exercise",
]);
