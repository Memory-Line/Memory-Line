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

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const category = formData.get("category") as string | null;
  const title = formData.get("title") as string | null;

  if (!file || !category || !title) {
    return NextResponse.json({ error: "Missing file, category, or title" }, { status: 400 });
  }

  const blob = await put(`activities/${category}/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  const template = await prisma.template.create({
    data: {
      title,
      category,
      fileUrl: blob.url,
      fileName: file.name,
    },
  });

  return NextResponse.json({ ok: true, template });
}
