import { prisma } from "@/lib/prisma";
import { occasionsForYear } from "@/lib/ukCalendar";
import { rotaLabelFor } from "@/lib/rota";
import { loadRota } from "@/lib/rotaDb";

export type DayItem = { label: string; time: string | null };

// Everything on one month of an account's calendar, by day of the month: the
// built-in dates (not on the professional calendar), the weekly rota if it's
// switched on, and the events the account added. Used by the public shared pages.
export async function loadMonthItems(userId: string, calendar: string, year: number, month: number) {
  const professional = calendar === "professional";
  const custom = await prisma.calendarEvent.findMany({
    where: { userId, year, month, calendar },
    orderBy: [{ day: "asc" }],
  });
  const rota = await loadRota(userId, calendar);
  const byDay: Record<number, DayItem[]> = {};
  if (!professional) for (const o of occasionsForYear(year)) if (o.month === month) (byDay[o.day] ??= []).push({ label: o.label, time: null });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const label = rotaLabelFor(rota, new Date(year, month, d));
    if (label) (byDay[d] ??= []).push({ label, time: null });
  }
  for (const e of custom) (byDay[e.day] ??= []).push({ label: e.title, time: e.time });
  return byDay;
}
