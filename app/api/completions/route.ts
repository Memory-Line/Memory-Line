import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";

// Marks an activity as completed (or not) for the signed-in account. Only
// for accounts with the "completion-tracking" feature.
export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer.userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (!viewer.has("completion-tracking")) {
    return NextResponse.json({ error: "Completion tracking isn't switched on for this account" }, { status: 403 });
  }

  const { templateId, completed } = await req.json().catch(() => ({}));
  if (typeof templateId !== "string" || typeof completed !== "boolean") {
    return NextResponse.json({ error: "Missing templateId or completed" }, { status: 400 });
  }
  const exists = await prisma.template.findUnique({ where: { id: templateId }, select: { id: true } });
  if (!exists) {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  }

  const where = { userId_templateId: { userId: viewer.userId, templateId } };
  if (completed) {
    const row = await prisma.completion.upsert({
      where,
      create: { userId: viewer.userId, templateId },
      update: {},
    });
    return NextResponse.json({ ok: true, completed: true, completedAt: row.completedAt });
  }
  await prisma.completion.deleteMany({ where: { userId: viewer.userId, templateId } });
  return NextResponse.json({ ok: true, completed: false });
}
