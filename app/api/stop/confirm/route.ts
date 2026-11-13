import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { readStopToken } from "@/lib/stopToken";
import { withErrors } from "@/lib/apiHandler";

// The confirmation step of "Stop emailing me". The address goes on the same do-not-contact list the mailing list
// already respects (MailingContact with unsubscribedAt set), so nothing we send through the site can reach it again.
async function POST_(req: Request) {
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const email = token.length > 0 && token.length < 600 ? readStopToken(token) : null;
  if (!email) {
    return NextResponse.json({ error: "This link has expired or isn't valid. Please ask for a new one." }, { status: 400 });
  }
  await prisma.mailingContact.upsert({
    where: { email },
    create: { email, name: null, source: "stop-link", unsubscribeToken: randomBytes(24).toString("hex"), unsubscribedAt: new Date() },
    update: { unsubscribedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}

export const POST = withErrors(POST_, "api/stop/confirm:POST");
