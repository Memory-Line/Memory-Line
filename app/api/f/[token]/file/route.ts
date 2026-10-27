import { NextResponse } from "next/server";
import { getLinkByToken } from "@/lib/sharedFilesDb";
import { withErrors } from "@/lib/apiHandler";

export const dynamic = "force-dynamic";

// Public. Streams one of a link's files through our own address, so the stored
// file's real address is never given out and deleting a link or file cuts it off
// at once. ?item=<id> picks the file (the first one if left out); ?download=1
// sends it as a download, only if the owner allowed that.
async function GET_(req: Request, { params }: { params: { token: string } }) {
  const link = await getLinkByToken(params.token);
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = new URL(req.url);
  const wantsDownload = url.searchParams.get("download") === "1";
  if (wantsDownload && !link.allowDownload) {
    return NextResponse.json({ error: "Downloads aren't switched on for this file." }, { status: 403 });
  }

  const itemId = url.searchParams.get("item");
  const index = itemId ? link.items.findIndex((i) => i.id === itemId) : 0;
  const item = index >= 0 ? link.items[index] : undefined;
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const upstream = await fetch(item.fileUrl);
  if (!upstream.ok || !upstream.body) return NextResponse.json({ error: "File unavailable" }, { status: 502 });

  const ext = item.contentType === "application/pdf" ? "pdf" : item.contentType === "image/png" ? "png" : "jpg";
  // The saved file is named after what the page shows above it: the section's name, or the link's title when the file
  // isn't in a section. Several files in the same section are told apart by their place in that section (as on the page).
  const section = item.categoryId ? link.categories.find((c) => c.id === item.categoryId) : undefined;
  const title = section?.name || link.title;
  const base = title.replace(/[^a-zA-Z0-9 _'&()-]/g, "").trim().slice(0, 80) || "file";
  const siblings = link.items.filter((i) => i.categoryId === item.categoryId);
  const fallback = `${siblings.length > 1 ? `${base} ${siblings.findIndex((i) => i.id === item.id) + 1}` : base}.${ext}`;
  // Files uploaded with their own name are saved under it; older ones keep the section or link title.
  const own = item.fileName ? (item.fileName.toLowerCase().endsWith(`.${ext}`) || (ext === "jpg" && /\.jpe?g$/i.test(item.fileName)) ? item.fileName : `${item.fileName}.${ext}`) : null;
  const saveAs = own ?? fallback;
  const ascii = saveAs.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": item.contentType,
      "Content-Disposition": `${wantsDownload ? "attachment" : "inline"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(saveAs)}`,
      "Cache-Control": "private, no-cache",
      "X-Robots-Tag": "noindex",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export const GET = withErrors(GET_, "api/f/[token]/file:GET");
