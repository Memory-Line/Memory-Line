import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_ITEMS_PER_LINK, blobPathFor, checkUpload } from "@/lib/sharedFiles";
import { getOwnedLink, publicShape } from "@/lib/sharedFilesDb";
import { canShareFiles, SHARED_FILES_PREMIUM_MESSAGE } from "@/lib/sharedFilesAccess";

export const dynamic = "force-dynamic";

// Add another file to a link (up to 5). Multipart: file.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
    if (!(await canShareFiles())) return NextResponse.json({ error: SHARED_FILES_PREMIUM_MESSAGE }, { status: 403 });
    const link = await getOwnedLink(params.id, session.user.id);
    if (!link) return NextResponse.json({ error: "Link not found" }, { status: 404 });
    if (link.items.length >= MAX_ITEMS_PER_LINK) {
      return NextResponse.json({ error: `A link can hold up to ${MAX_ITEMS_PER_LINK} files.` }, { status: 400 });
    }

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
    const position = link.items.reduce((max, i) => Math.max(max, i.position), -1) + 1;
    await prisma.sharedFileItem.create({
      data: { sharedFileId: link.id, fileUrl: blob.url, contentType: checked.kind.contentType, sizeBytes: file.size, position },
    });
    await prisma.sharedFile.update({ where: { id: link.id }, data: { updatedAt: new Date() } });

    const updated = await getOwnedLink(link.id, session.user.id);
    return NextResponse.json({ file: updated ? publicShape(updated) : null }, { status: 201 });
  } catch (err) {
    console.error("Adding a shared file failed:", err);
    return NextResponse.json({ error: "The upload didn't work. Please try again." }, { status: 500 });
  }
}
