import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

// Stars (or un-stars) an activity for the signed-in account. JSON: { templateId, favourite }.
export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer.userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { templateId, favourite } = await req.json().catch(() => ({}));
  if (typeof templateId !== "string" || typeof favourite !== "boolean") {
    return NextResponse.json({ error: "Missing templateId or favourite" }, { status: 400 });
  }
  if (favourite) {
    const exists = await prisma.template.findUnique({ where: { id: templateId }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    await prisma.favourite.upsert({
      where: { userId_templateId: { userId: viewer.userId, templateId } },
      create: { userId: viewer.userId, templateId },
      update: {},
    });
  } else {
    await prisma.favourite.deleteMany({ where: { userId: viewer.userId, templateId } });
  }
  return NextResponse.json({ ok: true, favourite });
}
