import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_FOLDERS, cleanTitle } from "@/lib/sharedFiles";

export const dynamic = "force-dynamic";

// Make a new folder. JSON: { name }.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = cleanTitle(body?.name);
  if (!name) return NextResponse.json({ error: "Give the folder a name." }, { status: 400 });
  const count = await prisma.sharedFolder.count({ where: { userId: session.user.id } });
  if (count >= MAX_FOLDERS) {
    return NextResponse.json({ error: `You can have up to ${MAX_FOLDERS} folders.` }, { status: 400 });
  }
  const folder = await prisma.sharedFolder.create({ data: { userId: session.user.id, name } });
  return NextResponse.json({ folder: { id: folder.id, name: folder.name } }, { status: 201 });
}
