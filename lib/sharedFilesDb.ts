import { prisma } from "@/lib/prisma";
import { OWNER_SELECT, ownerIsPremium } from "@/lib/ownerAccess";

const itemsInclude = { orderBy: { position: "asc" as const } };

// Links made before a link could hold several files kept their one file on the
// link itself. The first time such a link is read, move that file into the new
// items table so everything works the same way from then on.
async function migrateLegacy(ids: string[]) {
  if (ids.length === 0) return;
  const rows = await prisma.sharedFile.findMany({
    where: { id: { in: ids }, fileUrl: { not: null }, items: { none: {} } },
    select: { id: true, fileUrl: true, contentType: true, sizeBytes: true },
  });
  for (const r of rows) {
    if (!r.fileUrl || !r.contentType) continue;
    await prisma.sharedFileItem.create({
      data: { sharedFileId: r.id, fileUrl: r.fileUrl, contentType: r.contentType, sizeBytes: r.sizeBytes ?? 0, position: 0 },
    });
    await prisma.sharedFile.update({ where: { id: r.id }, data: { fileUrl: null, contentType: null, sizeBytes: null } });
  }
}

export async function listOwnedLinks(userId: string) {
  const first = await prisma.sharedFile.findMany({ where: { userId }, select: { id: true } });
  await migrateLegacy(first.map((l) => l.id));
  return prisma.sharedFile.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: itemsInclude },
  });
}

export async function getOwnedLink(id: string, userId: string) {
  await migrateLegacy([id]);
  return prisma.sharedFile.findFirst({ where: { id, userId }, include: { items: itemsInclude } });
}

export async function getLinkByToken(token: string) {
  const found = await prisma.sharedFile.findUnique({ where: { token }, select: { id: true } });
  if (!found) return null;
  await migrateLegacy([found.id]);
  const link = await prisma.sharedFile.findUnique({
    where: { token },
    include: { items: itemsInclude, user: { select: OWNER_SELECT } },
  });
  // Shared files is a Premium feature: if the owner has moved to Standard (or
  // cancelled), the link stops working. It works again if they upgrade.
  if (!link || !ownerIsPremium(link.user)) return null;
  return link;
}

// What the manager page needs about a link (never the stored file addresses).
export function publicShape(link: Awaited<ReturnType<typeof getOwnedLink>> & {}) {
  return {
    id: link.id,
    token: link.token,
    title: link.title,
    allowDownload: link.allowDownload,
    folderId: link.folderId,
    updatedAt: link.updatedAt,
    items: link.items.map((i) => ({ id: i.id, contentType: i.contentType, sizeBytes: i.sizeBytes })),
  };
}
