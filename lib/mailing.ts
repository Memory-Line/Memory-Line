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

// People we're allowed to send promotional email to right now.
export function subscribedContacts() {
  return prisma.mailingContact.findMany({ where: { unsubscribedAt: null }, orderBy: { createdAt: "asc" } });
}
