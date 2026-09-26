import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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

// Download links on the activity pages come through here so each download
// is recorded (for "Recently downloaded" and "Popular this month") before
// the browser is sent on to the PDF itself. Also where the Standard plan's
// gating is enforced server-side (large print, and the three Premium-only
// categories), so a direct/guessed link can't be used to get around the UI.
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

  const viewer = await getViewer();
  const premiumOnly = which === "large-print" || PREMIUM_ONLY_CATEGORIES.has(template.category);
  if (premiumOnly && !viewer.isPremium) {
    return NextResponse.redirect(new URL("/pricing", req.url));
  }

  await prisma.download.create({
    data: {
      userId: session.user.id,
      templateId: template.id,
      templateName: displayTitle(template),
      category: template.category,
    },
  });

  return NextResponse.redirect(fileUrl);
}
