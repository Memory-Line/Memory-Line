import { prisma } from "@/lib/prisma";
import { ROTA_DAYS, ROTA_WEEKS, blankSlots, type RotaConfig } from "@/lib/rota";

// Reads the stored slots back into a clean 4 x 5 grid of text.
export function cleanSlots(value: unknown): string[][] {
  const grid = blankSlots();
  if (!Array.isArray(value)) return grid;
  for (let w = 0; w < ROTA_WEEKS; w++) {
    const row = (value as unknown[])[w];
    if (!Array.isArray(row)) continue;
    for (let d = 0; d < ROTA_DAYS; d++) {
      const cell = row[d];
      grid[w][d] = typeof cell === "string" ? cell.slice(0, 60) : "";
    }
  }
  return grid;
}

export async function loadRota(userId: string, calendar: string): Promise<RotaConfig | null> {
  const row = await prisma.calendarRota.findUnique({ where: { userId_calendar: { userId, calendar } } });
  if (!row) return null;
  return {
    enabled: row.enabled,
    mode: row.mode === "custom" ? "custom" : "preset",
    startDate: row.startDate,
    slots: cleanSlots(row.slots),
  };
}
