import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Only the account whose email matches ADMIN_EMAIL can use this route.
// Everyone else (including paying customers) gets a 403.
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (!session?.user?.email || !adminEmail || session.user.email.toLowerCase() !== adminEmail) {
    return null;
  }
  return session;
}

// Strips known suffixes (answer sheet / large print markers, and any
// leading number prefix) so we can match a variant file back to the
// base template it belongs to, regardless of category.
function baseTitleFromFilename(name: string): string {
  const withoutExt = name.replace(/\.[^/.]+$/, "");
  const withoutLeadingNumber = withoutExt.replace(/^\d+[-_.\s]*/, "");
  const withoutSuffix = withoutLeadingNumber
    .replace(/[-_\s]*(answers?|large[-_\s]?print|l)$/i, "");
  const spaced = withoutSuffix.replace(/[-_]+/g, " ").trim();
  return spaced
    .split(" ")
    .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
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
  const isLargePrint = formData.get("isLargePrint") === "true";

  if (!file || !category || !title) {
    return NextResponse.json({ error: "Missing file, category, or title" }, { status: 400 });
  }

  const blob = await put(`activities/${category}/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  // Answer sheets and large print files attach to an existing base
  // template rather than creating a new one.
  if (isAnswer || isLargePrint) {
    const baseTitle = baseTitleFromFilename(file.name);
    const existing = await prisma.template.findFirst({
      where: { category, title: baseTitle },
      orderBy: { createdAt: "desc" },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error: `No matching base template found for "${file.name}" (looked for title "${baseTitle}" in category "${category}"). Upload the standard worksheet first.`,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.template.update({
      where: { id: existing.id },
      data: isAnswer
        ? { answerFileUrl: blob.url }
        : { largePrintFileUrl: blob.url },
    });

    return NextResponse.json({ ok: true, template: updated, matched: true });
  }

  const template = await prisma.template.create({
    data: {
      title,
      category,
      fileUrl: blob.url,
      fileName: file.name,
    },
  });

  return NextResponse.json({ ok: true, template, matched: false });
}
