import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanTitle } from "@/lib/sharedFiles";

export const dynamic = "force-dynamic";

// Rename a folder. JSON: { name }.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = cleanTitle(body?.name);
  if (!name) return NextResponse.json({ error: "Give the folder a name." }, { status: 400 });
  const result = await prisma.sharedFolder.updateMany({ where: { id: params.id, userId: session.user.id }, data: { name } });
  if (result.count === 0) return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  return NextResponse.json({ folder: { id: params.id, name } });
}

// Delete a folder. Its links are kept and just become unfiled.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  await prisma.sharedFolder.deleteMany({ where: { id: params.id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
