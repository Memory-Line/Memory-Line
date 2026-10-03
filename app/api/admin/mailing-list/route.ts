import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

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
