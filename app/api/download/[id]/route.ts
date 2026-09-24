import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const FILE_FIELDS = {
  standard: "fileUrl",
  "large-print": "largePrintFileUrl",
  answers: "answerFileUrl",
} as const;

// Download links on the activity pages come through here so each download
// is recorded (for "Recently downloaded" and "Popular this month") before
// the browser is sent on to the PDF itself.
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

  await prisma.download.create({
    data: {
      userId: session.user.id,
      templateId: template.id,
      templateName: template.title,
      category: template.category,
    },
  });

  return NextResponse.redirect(fileUrl);
}
