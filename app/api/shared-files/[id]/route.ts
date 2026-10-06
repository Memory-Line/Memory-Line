import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put, del } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_SHARED_FILE_BYTES, blobPathFor, cleanTitle, detectKind } from "@/lib/sharedFiles";

export const dynamic = "force-dynamic";

const SELECT = { id: true, token: true, title: true, contentType: true, sizeBytes: true, allowDownload: true, updatedAt: true } as const;

// Change a file's title, whether visitors can download it, or replace the file
// itself (the link stays the same). Multipart: any of title, allowDownload, file.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });

    const existing = await prisma.sharedFile.findFirst({ where: { id: params.id, userId: session.user.id } });
    if (!existing) return NextResponse.json({ error: "File not found" }, { status: 404 });

    const form = await req.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const data: { title?: string; allowDownload?: boolean; fileUrl?: string; contentType?: string; sizeBytes?: number } = {};

    if (form.has("title")) {
      const title = cleanTitle(form.get("title"));
      if (!title) return NextResponse.json({ error: "Give the file a title." }, { status: 400 });
      data.title = title;
    }
    if (form.has("allowDownload")) data.allowDownload = form.get("allowDownload") === "true";

    const file = form.get("file");
    let oldUrl: string | null = null;
    if (file instanceof File) {
      if (file.size > MAX_SHARED_FILE_BYTES) {
        return NextResponse.json({ error: "That file is over 4MB. Try a smaller or compressed copy." }, { status: 400 });
      }
      const kind = detectKind(new Uint8Array(await file.slice(0, 16).arrayBuffer()));
      if (!kind) return NextResponse.json({ error: "Only PDF, JPG and PNG files can be shared." }, { status: 400 });
      const blob = await put(blobPathFor(session.user.id, data.title ?? existing.title, kind.ext), file, {
        access: "public",
        addRandomSuffix: true,
        contentType: kind.contentType,
      });
      oldUrl = existing.fileUrl;
      data.fileUrl = blob.url;
      data.contentType = kind.contentType;
      data.sizeBytes = file.size;
    }

    const updated = await prisma.sharedFile.update({ where: { id: existing.id }, data, select: SELECT });
    // The replaced file is no longer needed.
    if (oldUrl) await del(oldUrl).catch(() => {});
    return NextResponse.json({ file: updated });
  } catch (err) {
    console.error("Shared file update failed:", err);
    return NextResponse.json({ error: "That didn't save. Please try again." }, { status: 500 });
  }
}

// Switches the link off for good and removes the stored file.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const existing = await prisma.sharedFile.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ ok: true });
  await prisma.sharedFile.delete({ where: { id: existing.id } });
  await del(existing.fileUrl).catch(() => {});
  return NextResponse.json({ ok: true });
}
