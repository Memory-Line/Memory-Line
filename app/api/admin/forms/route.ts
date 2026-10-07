import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { WESTCLIFF_TEMPLATES } from "@/lib/westcliffForms";

export const dynamic = "force-dynamic";

// Admin only: list every questionnaire, make some from the Westcliff Lodge
// templates for an account, or delete one. The address the answers go to is set
// here and nowhere else, so a customer can never point a form at someone else.

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const forms = await prisma.sharedForm.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, token: true, title: true, notifyEmail: true, createdAt: true, user: { select: { email: true, name: true, features: true } } },
  });
  return NextResponse.json({ forms });
}

const schema = z.object({
  accountEmail: z.string().trim().email(),
  notifyEmail: z.string().trim().email(),
  templates: z.array(z.enum(["resident", "relatives", "employee"])).min(1, "Tick at least one questionnaire"),
});

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the email addresses and try again." }, { status: 400 });
  }

  const user = await prisma.user.findFirst({ where: { email: { equals: parsed.data.accountEmail, mode: "insensitive" } } });
  if (!user) return NextResponse.json({ error: `No account found for ${parsed.data.accountEmail}.` }, { status: 404 });
  if (!user.features.includes("questionnaires")) {
    return NextResponse.json(
      { error: `Switch on the Questionnaires feature for ${user.email} first (Accounts section of the admin page).` },
      { status: 400 }
    );
  }

  const made = [];
  for (const key of parsed.data.templates) {
    const t = WESTCLIFF_TEMPLATES.find((x) => x.key === key)!;
    made.push(
      await prisma.sharedForm.create({
        data: {
          userId: user.id,
          token: randomBytes(16).toString("hex"),
          title: t.def.title,
          intro: t.def.intro,
          thanks: t.def.thanks,
          items: t.def.items as unknown as object,
          notifyEmail: parsed.data.notifyEmail,
          logoPath: t.def.logoPath ?? null,
          brandLines: t.def.brandLines ?? null,
        },
        select: { id: true, token: true, title: true },
      })
    );
  }
  return NextResponse.json({ ok: true, made });
}

export async function DELETE(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.sharedForm.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
