import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail, welcomeEmail } from "@/lib/email";
import { joinMailingList } from "@/lib/mailing";
import { COMING_SOON } from "@/lib/launch";
import { withErrors } from "@/lib/apiHandler";
import { auditAs } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  accountType: z.enum(["personal", "care-home"]).default("personal"),
  // Only true when the person ticked the (unticked-by-default) box.
  marketing: z.boolean().default(false),
});

async function POST_(req: Request) {
  // New accounts are closed for now (lib/launch.ts). Existing accounts are not affected.
  if (COMING_SOON) {
    return NextResponse.json({ error: "New sign-ups aren't open yet. If you already have an account, please log in." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, password, accountType, marketing } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, accountType, email: normalizedEmail, passwordHash },
  });

  await auditAs({ id: user.id, email: user.email }, "account.register", { req, target: user.email, detail: accountType });

  if (marketing) {
    // A list problem must never fail the signup either.
    await joinMailingList(user.email, user.name, "signup").catch((err) => console.error("Mailing list join failed:", err));
  }

  // Never lets an email problem fail the signup (sendEmail doesn't throw).
  await sendEmail(welcomeEmail(user.email, user.name));

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}

export const POST = withErrors(POST_, "api/register:POST");
