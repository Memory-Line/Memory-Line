import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { del } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanTitle } from "@/lib/sharedFiles";
import { getOwnedLink, publicShape } from "@/lib/sharedFilesDb";

export const dynamic = "force-dynamic";

// Rename a section. JSON: { name }.
export async function PATCH(req: Request, { params }: { params: { id: string; catId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const link = await getOwnedLink(params.id, session.user.id);
  const cat = link?.categories.find((c) => c.id === params.catId);
  if (!link || !cat) return NextResponse.json({ error: "Section not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const name = cleanTitle(body?.name);
  if (!name) return NextResponse.json({ error: "Give the section a name." }, { status: 400 });
  await prisma.sharedCategory.update({ where: { id: cat.id }, data: { name } });
  await prisma.sharedFile.update({ where: { id: link.id }, data: { updatedAt: new Date() } });
  const updated = await getOwnedLink(link.id, session.user.id);
  return NextResponse.json({ file: updated ? publicShape(updated) : null });
}

// Delete a section and the files in it. A link always keeps at least one file.
export async function DELETE(_req: Request, { params }: { params: { id: string; catId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const link = await getOwnedLink(params.id, session.user.id);
  const cat = link?.categories.find((c) => c.id === params.catId);
  if (!link || !cat) return NextResponse.json({ error: "Section not found" }, { status: 404 });
  const gone = link.items.filter((i) => i.categoryId === cat.id);
  if (link.items.length - gone.length < 1) {
    return NextResponse.json({ error: "A link needs at least one file. Delete the link instead." }, { status: 400 });
  }
  await prisma.sharedFileItem.deleteMany({ where: { id: { in: gone.map((i) => i.id) } } });
  await prisma.sharedCategory.delete({ where: { id: cat.id } });
  await prisma.sharedFile.update({ where: { id: link.id }, data: { updatedAt: new Date() } });
  await Promise.all(gone.map((i) => del(i.fileUrl).catch(() => {})));
  const updated = await getOwnedLink(link.id, session.user.id);
  return NextResponse.json({ file: updated ? publicShape(updated) : null });
}
