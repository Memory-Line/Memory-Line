import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayTitle } from "@/lib/titles";

const FILE_FIELDS = {
  standard: "fileUrl",
  "large-print": "largePrintFileUrl",
  answers: "answerFileUrl",
} as const;

// A quiet line added to the bottom of every download, naming whoever
// downloaded it. Doesn't stop anyone downloading or sharing a sheet, but
// makes a copy traceable back to the account it came from — the same idea
// as a stock-photo site watermarking previews, except here it's the real
// file (nothing else about the sheet changes). Also written into the PDF's
// own metadata, which survives even if the visible line is ever cropped out.
async function addWatermark(bytes: ArrayBuffer, whoFor: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(bytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const stamp = `Downloaded for ${whoFor} · ${new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })} · activitycentral.co.uk`;

  for (const page of pdfDoc.getPages()) {
    const { width } = page.getSize();
    const size = width > 900 ? 13 : 9; // a bit larger on A3 large-print pages
    const textWidth = font.widthOfTextAtSize(stamp, size);
    page.drawText(stamp, {
      x: Math.max(8, (width - textWidth) / 2),
      y: 20,
      size,
      font,
      color: rgb(0.58, 0.55, 0.51),
      opacity: 0.9,
    });
  }

  pdfDoc.setSubject(stamp);
  pdfDoc.setKeywords([whoFor]);
  return pdfDoc.save();
}

// Download links on the activity pages come through here so each download
// is recorded (for "Recently downloaded" and "Popular this month"), and the
// file gets a quiet watermark naming the account, before it's sent back.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login?next=/dashboard", req.url));
  }

  const which = (new URL(req.url).searchParams.get("file") ?? "standard") as keyof typeof FILE_FIELDS;
  const field = FILE_FIELDS[which];
  const template = await prisma.template.findUnique({ where: { id: params.id } });
  const fileUrl = field && template ? template[field] : null;
  if (!template || !fileUrl) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });
  const whoFor = user?.name || user?.email || "Activity Central";

  await prisma.download.create({
    data: {
      userId: session.user.id,
      templateId: template.id,
      templateName: displayTitle(template),
      category: template.category,
    },
  });

  const original = await fetch(fileUrl);
  if (!original.ok) {
    // The file itself couldn't be fetched (unlikely) — fall back to sending
    // people straight to it rather than showing an error.
    return NextResponse.redirect(fileUrl);
  }

  try {
    const watermarked = await addWatermark(await original.arrayBuffer(), whoFor);
    const fileName = fileUrl.split("/").pop() ?? "activity.pdf";
    return new NextResponse(Buffer.from(watermarked), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
      },
    });
  } catch (err) {
    console.error("Couldn't watermark PDF, sending the original instead:", err);
    return NextResponse.redirect(fileUrl);
  }
}
