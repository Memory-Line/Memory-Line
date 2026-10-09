import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canShareFiles, SHARED_FILES_PREMIUM_MESSAGE } from "@/lib/sharedFilesAccess";

export const dynamic = "force-dynamic";

// Switch on the public page for a folder (one link and QR code, with a tab for
// each link in the folder). Returns the folder's token; the same one if it was
// already on.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  if (!(await canShareFiles())) return NextResponse.json({ error: SHARED_FILES_PREMIUM_MESSAGE }, { status: 403 });
  const folder = await prisma.sharedFolder.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!folder) return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  const token = folder.token ?? randomBytes(16).toString("hex");
  if (!folder.token) await prisma.sharedFolder.update({ where: { id: folder.id }, data: { token } });
  return NextResponse.json({ token });
}

// Switch the folder's public page off. The links inside it are untouched.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  await prisma.sharedFolder.updateMany({ where: { id: params.id, userId: session.user.id }, data: { token: null } });
  return NextResponse.json({ ok: true });
}
