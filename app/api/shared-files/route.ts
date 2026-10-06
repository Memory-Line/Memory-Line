import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put } from "@vercel/blob";
import { randomBytes } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_SHARED_FILES, blobPathFor, checkUpload, cleanTitle } from "@/lib/sharedFiles";
import { listOwnedLinks, getOwnedLink, publicShape } from "@/lib/sharedFilesDb";
import { canShareFiles, SHARED_FILES_PREMIUM_MESSAGE } from "@/lib/sharedFilesAccess";

export const dynamic = "force-dynamic";

// The signed-in account's links, each with its files (up to 5).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const links = await listOwnedLinks(session.user.id);
  return NextResponse.json({ files: links.map(publicShape) });
}

// Make a new link with its first file. Multipart: file, title, allowDownload.
// More files are added afterwards through /api/shared-files/[id]/items.
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
    if (!(await canShareFiles())) return NextResponse.json({ error: SHARED_FILES_PREMIUM_MESSAGE }, { status: 403 });

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
    const title = cleanTitle(form?.get("title"));
    if (!title) return NextResponse.json({ error: "Give the link a title." }, { status: 400 });
    const checked = await checkUpload(file);
    if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 400 });

    const count = await prisma.sharedFile.count({ where: { userId: session.user.id } });
    if (count >= MAX_SHARED_FILES) {
      return NextResponse.json({ error: `You can have up to ${MAX_SHARED_FILES} links. Delete one first.` }, { status: 400 });
    }

    const blob = await put(blobPathFor(session.user.id, title, checked.kind.ext), file, {
      access: "public",
      addRandomSuffix: true,
      contentType: checked.kind.contentType,
    });
    const created = await prisma.sharedFile.create({
      data: {
        userId: session.user.id,
        token: randomBytes(16).toString("hex"),
        title,
        allowDownload: form?.get("allowDownload") === "true",
        items: { create: { fileUrl: blob.url, contentType: checked.kind.contentType, sizeBytes: file.size, position: 0 } },
      },
    });
    const link = await getOwnedLink(created.id, session.user.id);
    return NextResponse.json({ file: link ? publicShape(link) : null }, { status: 201 });
  } catch (err) {
    console.error("Shared file upload failed:", err);
    return NextResponse.json({ error: "The upload didn't work. Please try again." }, { status: 500 });
  }
}
