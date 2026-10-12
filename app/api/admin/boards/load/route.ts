import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import seed from "@/data/boards.seed.json";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Admin only. Loads the approved boards from the data file into the database,
// replacing whatever boards were there. Safe to run again after the file changes.
export async function POST() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const rows = (seed as any[]).map((b) => ({
    id: b.id, code: b.code, area: b.area, areaSlug: b.areaSlug, priority: b.priority, signOff: b.signOff,
    note: b.note ?? "", position: b.position, question: b.question, answers: b.answers,
  }));
  await prisma.$transaction([prisma.board.deleteMany({}), prisma.board.createMany({ data: rows })]);
  return NextResponse.json({ ok: true, boards: rows.length });
}

// Admin only. How many boards are loaded.
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  return NextResponse.json({ loaded: await prisma.board.count(), inFile: (seed as any[]).length });
}
