import { prisma } from "@/lib/prisma";

// The name printed at the top of calendar printouts: a care home account's home
// name only. A personal account's name is never printed.
export async function getHomeName(userId: string | undefined): Promise<string | null> {
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, accountType: true } });
  return user?.accountType === "care-home" ? user.name : null;
}
