import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";
import { userHasFeature } from "@/lib/features";
import { ROTA_DAYS, ROTA_WEEKS, fromInputDate } from "@/lib/rota";
import { cleanSlots, loadRota } from "@/lib/rotaDb";

export const dynamic = "force-dynamic";

const calendarSchema = z.enum(["activity", "professional"]);

// The account's rota for one calendar (null if it has never set one up).
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ rota: null });
  const calendar = calendarSchema.safeParse(new URL(req.url).searchParams.get("calendar") ?? "activity");
  if (!calendar.success) return NextResponse.json({ error: "Unknown calendar" }, { status: 400 });
  return NextResponse.json({ rota: await loadRota(session.user.id, calendar.data) });
}

const bodySchema = z.object({
  calendar: calendarSchema,
  enabled: z.boolean(),
  mode: z.enum(["preset", "custom"]),
  startDate: z.string(),
  slots: z.array(z.array(z.string().max(60)).length(ROTA_DAYS)).length(ROTA_WEEKS),
});

// Saves the rota (on/off, preset or custom, start Monday, and the custom slots).
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "That rota isn't valid." }, { status: 400 });
  const { calendar, enabled, mode, slots } = parsed.data;

  // The start date has to be a real Monday.
  const start = fromInputDate(parsed.data.startDate);
  if (!start || start.getDay() !== 1) {
    return NextResponse.json({ error: "Week 1 has to start on a Monday." }, { status: 400 });
  }

  // Same access as the calendars themselves.
  const allowed =
    calendar === "professional"
      ? await userHasFeature(session.user.id, "professional-calendar")
      : (await getViewer()).isPremium;
  if (!allowed) return NextResponse.json({ error: "Your plan doesn't include this calendar." }, { status: 403 });

  const data = { enabled, mode, startDate: parsed.data.startDate, slots: cleanSlots(slots.map((r) => r.map((c) => c.trim()))) };
  await prisma.calendarRota.upsert({
    where: { userId_calendar: { userId: session.user.id, calendar } },
    create: { userId: session.user.id, calendar, ...data },
    update: data,
  });
  return NextResponse.json({ rota: await loadRota(session.user.id, calendar) });
}
