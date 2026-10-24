import { revalidateTag } from "next/cache";
import { offLiveBlock } from "@/lib/env";
import { NextResponse } from "next/server";
import { deleteStoredFiles } from "@/lib/storedFiles";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { CATEGORIES } from "@/lib/data";
import { slugify } from "@/lib/categories";
import { ICON_CHOICES, COLOUR_CHOICES } from "@/lib/categoryIcons";
import { withErrors } from "@/lib/apiHandler";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Admin only. The categories (built-in and made by you) with how many activities each has.
async function GET_() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const [removed, custom, counts] = await Promise.all([
    prisma.removedCategory.findMany(),
    prisma.customCategory.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }] }),
    prisma.template.groupBy({ by: ["category"], where: { occasion: null }, _count: { _all: true } }),
  ]);
  const gone = new Set(removed.map((r) => r.name));
  const countFor = (name: string) => counts.find((c) => c.category === name)?._count._all ?? 0;
  return NextResponse.json({
    categories: [
      ...CATEGORIES.map((c) => ({ name: c.key, builtIn: true, removed: gone.has(c.key), count: countFor(c.key) })),
      ...custom.map((c) => ({ name: c.name, slug: c.slug, builtIn: false, removed: false, count: countFor(c.name), icon: c.icon, color: c.color })),
    ],
    icons: ICON_CHOICES,
    colours: COLOUR_CHOICES,
  });
}

// Admin only. Make a new category: { name, icon, colour } (colour is one of the choices' names).
async function POST_(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const body = await req.json().catch(() => ({}));

  if (body.action === "restore") {
    await prisma.removedCategory.deleteMany({ where: { name: String(body.name ?? "") } });
    revalidateTag("categories");
    return NextResponse.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.replace(/\s+/g, " ").trim().slice(0, 40) : "";
  if (!name) return NextResponse.json({ error: "Give the category a name." }, { status: 400 });
  const slug = slugify(name);
  if (!slug) return NextResponse.json({ error: "Use letters or numbers in the name." }, { status: 400 });
  const taken =
    CATEGORIES.some((c) => c.key.toLowerCase() === name.toLowerCase() || c.slug === slug) ||
    (await prisma.customCategory.findFirst({ where: { OR: [{ name }, { slug }] } }));
  if (taken) return NextResponse.json({ error: "There is already a category with that name." }, { status: 400 });
  const colour = COLOUR_CHOICES.find((c) => c.name === body.colour) ?? COLOUR_CHOICES[0];
  const icon = ICON_CHOICES.includes(body.icon) ? body.icon : "Star";
  const position = await prisma.customCategory.count();
  await prisma.customCategory.create({ data: { name, slug, icon, color: colour.color, tint: colour.tint, position } });
  revalidateTag("categories");
  return NextResponse.json({ ok: true }, { status: 201 });
}

// Admin only. Remove a category and all its activities for good: { name, confirm }.
// "confirm" must be the category's name typed out. A category you made is deleted; a
// built-in one is hidden everywhere (and can be brought back with Restore, empty).
async function DELETE_(req: Request) {
  const blocked = offLiveBlock();
  if (blocked) return blocked;
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "");
  if (!name || body.confirm !== name) return NextResponse.json({ error: "Type the category's name to confirm." }, { status: 400 });
  const builtIn = CATEGORIES.some((c) => c.key === name);
  const custom = await prisma.customCategory.findUnique({ where: { name } });
  if (!builtIn && !custom) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  // Only the regular library: activities inside calendar occasion packs are left alone.
  const rows = await prisma.template.findMany({
    where: { category: name, occasion: null },
    select: { id: true, fileUrl: true, answerFileUrl: true, largePrintFileUrl: true },
  });
  await prisma.template.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
  await deleteStoredFiles(rows);
  if (custom) await prisma.customCategory.delete({ where: { name } });
  else await prisma.removedCategory.upsert({ where: { name }, create: { name }, update: {} });
  revalidateTag("categories");
  return NextResponse.json({ ok: true, deleted: rows.length });
}

export const GET = withErrors(GET_, "api/admin/categories:GET");
export const POST = withErrors(POST_, "api/admin/categories:POST");
export const DELETE = withErrors(DELETE_, "api/admin/categories:DELETE");
