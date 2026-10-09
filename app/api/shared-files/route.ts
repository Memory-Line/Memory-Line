import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_CATEGORIES, MAX_ITEMS_PER_CATEGORY, MAX_SHARED_FILES, cleanTitle } from "@/lib/sharedFiles";
import { listOwnedLinks, getOwnedLink, publicShape } from "@/lib/sharedFilesDb";
import { canShareFiles, SHARED_FILES_PREMIUM_MESSAGE } from "@/lib/sharedFilesAccess";
import { verifyUploadedBlob } from "@/lib/sharedFilesBlob";

export const dynamic = "force-dynamic";

// The signed-in account's links (each with its sections and files) and its id
// (the browser needs the id to upload into its own storage folder).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const links = await listOwnedLinks(session.user.id);
  return NextResponse.json({ files: links.map(publicShape), userId: session.user.id });
}

// Make a new link from files the browser has already uploaded to storage.
// JSON: { title, allowDownload, categories: [{ name, blobUrls: [...] }] }.
// Each category is a section the visitor taps (Menu, Calendar...). A single
// category with no name means no sections: the files just show one after another.
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
    if (!(await canShareFiles())) return NextResponse.json({ error: SHARED_FILES_PREMIUM_MESSAGE }, { status: 403 });
    const userId = session.user.id;

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const title = cleanTitle(body.title);
    if (!title) return NextResponse.json({ error: "Give the link a title." }, { status: 400 });

    const count = await prisma.sharedFile.count({ where: { userId } });
    if (count >= MAX_SHARED_FILES) {
      return NextResponse.json({ error: `You can have up to ${MAX_SHARED_FILES} links. Delete one first.` }, { status: 400 });
    }

    const sections: { name: string; blobUrls: unknown[] }[] = Array.isArray(body.categories)
      ? body.categories.map((c: any) => ({ name: cleanTitle(c?.name), blobUrls: Array.isArray(c?.blobUrls) ? c.blobUrls : [] }))
      : [];
    if (sections.length === 0 || sections.length > MAX_CATEGORIES) {
      return NextResponse.json({ error: `Add between 1 and ${MAX_CATEGORIES} sections.` }, { status: 400 });
    }
    if (sections.length > 1 && sections.some((s) => !s.name)) {
      return NextResponse.json({ error: "Give every section a name." }, { status: 400 });
    }
    if (sections.some((s) => s.blobUrls.length === 0)) {
      return NextResponse.json({ error: "Add at least one file to every section." }, { status: 400 });
    }
    if (sections.some((s) => s.blobUrls.length > MAX_ITEMS_PER_CATEGORY)) {
      return NextResponse.json({ error: `A section can hold up to ${MAX_ITEMS_PER_CATEGORY} files.` }, { status: 400 });
    }

    const checkedSections: { name: string; files: { url: string; size: number; contentType: string }[] }[] = [];
    for (const s of sections) {
      const files = [];
      for (const u of s.blobUrls) {
        const checked = await verifyUploadedBlob(u, userId);
        if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 400 });
        files.push({ url: checked.url, size: checked.size, contentType: checked.kind.contentType });
      }
      checkedSections.push({ name: s.name, files });
    }

    const created = await prisma.$transaction(async (tx) => {
      const link = await tx.sharedFile.create({
        data: { userId, token: randomBytes(16).toString("hex"), title, allowDownload: body.allowDownload === true },
      });
      let position = 0;
      for (let ci = 0; ci < checkedSections.length; ci++) {
        const s = checkedSections[ci];
        const cat = s.name ? await tx.sharedCategory.create({ data: { sharedFileId: link.id, name: s.name, position: ci } }) : null;
        for (const f of s.files) {
          await tx.sharedFileItem.create({
            data: { sharedFileId: link.id, categoryId: cat?.id ?? null, fileUrl: f.url, contentType: f.contentType, sizeBytes: f.size, position: position++ },
          });
        }
      }
      return link;
    });
    const link = await getOwnedLink(created.id, userId);
    return NextResponse.json({ file: link ? publicShape(link) : null }, { status: 201 });
  } catch (err) {
    console.error("Shared file upload failed:", err);
    return NextResponse.json({ error: "The upload did not work. Please try again." }, { status: 500 });
  }
}
