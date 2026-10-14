import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { noteIsEmpty } from "@/lib/noteLines";

export const dynamic = "force-dynamic";

const key = z.object({
  calendar: z.enum(["activity", "professional"]),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(0).max(11),
});
const putSchema = key.extend({
  text: z.string().max(3000),
  colour: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

// The signed-in account's note for one calendar month.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ note: null, include: true });
  const sp = new URL(req.url).searchParams;
  const parsed = key.safeParse({ calendar: sp.get("calendar"), year: Number(sp.get("year")), month: Number(sp.get("month")) });
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const note = await prisma.calendarNote.findUnique({
    where: { userId_calendar_year_month: { userId: session.user.id, calendar: parsed.data.calendar!, year: parsed.data.year!, month: parsed.data.month! } },
    select: { text: true, colour: true },
  });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { calendarNotesPrint: true } });
  return NextResponse.json({ note, include: user?.calendarNotesPrint ?? true });
}

// Saves (or clears) the note for one month.
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const parsed = putSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { text, colour } = parsed.data;
  const userId = session.user.id;
  const where = { calendar: parsed.data.calendar!, year: parsed.data.year!, month: parsed.data.month! };
  if (noteIsEmpty(text!)) {
    await prisma.calendarNote.deleteMany({ where: { userId, ...where } });
  } else {
    await prisma.calendarNote.upsert({
      where: { userId_calendar_year_month: { userId, ...where } },
      create: { userId, ...where, text: text!, colour: colour! },
      update: { text: text!, colour: colour! },
    });
  }
  return NextResponse.json({ ok: true });
}
