import { prisma } from "@/lib/prisma";
import type { FeatureKey } from "@/lib/featureList";

export { FEATURES, isFeatureKey, type FeatureKey } from "@/lib/featureList";

export async function userHasFeature(userId: string, feature: FeatureKey): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { features: true } });
  return user?.features.includes(feature) ?? false;
}
