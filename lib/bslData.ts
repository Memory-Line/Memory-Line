import { prisma } from "@/lib/prisma";
import { BSL_SIGNS, bslGroup, type BslSign } from "@/lib/bslSigns";

// The printable BSL cards in the database, matched to the signs by file name, so a sign can be starred and printed.
export async function bslTemplateIds() {
  const rows = await prisma.template.findMany({
    where: { category: "BSL Tools", occasion: null },
    select: { id: true, fileName: true },
  });
  const byFile = new Map<string, string>();
  for (const r of rows) byFile.set(r.fileName.toLowerCase(), r.id);
  return byFile;
}

export function toItems(signs: BslSign[], byFile: Map<string, string>) {
  return signs.map((s) => ({
    slug: s.slug,
    title: s.title,
    group: s.group,
    groupLabel: bslGroup(s.group)?.label ?? "",
    templateId: byFile.get(s.file.toLowerCase()) ?? null,
  }));
}

export async function bslFavouriteIds(userId: string | undefined, ids: string[]) {
  if (!userId || ids.length === 0) return [];
  const rows = await prisma.favourite.findMany({ where: { userId, templateId: { in: ids } }, select: { templateId: true } });
  return rows.map((r) => r.templateId);
}

export { BSL_SIGNS };
