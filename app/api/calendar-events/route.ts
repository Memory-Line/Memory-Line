import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userHasFeature } from "@/lib/features";

// Calendar events are scoped to the signed-in account (one login per care
// home), so every member of staff using that same login sees the same
// events — there is no separate per-staff visibility to manage.
//
// Each account has two separate calendars: "activity" (Holidays &
// Celebrations, everyone) and "professional" (blank, only for accounts
// with that feature switched on).
function calendarFrom(value: unknown): "activity" | "professional" | null {
  if (value === undefined || value === null || value === "" || value === "activity") return "activity";
  return value === "professional" ? "professional" : null;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    // Not signed in: the calendar still renders with just the built-in
    // occasions, so return an empty list rather than an error.
    return NextResponse.json({ events: [] });
  }

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));
  const calendar = calendarFrom(searchParams.get("calendar"));
  if (!Number.isInteger(year) || !calendar) {
    return NextResponse.json({ error: "Missing or invalid year or calendar" }, { status: 400 });
  }

  const events = await prisma.calendarEvent.findMany({
    where: { userId: session.user.id, year, calendar },
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
  const calendar = calendarFrom(body?.calendar);

  if (
    !calendar ||
    !Number.isInteger(year) ||
    !Number.isInteger(month) || month < 0 || month > 11 ||
    !Number.isInteger(day) || day < 1 || day > 31 ||
    typeof title !== "string" || !title.trim()
  ) {
    return NextResponse.json({ error: "Missing or invalid event details" }, { status: 400 });
  }
  if (calendar === "professional" && !(await userHasFeature(session.user.id, "professional-calendar"))) {
    return NextResponse.json({ error: "The professional calendar isn't switched on for this account" }, { status: 403 });
  }

  const event = await prisma.calendarEvent.create({
    data: {
      userId: session.user.id,
      calendar,
      year,
      month,
      day,
      title: title.trim().slice(0, 120),
      time: typeof time === "string" && time.trim() ? time.trim().slice(0, 40) : null,
    },
  });

  return NextResponse.json({ event });
}

