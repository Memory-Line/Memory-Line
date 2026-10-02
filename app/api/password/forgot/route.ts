import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { passwordResetEmail, sendEmail, siteUrl } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

// Always answers the same way whether or not the email has an account, so
// this can't be used to find out who is a customer.
const SAME_ANSWER = { ok: true };

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user) return NextResponse.json(SAME_ANSWER);

  // At most one new link a minute per account, so the page can't be used to
  // flood someone's inbox.
  const recent = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 60_000) } },
  });
  if (recent) return NextResponse.json(SAME_ANSWER);

  // The link carries a random secret; only its hash is kept.
  const secret = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: createHash("sha256").update(secret).digest("hex"),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  await sendEmail(passwordResetEmail(user.email, user.name, `${siteUrl()}/reset-password?token=${secret}`));
  return NextResponse.json(SAME_ANSWER);
}
