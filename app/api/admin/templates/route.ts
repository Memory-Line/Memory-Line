import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { displayTitle } from "@/lib/titles";
import { deleteStoredFiles } from "@/lib/storedFiles";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PAGE = 100;

// Admin only. A page of a category's regular activities, newest first, optionally
// filtered by a search word: ?category=…&q=…&page=1
export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const url = new URL(req.url);
  const category = url.searchParams.get("category") ?? "";
  const q = (url.searchParams.get("q") ?? "").trim();
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  if (!category) return NextResponse.json({ error: "Choose a category" }, { status: 400 });
  const where = {
    category,
    occasion: null,
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { fileName: { contains: q, mode: "insensitive" as const } }] } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.template.count({ where }),
    prisma.template.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE }),
  ]);
  return NextResponse.json({
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE)),
    items: rows.map((t) => ({ id: t.id, title: displayTitle(t), fileName: t.fileName, hasAnswers: !!t.answerFileUrl, hasLargePrint: !!t.largePrintFileUrl })),
  });
}

// Admin only. Give numbered issues new titles:
// { category, items: [{ subcategory, number, title }] }. The file name keeps its
// leading number so issues stay in order.
export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const category = typeof body.category === "string" ? body.category : "";
  const items: { subcategory: string; number: number; title: string }[] = Array.isArray(body.items) ? body.items.slice(0, 500) : [];
  if (!category || items.length === 0) return NextResponse.json({ error: "Nothing to rename." }, { status: 400 });
  const rows = await prisma.template.findMany({ where: { category, occasion: null }, select: { id: true, fileName: true, subcategory: true } });
  let renamed = 0;
  const missing: string[] = [];
  for (const it of items) {
    const title = String(it.title ?? "").trim();
    if (!title) continue;
    const row = rows.find((r) => {
      const n = parseInt((r.fileName.split(/[\/]/).pop() ?? "").match(/^(\d+)/)?.[1] ?? "", 10);
      return r.subcategory === it.subcategory && n === it.number;
    });
    if (!row) {
      missing.push(`${it.subcategory} ${it.number}`);
      continue;
    }
    const safe = title.replace(/[\\/:*?"<>|]/g, "");
    await prisma.template.update({
      where: { id: row.id },
      data: { title, fileName: `${String(it.number).padStart(3, "0")} ${safe}.pdf` },
    });
    renamed++;
  }
  return NextResponse.json({ ok: true, renamed, missing });
}

// Admin only. Delete activities for good, with their stored files: { ids: [...] }.
export async function DELETE(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids) ? body.ids.filter((i: unknown) => typeof i === "string").slice(0, 500) : [];
  if (ids.length === 0) return NextResponse.json({ error: "Tick at least one activity." }, { status: 400 });
  const rows = await prisma.template.findMany({
    where: { id: { in: ids } },
    select: { id: true, fileUrl: true, answerFileUrl: true, largePrintFileUrl: true },
  });
  await prisma.template.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
  await deleteStoredFiles(rows);
  return NextResponse.json({ ok: true, deleted: rows.length });
}
