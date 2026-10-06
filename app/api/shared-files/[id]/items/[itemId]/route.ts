import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put, del } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { blobPathFor, checkUpload } from "@/lib/sharedFiles";
import { getOwnedLink, publicShape } from "@/lib/sharedFilesDb";

export const dynamic = "force-dynamic";

// Replace one file on a link with a new one (the link stays the same). Multipart: file.
export async function PUT(req: Request, { params }: { params: { id: string; itemId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
    const link = await getOwnedLink(params.id, session.user.id);
    const item = link?.items.find((i) => i.id === params.itemId);
    if (!link || !item) return NextResponse.json({ error: "File not found" }, { status: 404 });

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
    const checked = await checkUpload(file);
    if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 400 });

    const blob = await put(blobPathFor(session.user.id, link.title, checked.kind.ext), file, {
      access: "public",
      addRandomSuffix: true,
      contentType: checked.kind.contentType,
    });
    await prisma.sharedFileItem.update({
      where: { id: item.id },
      data: { fileUrl: blob.url, contentType: checked.kind.contentType, sizeBytes: file.size },
    });
    await prisma.sharedFile.update({ where: { id: link.id }, data: { updatedAt: new Date() } });
    await del(item.fileUrl).catch(() => {});

    const updated = await getOwnedLink(link.id, session.user.id);
    return NextResponse.json({ file: updated ? publicShape(updated) : null });
  } catch (err) {
    console.error("Replacing a shared file failed:", err);
    return NextResponse.json({ error: "That didn't save. Please try again." }, { status: 500 });
  }
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
