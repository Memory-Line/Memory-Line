import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { FeatureKey } from "@/lib/featureList";

// Who is looking at a page, and which extra features they have — for pages
// that show things only some accounts get (playing Sudoku online, the
// Completed button). The admin gets every feature, to see how they look.
export async function getViewer() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id as string | undefined;
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const isAdmin =
    !!session?.user?.email && !!adminEmail && session.user.email.toLowerCase() === adminEmail;
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { features: true } })
    : null;
  const features = new Set(user?.features ?? []);
  return {
    userId,
    isAdmin,
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
