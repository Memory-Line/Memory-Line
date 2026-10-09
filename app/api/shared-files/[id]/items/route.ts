import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_ITEMS_PER_LINK, cleanTitle } from "@/lib/sharedFiles";
import { getOwnedLink, publicShape } from "@/lib/sharedFilesDb";
import { canShareFiles, SHARED_FILES_PREMIUM_MESSAGE } from "@/lib/sharedFilesAccess";
import { verifyUploadedBlob } from "@/lib/sharedFilesBlob";

export const dynamic = "force-dynamic";

// Add another file to a link (up to 10), already uploaded by the browser. JSON: { blobUrl, name }.
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

    const body = await req.json().catch(() => null);
    const checked = await verifyUploadedBlob(body?.blobUrl, session.user.id);
    if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 400 });

    const position = link.items.reduce((max, i) => Math.max(max, i.position), -1) + 1;
    await prisma.sharedFileItem.create({
      data: { sharedFileId: link.id, fileUrl: checked.url, contentType: checked.kind.contentType, sizeBytes: checked.size, position, name: cleanTitle(body?.name) || null },
    });
    await prisma.sharedFile.update({ where: { id: link.id }, data: { updatedAt: new Date() } });

    const updated = await getOwnedLink(link.id, session.user.id);
    return NextResponse.json({ file: updated ? publicShape(updated) : null }, { status: 201 });
  } catch (err) {
    console.error("Adding a shared file failed:", err);
    return NextResponse.json({ error: "The upload did not work. Please try again." }, { status: 500 });
  }
}
