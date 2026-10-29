import { NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withErrors } from "@/lib/apiHandler";
import { auditAs } from "@/lib/audit";

const schema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

async function POST_(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: createHash("sha256").update(parsed.data.token).digest("hex") },
  });
  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This link has expired or was already used. Please ask for a new one." },
      { status: 400 }
    );
  }

  const changed = await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash: await bcrypt.hash(parsed.data.password, 10) },
    select: { id: true, email: true },
  });
  await auditAs(changed, "account.password.reset", { req, target: changed.email });
  // The link works once.
  await prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } });

  return NextResponse.json({ ok: true });
}

export const POST = withErrors(POST_, "api/password/reset:POST");
