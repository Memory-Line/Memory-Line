// A home's repeating 4-week rota (Monday to Friday), shown on the calendar as a
// layer: nothing is saved for each date, the day's activity is worked out from the
// start date, so ticking it on or off is instant and it carries on through every
// month and year. Used by the calendar, Print dates and shared calendar links.

export const ROTA_WEEKS = 4;
export const ROTA_DAYS = 5; // Monday to Friday
export const ROTA_WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// The preset rota.
export const PRESET_ROTA: string[][] = [
  ["Board Games", "Colouring", "Spa Day", "Nail Painting", "Movie Day"],
  ["Reminiscence", "Arts & Crafts", "Sing-Along", "Chair Exercise", "Bingo"],
  ["Puzzles & Brain Games", "Cards & Dominoes", "Afternoon Tea & Social", "Hand Massage & Pamper", "Classic Movie"],
  ["Newspaper & Discussion", "Indoor Games", "Photo & Memory Afternoon", "Quiz Afternoon", "Friday Social"],
];

// The 20 activities every dropdown in "pick my own" offers (A to Z).
export const ROTA_ACTIVITIES = Array.from(new Set(PRESET_ROTA.flat())).sort((a, b) => a.localeCompare(b));

export type RotaConfig = {
  enabled: boolean;
  mode: "preset" | "custom";
  startDate: string; // YYYY-MM-DD, the Monday that Week 1 starts on
  slots: string[][]; // 4 weeks x 5 days, used when mode is "custom"
};

export function toInputDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function fromInputDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function mondayOf(d: Date) {
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

export function blankSlots(): string[][] {
  return Array.from({ length: ROTA_WEEKS }, () => Array(ROTA_DAYS).fill(""));
}

export function defaultRota(): RotaConfig {
  return {
    enabled: false,
    mode: "preset",
    startDate: toInputDate(mondayOf(new Date())),
    slots: PRESET_ROTA.map((row) => [...row]),
  };
}

// The rota's activity for one date, or null (rota off, weekend, or an empty slot).
// Weeks before the start date continue the same pattern backwards, so moving the
// start date only changes which week comes first.
export function rotaLabelFor(config: RotaConfig | null | undefined, date: Date): string | null {
  if (!config?.enabled) return null;
  const weekday = (date.getDay() + 6) % 7;
  if (weekday >= ROTA_DAYS) return null;
  const start = fromInputDate(config.startDate);
  if (!start) return null;
  const days = Math.round(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) /
      86_400_000
  );
  const week = ((Math.floor(days / 7) % ROTA_WEEKS) + ROTA_WEEKS) % ROTA_WEEKS;
  const grid = config.mode === "custom" ? config.slots : PRESET_ROTA;
  const label = grid[week]?.[weekday]?.trim();
  return label ? label : null;
}
