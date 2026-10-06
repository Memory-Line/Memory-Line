// Public share links (shared files and shared calendars) only work while the
// account that made them still has the plan that includes them. If the owner
// moves to Standard or cancels, their links stop working straight away; if they
// upgrade again, the same links work again (nothing is deleted).

type Owner = { plan: string; email: string; subscriptionStatus: string };

const ACTIVE_STATUSES = ["active", "trialing", "free"];

function isAdmin(email: string) {
  return process.env.ADMIN_EMAIL?.toLowerCase() === email.toLowerCase();
}

// Still has a working account (paid, in a trial, or given free access).
export function ownerIsActive(owner: Owner) {
  return isAdmin(owner.email) || ACTIVE_STATUSES.includes(owner.subscriptionStatus);
}

// Active and on Premium.
export function ownerIsPremium(owner: Owner) {
  return isAdmin(owner.email) || (ownerIsActive(owner) && owner.plan === "premium");
}

// The fields of the owner that these checks need.
export const OWNER_SELECT = { name: true, accountType: true, plan: true, email: true, subscriptionStatus: true } as const;
