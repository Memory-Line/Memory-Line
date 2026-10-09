import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { del } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanTitle } from "@/lib/sharedFiles";
import { getOwnedLink, publicShape } from "@/lib/sharedFilesDb";
import { canShareFiles, SHARED_FILES_PREMIUM_MESSAGE } from "@/lib/sharedFilesAccess";
import { verifyUploadedBlob } from "@/lib/sharedFilesBlob";

export const dynamic = "force-dynamic";

// Replace one file on a link with a new one the browser has already uploaded (the
// link stays the same). JSON: { blobUrl }.
export async function PUT(req: Request, { params }: { params: { id: string; itemId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
    if (!(await canShareFiles())) return NextResponse.json({ error: SHARED_FILES_PREMIUM_MESSAGE }, { status: 403 });
    const link = await getOwnedLink(params.id, session.user.id);
    const item = link?.items.find((i) => i.id === params.itemId);
    if (!link || !item) return NextResponse.json({ error: "File not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const checked = await verifyUploadedBlob(body?.blobUrl, session.user.id);
    if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 400 });

    await prisma.sharedFileItem.update({
      where: { id: item.id },
      data: { fileUrl: checked.url, contentType: checked.kind.contentType, sizeBytes: checked.size },
    });
    await prisma.sharedFile.update({ where: { id: link.id }, data: { updatedAt: new Date() } });
    await del(item.fileUrl).catch(() => {});

    const updated = await getOwnedLink(link.id, session.user.id);
    return NextResponse.json({ file: updated ? publicShape(updated) : null });
  } catch (err) {
    console.error("Replacing a shared file failed:", err);
    return NextResponse.json({ error: "That did not save. Please try again." }, { status: 500 });
  }
}

// Change the name a visitor sees for one file on the link. JSON: { name }.
export async function PATCH(req: Request, { params }: { params: { id: string; itemId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const link = await getOwnedLink(params.id, session.user.id);
  const item = link?.items.find((i) => i.id === params.itemId);
  if (!link || !item) return NextResponse.json({ error: "File not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  await prisma.sharedFileItem.update({ where: { id: item.id }, data: { name: cleanTitle(body?.name) || null } });
  await prisma.sharedFile.update({ where: { id: link.id }, data: { updatedAt: new Date() } });
  const updated = await getOwnedLink(link.id, session.user.id);
  return NextResponse.json({ file: updated ? publicShape(updated) : null });
}

// Remove one file from a link. A link always keeps at least one file; to
// remove the last one, delete the whole link.
export async function DELETE(_req: Request, { params }: { params: { id: string; itemId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const link = await getOwnedLink(params.id, session.user.id);
  const item = link?.items.find((i) => i.id === params.itemId);
  if (!link || !item) return NextResponse.json({ error: "File not found" }, { status: 404 });
  if (link.items.length <= 1) {
    return NextResponse.json({ error: "A link needs at least one file. Delete the link instead." }, { status: 400 });
  }
  await prisma.sharedFileItem.delete({ where: { id: item.id } });
  await prisma.sharedFile.update({ where: { id: link.id }, data: { updatedAt: new Date() } });
  await del(item.fileUrl).catch(() => {});
  const updated = await getOwnedLink(link.id, session.user.id);
  return NextResponse.json({ file: updated ? publicShape(updated) : null });
}
