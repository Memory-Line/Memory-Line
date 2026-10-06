import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";
import { userHasFeature } from "@/lib/features";

const MAX_LINKS = 10;

const schema = z.object({
  calendar: z.enum(["activity", "professional"]),
  year: z.number().int().min(2020).max(2100),
  months: z.array(z.number().int().min(0).max(11)).min(1, "Pick at least one month").max(12),
});

// The signed-in account's share links.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const links = await prisma.sharedCalendar.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, token: true, calendar: true, year: true, months: true, createdAt: true },
  });
  return NextResponse.json({ links });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { calendar, year } = parsed.data;
  const months = Array.from(new Set(parsed.data.months)).sort((a, b) => a - b);

  // The same access as the calendars themselves.
  const allowed =
    calendar === "professional"
      ? await userHasFeature(session.user.id, "professional-calendar")
      : (await getViewer()).isPremium;
  if (!allowed) return NextResponse.json({ error: "Your plan doesn't include this calendar" }, { status: 403 });

  const count = await prisma.sharedCalendar.count({ where: { userId: session.user.id } });
  if (count >= MAX_LINKS) {
    return NextResponse.json({ error: `You can have up to ${MAX_LINKS} links. Remove one first.` }, { status: 400 });
  }

  const link = await prisma.sharedCalendar.create({
    data: { userId: session.user.id, token: randomBytes(16).toString("hex"), calendar, year, months },
    select: { id: true, token: true, calendar: true, year: true, months: true, createdAt: true },
  });
  return NextResponse.json({ link }, { status: 201 });
}
