import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { del } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanTitle } from "@/lib/sharedFiles";
import { getOwnedLink, publicShape } from "@/lib/sharedFilesDb";
import { withErrors } from "@/lib/apiHandler";
import { auditAs } from "@/lib/audit";

export const dynamic = "force-dynamic";

// Change a link's title or whether visitors can download. Multipart or form
// fields: title, allowDownload (either or both). Files are changed through
// /api/shared-files/[id]/items.
async function PATCH_(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
    const existing = await getOwnedLink(params.id, session.user.id);
    if (!existing) return NextResponse.json({ error: "Link not found" }, { status: 404 });

    const form = await req.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const data: { title?: string; allowDownload?: boolean } = {};
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
async function DELETE_(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const existing = await getOwnedLink(params.id, session.user.id);
  if (!existing) return NextResponse.json({ ok: true });
  await prisma.sharedFile.delete({ where: { id: existing.id } });
  await auditAs({ id: session.user.id, email: session.user.email }, "account.shared-link.delete", { req: _req, target: existing.title, detail: `${existing.items.length} files` });
  await Promise.all(existing.items.map((i) => del(i.fileUrl).catch(() => {})));
  return NextResponse.json({ ok: true });
}

export const PATCH = withErrors(PATCH_, "api/shared-files/[id]:PATCH");
export const DELETE = withErrors(DELETE_, "api/shared-files/[id]:DELETE");
