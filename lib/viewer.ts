import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { FeatureKey } from "@/lib/featureList";

// Who is looking at a page, which extra features they have (playing Sudoku
// online, the Completed button — lib/featureList.ts), and which pricing
// plan they're on (lib/plans.ts). The admin gets every feature and counts
// as Premium everywhere, to see how the site looks for a paying account.
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
  return {
    userId,
    isAdmin,
    plan,
    isPremium: isAdmin || plan === "premium",
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
