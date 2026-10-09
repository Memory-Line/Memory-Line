import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { addAgreedContacts } from "@/lib/mailing";

// A cell starting with = + - @ can run as a formula when the file is opened in
// Excel, and names are typed by customers, so those get a ' put in front.
function cell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const contacts = await prisma.mailingContact.findMany({ orderBy: { createdAt: "asc" } });
  const rows = [
    ["Name", "Email", "Joined from", "Agreed on", "Status", "Unsubscribed on"],
    ...contacts.map((c) => [
      c.name ?? "",
      c.email,
      c.source,
      c.consentAt.toISOString().slice(0, 10),
      c.unsubscribedAt ? "Unsubscribed" : "Subscribed",
      c.unsubscribedAt ? c.unsubscribedAt.toISOString().slice(0, 10) : "",
    ]),
  ];
  const csv = "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="mailing-list.csv"',
    },
  });
}

// Adds free-access accounts the owner has ticked, because they've said yes in
// person. Only accounts that really have free access can be added this way.
export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const emails: string[] = Array.isArray(body?.emails) ? body.emails.filter((e: unknown) => typeof e === "string") : [];
  if (emails.length === 0) return NextResponse.json({ error: "Tick at least one person" }, { status: 400 });

  const users = await prisma.user.findMany({
    where: { email: { in: emails.map((e) => e.toLowerCase()) }, subscriptionStatus: "free" },
    select: { email: true, name: true },
  });
  const added = await addAgreedContacts(users, "free-access (agreed in person)");
  return NextResponse.json({ ok: true, added });
}
