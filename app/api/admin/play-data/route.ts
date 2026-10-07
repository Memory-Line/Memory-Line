import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { occasionForPrefix } from "@/lib/calendarPack";

export const dynamic = "force-dynamic";

const CATEGORIES = ["Word Searches", "Guess the Word", "Crosswords", "Trivia", "Bingo"] as const;

const schema = z.object({
  prefix: z.string().regex(/^\d{2}[ab]?$/),
  category: z.enum(CATEGORIES),
  entries: z.array(z.object({ n: z.number().int().min(1), data: z.record(z.unknown()) })).min(1).max(100),
});

const numberOf = (fileName: string) => parseInt((fileName.split("/").pop() ?? fileName).match(/^(\d+)/)?.[1] ?? "", 10);

// Admin only. Loads the puzzle data for one calendar date and category: each
// entry (number n) is attached to the uploaded activity whose file name starts
// with that number. Sending the same entries again just replaces them.
export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "That data isn't in the expected shape." }, { status: 400 });
  const { prefix, category, entries } = parsed.data;

  const occasion = occasionForPrefix(prefix);
  if (!occasion) return NextResponse.json({ error: `Pack date ${prefix} has no activities page.` }, { status: 400 });

  const templates = await prisma.template.findMany({ where: { category, occasion }, select: { id: true, fileName: true } });
  const byNumber = new Map<number, string>();
  for (const t of templates) {
    const n = numberOf(t.fileName);
    if (Number.isFinite(n)) byNumber.set(n, t.id);
  }

  const rows = entries.filter((e) => byNumber.has(e.n)).map((e) => ({ templateId: byNumber.get(e.n)!, data: e.data as object }));
  if (rows.length > 0) {
    await prisma.playData.deleteMany({ where: { templateId: { in: rows.map((r) => r.templateId) } } });
    await prisma.playData.createMany({ data: rows });
  }
  return NextResponse.json({
    ok: true,
    attached: rows.length,
    missing: entries.filter((e) => !byNumber.has(e.n)).map((e) => e.n),
  });
}
