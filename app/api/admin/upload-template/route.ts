import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (!session?.user?.email || !adminEmail || session.user.email.toLowerCase() !== adminEmail) {
    return null;
  }
  return session;
}

function buildYoutubeSearchUrl(title: string): string {
  const query = encodeURIComponent(`${title} singalong lyrics`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const category = formData.get("category") as string | null;
  const title = formData.get("title") as string | null;
  const isAnswer = formData.get("isAnswer") === "true";

  if (!file || !category || !title) {
    return NextResponse.json({ error: "Missing file, category, or title" }, { status: 400 });
  }

  const blob = await put(`activities/${category}/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  if (isAnswer) {
    const questionFileName = file.name.replace(/-answers(\.[^.]+)$/i, "$1");

    const match = await prisma.template.findFirst({
      where: { category, fileName: questionFileName },
    });

    if (!match) {
      return NextResponse.json(
        { error: `No matching question file found for "${file.name}" (looked for "${questionFileName}")` },
        { status: 404 }
      );
    }

    const updated = await prisma.template.update({
      where: { id: match.id },
      data: { answerFileUrl: blob.url },
    });

    return NextResponse.json({ ok: true, template: updated });
  }

  const videoUrl = category === "Sing-Along" ? buildYoutubeSearchUrl(title) : undefined;

  const template = await prisma.template.create({
    data: {
      title,
      category,
      fileUrl: blob.url,
      fileName: file.name,
      videoUrl,
    },
  });

  return NextResponse.json({ ok: true, template });
}
