import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { del } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanTitle } from "@/lib/sharedFiles";
import { getOwnedLink, publicShape } from "@/lib/sharedFilesDb";

export const dynamic = "force-dynamic";

// Change a link's title or whether visitors can download. Multipart or form
// fields: title, allowDownload (either or both). Files are changed through
// /api/shared-files/[id]/items.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
    const existing = await getOwnedLink(params.id, session.user.id);
    if (!existing) return NextResponse.json({ error: "Link not found" }, { status: 404 });

    const form = await req.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const data: { title?: string; allowDownload?: boolean; folderId?: string | null } = {};
    if (form.has("folderId")) {
      const wanted = String(form.get("folderId") ?? "");
      if (!wanted) {
        data.folderId = null;
      } else {
        const folder = await prisma.sharedFolder.findFirst({ where: { id: wanted, userId: session.user.id }, select: { id: true } });
        if (!folder) return NextResponse.json({ error: "Folder not found" }, { status: 400 });
        data.folderId = folder.id;
      }
    }
    if (form.has("title")) {
      const title = cleanTitle(form.get("title"));
      if (!title) return NextResponse.json({ error: "Give the link a title." }, { status: 400 });
      data.title = title;
    }
    if (form.has("allowDownload")) data.allowDownload = form.get("allowDownload") === "true";

    await prisma.sharedFile.update({ where: { id: existing.id }, data });
    const link = await getOwnedLink(existing.id, session.user.id);
    return NextResponse.json({ file: link ? publicShape(link) : null });
  } catch (err) {
    console.error("Shared link update failed:", err);
    return NextResponse.json({ error: "That didn't save. Please try again." }, { status: 500 });
  }
}

// Deletes the link for good, with all its files.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const existing = await getOwnedLink(params.id, session.user.id);
  if (!existing) return NextResponse.json({ ok: true });
  await prisma.sharedFile.delete({ where: { id: existing.id } });
  await Promise.all(existing.items.map((i) => del(i.fileUrl).catch(() => {})));
  return NextResponse.json({ ok: true });
}
