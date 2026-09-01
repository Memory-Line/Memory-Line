import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { templateById } from "@/lib/data";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { templateId } = await req.json().catch(() => ({}));
  const template = templateById(templateId);
  if (!template) {
    return NextResponse.json({ error: "Unknown template" }, { status: 400 });
  }

  await prisma.download.create({
    data: {
      userId: session.user.id,
      templateId: template.id,
      templateName: template.title,
      category: template.category,
    },
  });

  // In production this would return a signed URL to the real PDF asset
  // (e.g. from S3 / Vercel Blob) instead of just logging the event.
  return NextResponse.json({ ok: true });
}
