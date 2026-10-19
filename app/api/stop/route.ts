import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// "Stop emailing me" from the link in our emails to care homes. The address goes on the same
// do-not-contact list the mailing list already respects (MailingContact with unsubscribedAt set),
// so nothing we send through the site can reach it again, and the Mailing list page shows it.
// Anyone can add an address here, which can only ever stop emails, never start them.
const schema = z.object({ email: z.string().trim().toLowerCase().email().max(200) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  const email = parsed.data.email;
  await prisma.mailingContact.upsert({
    where: { email },
    create: { email, name: null, source: "stop-link", unsubscribeToken: randomBytes(24).toString("hex"), unsubscribedAt: new Date() },
    update: { unsubscribedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
