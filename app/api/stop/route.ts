import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail, siteUrl, stopConfirmEmail } from "@/lib/email";
import { makeStopToken } from "@/lib/stopToken";
import { withErrors } from "@/lib/apiHandler";

// "Stop emailing me" from the page linked in our emails to care homes. Typing an address here does NOT stop
// anything by itself: we email that address a link, and the opt-out happens when the owner confirms it
// (/api/stop/confirm). That way nobody can opt someone else out, and the answer is the same whether or not we
// hold the address, so this can't be used to find out who is on our lists.
const schema = z.object({ email: z.string().trim().toLowerCase().email().max(200) });

// Best effort, per copy of the site: one confirmation email per address every 5 minutes.
const recent = new Map<string, number>();

async function POST_(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  const email = parsed.data.email;

  const last = recent.get(email) ?? 0;
  if (Date.now() - last > 5 * 60_000) {
    if (recent.size > 500) recent.clear();
    recent.set(email, Date.now());
    const existing = await prisma.mailingContact.findUnique({ where: { email }, select: { unsubscribedAt: true } });
    // Already on the do-not-contact list: nothing to confirm, and no extra email to send.
    if (!existing?.unsubscribedAt) {
      await sendEmail(stopConfirmEmail(email, `${siteUrl()}/stop/confirm?t=${encodeURIComponent(makeStopToken(email))}`));
    }
  }
  return NextResponse.json({ ok: true });
}

export const POST = withErrors(POST_, "api/stop:POST");
