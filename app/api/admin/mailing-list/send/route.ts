import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { promotionalEmail, sendEmail } from "@/lib/email";
import { buildBroadcast } from "@/lib/mailing";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The email service's free plan allows about 100 emails a day, so one press of
// "send" goes to at most this many people who haven't had this email yet.
const BATCH = 90;

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Nothing here sends by itself. Only the admin can call it, and only when they
// press a button on the Mailing list page:
//   { action: "test", subject, message, buttonLabel, buttonUrl }  -> one copy to the admin's own address
//   { action: "start", ...same }  -> saves the email and sends the first batch
//   { action: "next", campaignId } -> sends the next batch of the same email
// Only people who are subscribed (ticked the box, not unsubscribed) are emailed,
// and nobody gets the same email twice.
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  if (body.action === "test") {
    const subject = clean(body.subject, 150);
    const message = clean(body.message, 5000);
    if (!subject || !message) return NextResponse.json({ error: "Write a subject and a message first." }, { status: 400 });
    const built = buildBroadcast(message, clean(body.buttonLabel, 60), clean(body.buttonUrl, 300));
    if ("error" in built) return NextResponse.json({ error: built.error }, { status: 400 });
    const ok = await sendEmail(
      promotionalEmail(
        { email: session.user.email!, name: null, unsubscribeToken: "test" },
        `[TEST] ${subject}`,
        built.html,
        built.text
      )
    );
    if (!ok) return NextResponse.json({ error: "The test email did not send. Check the email key is set." }, { status: 502 });
    return NextResponse.json({ ok: true, sentTo: session.user.email });
  }

  let campaign;
  if (body.action === "start") {
    const subject = clean(body.subject, 150);
    const message = clean(body.message, 5000);
    if (!subject || !message) return NextResponse.json({ error: "Write a subject and a message first." }, { status: 400 });
    const buttonLabel = clean(body.buttonLabel, 60);
    const buttonUrl = clean(body.buttonUrl, 300);
    const built = buildBroadcast(message, buttonLabel, buttonUrl);
    if ("error" in built) return NextResponse.json({ error: built.error }, { status: 400 });
    campaign = await prisma.mailingCampaign.create({
      data: { subject, body: message, buttonLabel: buttonLabel || null, buttonUrl: buttonUrl || null },
    });
  } else if (body.action === "next") {
    campaign = await prisma.mailingCampaign.findUnique({ where: { id: String(body.campaignId ?? "") } });
    if (!campaign) return NextResponse.json({ error: "Email not found" }, { status: 404 });
  } else {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const built = buildBroadcast(campaign.body, campaign.buttonLabel ?? "", campaign.buttonUrl ?? "");
  if ("error" in built) return NextResponse.json({ error: built.error }, { status: 400 });

  const already = await prisma.mailingDelivery.findMany({ where: { campaignId: campaign.id }, select: { contactId: true } });
  const done = new Set(already.map((d) => d.contactId));
  const waiting = (await prisma.mailingContact.findMany({ where: { unsubscribedAt: null }, orderBy: { createdAt: "asc" } })).filter(
    (c) => !done.has(c.id)
  );
  const batch = waiting.slice(0, BATCH);

  let sent = 0;
  let failed = 0;
  for (const c of batch) {
    const ok = await sendEmail(promotionalEmail(c, campaign.subject, built.html, built.text));
    if (ok) {
      await prisma.mailingDelivery.create({ data: { campaignId: campaign.id, contactId: c.id } });
      sent++;
    } else {
      failed++;
    }
  }
  return NextResponse.json({ ok: true, campaignId: campaign.id, sent, failed, remaining: waiting.length - sent });
}
