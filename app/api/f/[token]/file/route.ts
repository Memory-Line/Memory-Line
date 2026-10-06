import { NextResponse } from "next/server";
import { getLinkByToken } from "@/lib/sharedFilesDb";

export const dynamic = "force-dynamic";

// Public. Streams one of a link's files through our own address, so the stored
// file's real address is never given out and deleting a link or file cuts it off
// at once. ?item=<id> picks the file (the first one if left out); ?download=1
// sends it as a download, only if the owner allowed that.
export async function GET(req: Request, { params }: { params: { token: string } }) {
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
  const base = link.title.replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 60) || "file";
  const name = link.items.length > 1 ? `${base} ${index + 1}` : base;
  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": item.contentType,
      "Content-Disposition": `${wantsDownload ? "attachment" : "inline"}; filename="${name}.${ext}"`,
      "Cache-Control": "private, no-cache",
      "X-Robots-Tag": "noindex",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
