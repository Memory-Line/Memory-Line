import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put } from "@vercel/blob";
import { randomBytes } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_SHARED_FILES, MAX_SHARED_FILE_BYTES, blobPathFor, cleanTitle, detectKind } from "@/lib/sharedFiles";

export const dynamic = "force-dynamic";

const SELECT = { id: true, token: true, title: true, contentType: true, sizeBytes: true, allowDownload: true, updatedAt: true } as const;

// The signed-in account's shared files.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const files = await prisma.sharedFile.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: SELECT,
  });
  return NextResponse.json({ files });
}

// Upload a new file and get its link. Multipart: file, title, allowDownload.
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
    const title = cleanTitle(form?.get("title"));
    if (!title) return NextResponse.json({ error: "Give the file a title." }, { status: 400 });
    if (file.size > MAX_SHARED_FILE_BYTES) {
      return NextResponse.json({ error: "That file is over 4MB. Try a smaller or compressed copy." }, { status: 400 });
    }
    const kind = detectKind(new Uint8Array(await file.slice(0, 16).arrayBuffer()));
    if (!kind) return NextResponse.json({ error: "Only PDF, JPG and PNG files can be shared." }, { status: 400 });

    const count = await prisma.sharedFile.count({ where: { userId: session.user.id } });
    if (count >= MAX_SHARED_FILES) {
      return NextResponse.json({ error: `You can share up to ${MAX_SHARED_FILES} files. Remove one first.` }, { status: 400 });
    }

    const blob = await put(blobPathFor(session.user.id, title, kind.ext), file, {
      access: "public",
      addRandomSuffix: true,
      contentType: kind.contentType,
    });
    const created = await prisma.sharedFile.create({
      data: {
        userId: session.user.id,
        token: randomBytes(16).toString("hex"),
        title,
        fileUrl: blob.url,
        contentType: kind.contentType,
        sizeBytes: file.size,
        allowDownload: form?.get("allowDownload") === "true",
      },
      select: SELECT,
    });
    return NextResponse.json({ file: created }, { status: 201 });
  } catch (err) {
    console.error("Shared file upload failed:", err);
    return NextResponse.json({ error: "The upload didn't work. Please try again." }, { status: 500 });
  }
}
