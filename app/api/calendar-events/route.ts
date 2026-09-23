import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Calendar events are scoped to the signed-in account (one login per care
// home), so every member of staff using that same login sees the same
// events — there is no separate per-staff visibility to manage.

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    // Not signed in: the calendar still renders with just the built-in
    // occasions, so return an empty list rather than an error.
    return NextResponse.json({ events: [] });
  }

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));
  if (!Number.isInteger(year)) {
    return NextResponse.json({ error: "Missing or invalid year" }, { status: 400 });
  }

  const events = await prisma.calendarEvent.findMany({
    where: { userId: session.user.id, year },
    orderBy: [{ month: "asc" }, { day: "asc" }],
  });

  return NextResponse.json({ events });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { year, month, day, title, time } = body ?? {};

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) || month < 0 || month > 11 ||
    !Number.isInteger(day) || day < 1 || day > 31 ||
    typeof title !== "string" || !title.trim()
  ) {
    return NextResponse.json({ error: "Missing or invalid event details" }, { status: 400 });
  }

  const event = await prisma.calendarEvent.create({
    data: {
      userId: session.user.id,
      year,
      month,
      day,
      title: title.trim().slice(0, 120),
      time: typeof time === "string" && time.trim() ? time.trim().slice(0, 40) : null,
    },
  });

  return NextResponse.json({ event });
}

