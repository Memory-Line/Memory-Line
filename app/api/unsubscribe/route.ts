import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Used two ways: the unsubscribe page posts the token as JSON, and Gmail /
// Outlook's built-in "Unsubscribe" button posts to the link in the email
// (token in the ?t= part of the address) with no body we need to read.
export async function POST(req: Request) {
  const fromLink = new URL(req.url).searchParams.get("t");
  const body = fromLink ? null : await req.json().catch(() => null);
  const token = fromLink ?? (typeof body?.token === "string" ? body.token : "");
  if (token.length < 20 || token.length > 200) {
    return NextResponse.json({ error: "This unsubscribe link isn't valid." }, { status: 400 });
  }

  const contact = await prisma.mailingContact.findUnique({ where: { unsubscribeToken: token } });
  if (!contact) {
    return NextResponse.json({ error: "This unsubscribe link isn't valid." }, { status: 404 });
  }
  if (!contact.unsubscribedAt) {
    await prisma.mailingContact.update({ where: { id: contact.id }, data: { unsubscribedAt: new Date() } });
  }
  return NextResponse.json({ ok: true });
}
