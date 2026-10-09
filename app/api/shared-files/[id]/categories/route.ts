import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_CATEGORIES, cleanTitle } from "@/lib/sharedFiles";
import { getOwnedLink, publicShape } from "@/lib/sharedFilesDb";

export const dynamic = "force-dynamic";

// Add a section (Menu, Calendar...) to a link. JSON: { name }. It starts empty.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const link = await getOwnedLink(params.id, session.user.id);
  if (!link) return NextResponse.json({ error: "Link not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const name = cleanTitle(body?.name);
  if (!name) return NextResponse.json({ error: "Give the section a name." }, { status: 400 });
  if (link.categories.length >= MAX_CATEGORIES) {
    return NextResponse.json({ error: `A link can have up to ${MAX_CATEGORIES} sections.` }, { status: 400 });
  }
  const position = link.categories.reduce((max, c) => Math.max(max, c.position), -1) + 1;
  await prisma.sharedCategory.create({ data: { sharedFileId: link.id, name, position } });
  await prisma.sharedFile.update({ where: { id: link.id }, data: { updatedAt: new Date() } });
  const updated = await getOwnedLink(link.id, session.user.id);
  return NextResponse.json({ file: updated ? publicShape(updated) : null }, { status: 201 });
}
