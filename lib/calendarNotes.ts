import { prisma } from "@/lib/prisma";

// The notes saved under each month, for the public shared calendar pages.
export async function loadNotes(userId: string, calendar: string, year: number, months: number[]) {
  const rows = await prisma.calendarNote.findMany({ where: { userId, calendar, year, month: { in: months } } });
  const byMonth: Record<number, { text: string; colour: string }> = {};
  for (const r of rows) if (r.text.trim()) byMonth[r.month] = { text: r.text, colour: r.colour };
  return byMonth;
}
