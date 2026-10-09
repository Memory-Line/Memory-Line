import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

// Adds someone to the promotional email list, or puts them back on it if they
// had unsubscribed and have now ticked the box again. Only call this when the
// person has actively agreed (a ticked box), never on their behalf.
export async function joinMailingList(email: string, name: string | null, source: string) {
  const address = email.trim().toLowerCase();
  await prisma.mailingContact.upsert({
    where: { email: address },
    create: { email: address, name, source, unsubscribeToken: randomBytes(24).toString("hex") },
    update: { name, unsubscribedAt: null, consentAt: new Date() },
  });
}

// Stops promotional email to this address (the account's own switch).
export async function leaveMailingList(email: string) {
  await prisma.mailingContact.updateMany({
    where: { email: email.trim().toLowerCase(), unsubscribedAt: null },
    data: { unsubscribedAt: new Date() },
  });
}

// Adds people the owner confirms have already agreed (e.g. friends with free
// access who said yes in person). Anyone already on the list is left alone, so
// this can never put back someone who unsubscribed.
export async function addAgreedContacts(people: { email: string; name: string | null }[], source: string) {
  let added = 0;
  for (const p of people) {
    const email = p.email.trim().toLowerCase();
    const exists = await prisma.mailingContact.findUnique({ where: { email }, select: { id: true } });
    if (exists) continue;
    await prisma.mailingContact.create({
      data: { email, name: p.name, source, unsubscribeToken: randomBytes(24).toString("hex") },
    });
    added++;
  }
  return added;
}

// People we're allowed to send promotional email to right now.
export function subscribedContacts() {
  return prisma.mailingContact.findMany({ where: { unsubscribedAt: null }, orderBy: { createdAt: "asc" } });
}

const escHtml = (t: string) => t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Turns the message the owner types (plain text, blank line between paragraphs)
// into the email's body, with an optional button. The text is escaped, so
// nothing typed can become HTML; the button must be a normal https address.
export function buildBroadcast(message: string, buttonLabel: string, buttonUrl: string): { html: string; text: string } | { error: string } {
  const paragraphs = message.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  let html = paragraphs
    .map((p) => `<p style="margin:0 0 14px;">${escHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  let text = paragraphs.join("\n\n");
  if (buttonLabel || buttonUrl) {
    if (!buttonLabel || !buttonUrl) return { error: "For a button, fill in both the button words and its web address." };
    if (!/^https:\/\/[^\s"'<>]+$/.test(buttonUrl)) return { error: "The button's web address must start with https://" };
    html += `<p style="margin:22px 0;"><a href="${escHtml(buttonUrl)}" style="display:inline-block;background:#8BA888;color:#FFFFFF;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px;">${escHtml(buttonLabel)}</a></p>`;
    text += `\n\n${buttonLabel}: ${buttonUrl}`;
  }
  return { html, text };
}
