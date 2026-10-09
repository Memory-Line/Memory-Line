import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_SHARED_FILES, cleanTitle } from "@/lib/sharedFiles";
import { listOwnedLinks, getOwnedLink, publicShape } from "@/lib/sharedFilesDb";
import { canShareFiles, SHARED_FILES_PREMIUM_MESSAGE } from "@/lib/sharedFilesAccess";
import { verifyUploadedBlob } from "@/lib/sharedFilesBlob";

export const dynamic = "force-dynamic";

// The signed-in account's links (each with its files), its folders and its id
// (the browser needs the id to upload into its own storage folder).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const [links, folders] = await Promise.all([
    listOwnedLinks(session.user.id),
    prisma.sharedFolder.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "asc" }, select: { id: true, name: true } }),
  ]);
  return NextResponse.json({ files: links.map(publicShape), folders, userId: session.user.id });
}

// Make a new link from a file the browser has already uploaded to storage.
// JSON: { blobUrl, title, allowDownload, folderId }. More files are added
// afterwards through /api/shared-files/[id]/items.
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
    if (!(await canShareFiles())) return NextResponse.json({ error: SHARED_FILES_PREMIUM_MESSAGE }, { status: 403 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const title = cleanTitle(body.title);
    if (!title) return NextResponse.json({ error: "Give the link a title." }, { status: 400 });

    const count = await prisma.sharedFile.count({ where: { userId: session.user.id } });
    if (count >= MAX_SHARED_FILES) {
      return NextResponse.json({ error: `You can have up to ${MAX_SHARED_FILES} links. Delete one first.` }, { status: 400 });
    }

    let folderId: string | null = null;
    if (typeof body.folderId === "string" && body.folderId) {
      const folder = await prisma.sharedFolder.findFirst({ where: { id: body.folderId, userId: session.user.id }, select: { id: true } });
      if (!folder) return NextResponse.json({ error: "Folder not found" }, { status: 400 });
      folderId = folder.id;
    }

    const checked = await verifyUploadedBlob(body.blobUrl, session.user.id);
    if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 400 });

    const created = await prisma.sharedFile.create({
      data: {
        userId: session.user.id,
        token: randomBytes(16).toString("hex"),
        title,
        allowDownload: body.allowDownload === true,
        folderId,
        items: { create: { fileUrl: checked.url, contentType: checked.kind.contentType, sizeBytes: checked.size, position: 0, name: cleanTitle(body.itemName) || null } },
      },
    });
    const link = await getOwnedLink(created.id, session.user.id);
    return NextResponse.json({ file: link ? publicShape(link) : null }, { status: 201 });
  } catch (err) {
    console.error("Shared file upload failed:", err);
    return NextResponse.json({ error: "The upload did not work. Please try again." }, { status: 500 });
  }
}
