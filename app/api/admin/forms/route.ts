import { NextResponse } from "next/server";
import { offLiveBlock } from "@/lib/env";
import { randomBytes } from "crypto";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { WESTCLIFF_TEMPLATES } from "@/lib/westcliffForms";
import { withErrors } from "@/lib/apiHandler";

export const dynamic = "force-dynamic";

// Admin only: list every questionnaire, make some from the Westcliff Lodge
// templates for an account, or delete one. The address the answers go to is set
// here and nowhere else, so a customer can never point a form at someone else.

async function GET_() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const forms = await prisma.sharedForm.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, token: true, title: true, notifyEmail: true, copyEmail: true, createdAt: true, user: { select: { email: true, name: true, features: true } } },
  });
  return NextResponse.json({ forms });
}

const schema = z.object({
  accountEmail: z.string().trim().email(),
  notifyEmail: z.string().trim().email(),
  copyEmail: z.string().trim().email().optional().or(z.literal("")),
  templates: z.array(z.enum(["resident", "relatives", "employee", "open"])).min(1, "Tick at least one questionnaire"),
});

async function POST_(req: Request) {
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
          copyEmail: parsed.data.copyEmail ? parsed.data.copyEmail : null,
          logoPath: t.def.logoPath ?? null,
          brandLines: t.def.brandLines ?? null,
        },
        select: { id: true, token: true, title: true },
      })
    );
  }
  return NextResponse.json({ ok: true, made });
}

async function DELETE_(req: Request) {
  const blocked = offLiveBlock();
  if (blocked) return blocked;
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.sharedForm.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}

export const GET = withErrors(GET_, "api/admin/forms:GET");
export const POST = withErrors(POST_, "api/admin/forms:POST");
export const DELETE = withErrors(DELETE_, "api/admin/forms:DELETE");
