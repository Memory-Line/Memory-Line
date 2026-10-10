import { prisma } from "@/lib/prisma";
import { CATEGORIES, type Category } from "@/lib/data";

// The categories people see: the built-in ones (lib/data.ts) minus any the admin has
// removed, plus any the admin has made. If the database can't be read the built-in
// list is used, so the site never ends up with no categories.
export type SiteCategory = Category & { icon?: string; custom?: boolean };

export function slugify(name: string) {
  return name.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function getCategories(): Promise<SiteCategory[]> {
  try {
    const [removed, custom] = await Promise.all([
      prisma.removedCategory.findMany({ select: { name: true } }),
      prisma.customCategory.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }] }),
    ]);
    const gone = new Set(removed.map((r) => r.name));
    return [
      ...CATEGORIES.filter((c) => !gone.has(c.key)),
      ...custom.map((c) => ({ key: c.name, slug: c.slug, color: c.color, tint: c.tint, icon: c.icon, custom: true })),
    ];
  } catch {
    return CATEGORIES;
  }
}

export async function getCategoryBySlug(slug: string) {
  return (await getCategories()).find((c) => c.slug === slug);
}
