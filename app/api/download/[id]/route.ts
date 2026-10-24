import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayTitle } from "@/lib/titles";
import { getViewer } from "@/lib/viewer";
import { PREMIUM_ONLY_CATEGORIES } from "@/lib/plans";

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

  // Printed up the left-hand edge, in the margin: the foot of the sheets already carries the "Activity Central |
  // Bringing Moments to Life" line (and on some sheets the title or set number), and a stamp there ran over it.
  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();
    const big = Math.max(width, height) > 1000; // A3 large-print pages: a bit larger
    const size = big ? 9 : 6.5;
    const textWidth = font.widthOfTextAtSize(stamp, size);
    page.drawText(stamp, {
      x: big ? 19 : 13.5, // the text reads upwards, so this is the line it sits on; the letters rise to its left
      y: Math.max(8, (height - textWidth) / 2),
      size,
      font,
      rotate: degrees(90),
      color: rgb(0.5, 0.47, 0.43),
      opacity: 0.9,
    });
  }

  pdfDoc.setSubject(stamp);
  pdfDoc.setKeywords([whoFor]);
  return pdfDoc.save();
}

// Download links on the activity pages come through here so each download
// is recorded (for "Recently downloaded" and "Popular this month"), the
// file gets a quiet watermark naming the account before it's sent back, and
// the Standard plan's gating is enforced server-side (large print, and the
// three Premium-only categories), so a direct/guessed link can't be used to
// get around the UI.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    // Visitors who are not signed in can still be sent the home page's free sample for its category
    // (the on-screen players for pictures read the sheet's own PDF). It is the same file the
    // "Download free sample" button already links to, so nothing else is opened up.
    const wanted = new URL(req.url).searchParams.get("file") ?? "standard";
    const t = await prisma.template.findUnique({ where: { id: params.id } });
    if (wanted === "standard" && t?.fileUrl && !PREMIUM_ONLY_CATEGORIES.has(t.category)) {
      const official = await prisma.template.findFirst({
        where: { category: t.category, occasion: null, language: null, ...(t.category === "Sudoku" ? { subcategory: "beginner" } : {}) },
        orderBy: { fileName: "asc" },
        select: { id: true },
      });
      if (official?.id === t.id) {
        const file = await fetch(t.fileUrl);
        if (file.ok) {
          return new NextResponse(await file.arrayBuffer(), { headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline" } });
        }
      }
    }
    return NextResponse.redirect(new URL("/login?next=/dashboard", req.url));
  }

  const which = (new URL(req.url).searchParams.get("file") ?? "standard") as keyof typeof FILE_FIELDS;
  const field = FILE_FIELDS[which];
  const template = await prisma.template.findUnique({ where: { id: params.id } });
  const fileUrl = field && template ? template[field] : null;
  if (!template || !fileUrl) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const viewer = await getViewer();
  const premiumOnly = which === "large-print" || PREMIUM_ONLY_CATEGORIES.has(template.category);
  if (premiumOnly && !viewer.isPremium) {
    return NextResponse.redirect(new URL("/pricing", req.url));
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
