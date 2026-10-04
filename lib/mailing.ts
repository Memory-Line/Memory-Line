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
