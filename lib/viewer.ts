import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { FeatureKey } from "@/lib/featureList";

// The name of the cookie an admin uses to preview the site as Standard or
// Premium (set via POST /api/admin/preview-plan). Only ever reads for an
// admin account below — it has no effect for anyone else, so it can't be
// used to grant a real account Premium it doesn't have.
export const PREVIEW_PLAN_COOKIE = "admin_plan_preview";

// Who is looking at a page, which extra features they have (playing Sudoku
// online, the Completed button — lib/featureList.ts), and which pricing
// plan they're on (lib/plans.ts). The admin normally gets every feature and
// counts as Premium everywhere; the admin can temporarily preview the site
// as Standard instead (the admin_plan_preview cookie) to see what a paying
// account on that tier sees, without changing any real account's plan.
// Plan is a separate concept from features: an account with an admin-granted
// feature isn't automatically Premium, and vice versa.
export async function getViewer() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id as string | undefined;
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const isAdmin =
    !!session?.user?.email && !!adminEmail && session.user.email.toLowerCase() === adminEmail;
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { features: true, plan: true } })
    : null;
  const features = new Set(user?.features ?? []);
  const plan = user?.plan === "standard" ? "standard" : "premium";

  let previewPlan: "standard" | "premium" | null = null;
  if (isAdmin) {
    const raw = cookies().get(PREVIEW_PLAN_COOKIE)?.value;
    if (raw === "standard" || raw === "premium") previewPlan = raw;
  }

  return {
    userId,
    isAdmin,
    plan,
    previewPlan,
    isPremium: previewPlan ? previewPlan === "premium" : isAdmin || plan === "premium",
    has: (feature: FeatureKey) => isAdmin || features.has(feature),
  };
}

// Which of these activities this account has marked as completed.
export async function completedIds(userId: string | undefined, templateIds: string[]) {
  if (!userId || templateIds.length === 0) return [] as string[];
  const rows = await prisma.completion.findMany({
    where: { userId, templateId: { in: templateIds } },
    select: { templateId: true },
  });
  return rows.map((r) => r.templateId);
}
