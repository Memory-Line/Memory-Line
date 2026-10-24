import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";
import { withErrors } from "@/lib/apiHandler";

export const dynamic = "force-dynamic";

// Stars (or un-stars) an activity for the signed-in account. JSON: { templateId, favourite }.
async function POST_(req: Request) {
  const viewer = await getViewer();
  if (!viewer.userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { templateId, boardId, favourite } = await req.json().catch(() => ({}));
  if (typeof boardId === "string" && typeof favourite === "boolean") {
    // A talking board.
    if (favourite) {
      await prisma.boardFavourite.upsert({
        where: { userId_boardId: { userId: viewer.userId, boardId } },
        create: { userId: viewer.userId, boardId },
        update: {},
      });
    } else {
      await prisma.boardFavourite.deleteMany({ where: { userId: viewer.userId, boardId } });
    }
    return NextResponse.json({ ok: true, favourite });
  }
  if (typeof templateId !== "string" || typeof favourite !== "boolean") {
    return NextResponse.json({ error: "Missing templateId (or boardId) or favourite" }, { status: 400 });
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

export const POST = withErrors(POST_, "api/favourites:POST");
