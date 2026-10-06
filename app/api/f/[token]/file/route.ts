import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Public. Streams a shared file through our own address, so the stored file's
// real address is never given out and switching a link off cuts the file off
// at once. ?download=1 sends it as a download, only if the owner allowed that.
export async function GET(req: Request, { params }: { params: { token: string } }) {
  const row = await prisma.sharedFile.findUnique({ where: { token: params.token } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const wantsDownload = new URL(req.url).searchParams.get("download") === "1";
  if (wantsDownload && !row.allowDownload) {
    return NextResponse.json({ error: "Downloads aren't switched on for this file." }, { status: 403 });
  }

  const upstream = await fetch(row.fileUrl);
  if (!upstream.ok || !upstream.body) return NextResponse.json({ error: "File unavailable" }, { status: 502 });

  const ext = row.contentType === "application/pdf" ? "pdf" : row.contentType === "image/png" ? "png" : "jpg";
  const safeName = row.title.replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 60) || "file";
  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": row.contentType,
      "Content-Disposition": `${wantsDownload ? "attachment" : "inline"}; filename="${safeName}.${ext}"`,
      "Cache-Control": "private, no-cache",
      "X-Robots-Tag": "noindex",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
