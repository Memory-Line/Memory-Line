// The built-in occasions on the Holidays & Celebrations calendar, worked out
// for any year: fixed dates stay put (Christmas Day, Halloween), and
// moveable ones follow their rules (Easter and the dates that hang off it,
// bank holidays and their weekend substitutes, Mother's/Father's Day,
// Remembrance Sunday, the equinoxes and solstices, Chinese New Year,
// Hanukkah, …).

export type CalendarOccasion = {
  month: number; // 0-11
  day: number;
  label: string;
  bankHoliday?: boolean;
  // Label of the occasion page this links to (lib/occasions.ts); defaults
  // to the event's own label. Substitute bank holidays link to the day
  // they stand in for.
  occasion?: string;
};

type Ymd = { month: number; day: number };

const utc = (year: number, month: number, day: number) => new Date(Date.UTC(year, month, day));
const ymd = (d: Date): Ymd => ({ month: d.getUTCMonth(), day: d.getUTCDate() });
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
const weekday = (d: Date) => d.getUTCDay(); // 0 = Sunday
const isWeekend = (d: Date) => weekday(d) === 0 || weekday(d) === 6;
const key = (d: Date) => d.toISOString().slice(0, 10);

// Easter Sunday (Gregorian), by the anonymous "Meeus/Jones/Butcher" rule.
function easter(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utc(year, month, day);
}

// The nth given weekday (0 = Sunday) of a month; n = -1 for the last one.
function nthWeekday(year: number, month: number, dow: number, n: number): Date {
  if (n > 0) {
    const first = utc(year, month, 1);
    return addDays(first, ((dow - weekday(first) + 7) % 7) + (n - 1) * 7);
  }
  const last = utc(year, month + 1, 0);
  return addDays(last, -((weekday(last) - dow + 7) % 7));
}

// Equinoxes and solstices (Meeus, Astronomical Algorithms ch. 27; within a
// minute or two for 2000-3000), as UK calendar dates.
const SEASON_MEAN = [
  [2451623.80984, 365242.37404, 0.05169, -0.00411, -0.00057], // March equinox
  [2451716.56767, 365241.62603, 0.00325, 0.00888, -0.0003], // June solstice
  [2451810.21715, 365242.01767, -0.11575, 0.00337, 0.00078], // September equinox
  [2451900.05952, 365242.74049, -0.06223, -0.00823, 0.00032], // December solstice
];
const SEASON_TERMS = [
  [485, 324.96, 1934.136], [203, 337.23, 32964.467], [199, 342.08, 20.186],
  [182, 27.85, 445267.112], [156, 73.14, 45036.886], [136, 171.52, 22518.443],
  [77, 222.54, 65928.934], [74, 296.72, 3034.906], [70, 243.58, 9037.513],
  [58, 119.81, 33718.147], [52, 297.17, 150.678], [50, 21.02, 2281.226],
  [45, 247.54, 29929.562], [44, 325.15, 31555.956], [29, 60.93, 4443.417],
  [18, 155.12, 67555.328], [17, 288.79, 4562.452], [16, 198.04, 62894.029],
  [14, 199.76, 31436.921], [12, 95.39, 14577.848], [12, 287.11, 31931.756],
  [12, 320.81, 34777.259], [9, 227.73, 1222.114], [8, 15.45, 16859.074],
];
const ukDateParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});
function seasonStart(year: number, which: 0 | 1 | 2 | 3): Ymd {
  const rad = Math.PI / 180;
  const Y = (year - 2000) / 1000;
  const [c0, c1, c2, c3, c4] = SEASON_MEAN[which];
  const jde0 = c0 + c1 * Y + c2 * Y ** 2 + c3 * Y ** 3 + c4 * Y ** 4;
  const T = (jde0 - 2451545) / 36525;
  const W = (35999.373 * T - 2.47) * rad;
  const dl = 1 + 0.0334 * Math.cos(W) + 0.0007 * Math.cos(2 * W);
  const S = SEASON_TERMS.reduce((sum, [a, b, c]) => sum + a * Math.cos((b + c * T) * rad), 0);
  const jde = jde0 + (0.00001 * S) / dl;
  // Julian day → time; ~69s for TT vs UTC, which never matters for the date.
  const instant = new Date((jde - 2440587.5) * 86400000 - 69000);
  const p = Object.fromEntries(ukDateParts.formatToParts(instant).map((x) => [x.type, x.value]));
  return { month: Number(p.month) - 1, day: Number(p.day) };
}

// Chinese / Lunar New Year as published (e.g. by the Hong Kong
// Observatory). The browser's own Chinese calendar gets 2027 and 2030 a day
// out (new moons right on midnight), so it's only used after this list ends.
const LUNAR_NEW_YEAR: Record<number, string> = {
  2025: "01-29", 2026: "02-17", 2027: "02-06", 2028: "01-26", 2029: "02-13",
  2030: "02-03", 2031: "01-23", 2032: "02-11", 2033: "01-31", 2034: "02-19",
  2035: "02-08", 2036: "01-28", 2037: "02-15", 2038: "02-04", 2039: "01-24",
  2040: "02-12", 2041: "02-01", 2042: "01-22", 2043: "02-10", 2044: "01-30",
  2045: "02-17", 2046: "02-06", 2047: "01-26", 2048: "02-14", 2049: "02-02",
  2050: "01-23",
};

// The first day in `year` whose date in another calendar passes `test`
// (null if this browser/server can't show that calendar).
function findInCalendar(
  year: number,
  locale: string,
  month: "numeric" | "long",
  test: (parts: Record<string, string>) => boolean
): Ymd | null {
  try {
    const f = new Intl.DateTimeFormat(locale, { month, day: "numeric", timeZone: "UTC" });
    for (let d = utc(year, 0, 1); d.getUTCFullYear() === year; d = addDays(d, 1)) {
      if (test(Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value])))) return ymd(d);
    }
  } catch {
    // calendar not supported
  }
  return null;
}

function lunarNewYear(year: number): Ymd | null {
  const listed = LUNAR_NEW_YEAR[year];
  if (listed) return { month: Number(listed.slice(0, 2)) - 1, day: Number(listed.slice(3)) };
  return findInCalendar(year, "en-u-ca-chinese", "numeric", (p) => p.month === "1" && p.day === "1");
}

// Hanukkah's first candle is lit on the evening of 24 Kislev.
function hanukkahEve(year: number): Ymd | null {
  return findInCalendar(year, "en-u-ca-hebrew", "long", (p) => p.month === "Kislev" && p.day === "24");
}

const cache = new Map<number, CalendarOccasion[]>();

export function occasionsForYear(year: number): CalendarOccasion[] {
  const cached = cache.get(year);
  if (cached) return cached;

  const events: CalendarOccasion[] = [];
  const add = (d: Date | Ymd | null, label: string, extra: Partial<CalendarOccasion> = {}) => {
    if (!d) return;
    const { month, day } = d instanceof Date ? ymd(d) : d;
    events.push({ month, day, label, ...extra });
  };

  // Bank holidays that fall at a weekend move to the next free weekday, in
  // order, so Christmas and Boxing Day never share one.
  const takenBankHolidays = new Set<string>();
  // The day itself keeps its bank-holiday colour either way.
  const bankHoliday = (d: Date, label: string, substituteLabel: string) => {
    add(d, label, { bankHoliday: true });
    let day = d;
    if (isWeekend(day)) {
      day = addDays(day, 1);
      while (isWeekend(day) || takenBankHolidays.has(key(day))) day = addDays(day, 1);
      add(day, substituteLabel, { bankHoliday: true, occasion: label });
    }
    takenBankHolidays.add(key(day));
  };

  const e = easter(year);

  // January
  bankHoliday(utc(year, 0, 1), "New Year's Day", "New Year's Day bank holiday (substitute)");
  // Scotland also has 2 January (or the next free weekday).
  {
    let d = utc(year, 0, 2);
    while (isWeekend(d) || takenBankHolidays.has(key(d))) d = addDays(d, 1);
    add(d, "Bank holiday (Scotland)", { bankHoliday: true });
    takenBankHolidays.add(key(d));
  }
  add(utc(year, 0, 5), "Twelfth Night");
  add(utc(year, 0, 25), "Burns Night");

  // February-April
  add(lunarNewYear(year), "Chinese / Lunar New Year");
  add(addDays(e, -47), "Pancake Day (Shrove Tuesday)");
  add(addDays(e, -46), "Ash Wednesday");
  add(utc(year, 1, 14), "Valentine's Day");
  add(utc(year, 2, 1), "St David's Day");
  add(addDays(e, -21), "Mother's Day (Mothering Sunday)"); // 4th Sunday of Lent
  add(utc(year, 2, 8), "International Women's Day");
  add(utc(year, 2, 17), "St Patrick's Day");
  add(seasonStart(year, 0), "First day of spring");
  add(addDays(e, -7), "Palm Sunday");
  add(addDays(e, -2), "Good Friday", { bankHoliday: true });
  add(e, "Easter Sunday");
  add(addDays(e, 1), "Easter Monday", { bankHoliday: true });
  add(utc(year, 3, 1), "April Fool's Day");
  add(utc(year, 3, 23), "St George's Day");

  // May-June
  const springBankHoliday = nthWeekday(year, 4, 1, -1);
  add(utc(year, 4, 1), "May Day");
  add(nthWeekday(year, 4, 1, 1), "Early May bank holiday", { bankHoliday: true });
  add(utc(year, 4, 8), "VE Day");
  add(utc(year, 4, 12), "International Nurses Day");
  // Usually Tuesday-Saturday of the week before the spring bank holiday;
  // the RHS confirms the dates each year.
  add(addDays(springBankHoliday, -6), "Chelsea Flower Show begins");
  add(addDays(springBankHoliday, -2), "Chelsea Flower Show ends");
  add(springBankHoliday, "Spring bank holiday", { bankHoliday: true });
  add(utc(year, 5, 6), "D-Day anniversary");
  add(nthWeekday(year, 5, 0, 3), "Father's Day");
  add(seasonStart(year, 1), "First day of summer");
  // Wimbledon starts five weeks before the first Monday of August and runs
  // for a fortnight.
  const wimbledon = addDays(nthWeekday(year, 7, 1, 1), -35);
  add(wimbledon, "Wimbledon begins");
  add(addDays(wimbledon, 13), "Wimbledon ends");

  // July-August
  add(utc(year, 6, 4), "American Independence Day");
  add(utc(year, 6, 7), "World Chocolate Day");
  add(utc(year, 6, 12), "Battle of the Boyne (NI)");
  const summerBankHoliday = nthWeekday(year, 7, 1, -1);
  add(utc(year, 7, 1), "Yorkshire Day");
  add(nthWeekday(year, 7, 1, 1), "Summer bank holiday (Scotland)", { bankHoliday: true });
  add(utc(year, 7, 8), "International Cat Day");
  add(utc(year, 7, 15), "VJ Day");
  add(addDays(summerBankHoliday, -1), "Notting Hill Carnival begins");
  add(summerBankHoliday, "Summer bank holiday", { bankHoliday: true });

  // September-November
  add(utc(year, 8, 15), "Battle of Britain Day");
  add(utc(year, 8, 21), "World Alzheimer's Day");
  add(seasonStart(year, 2), "First day of autumn");
  add(utc(year, 9, 1), "International Day of Older Persons");
  add(utc(year, 9, 10), "World Mental Health Day");
  add(utc(year, 9, 31), "Halloween");
  add(utc(year, 10, 1), "All Saints' Day");
  add(utc(year, 10, 5), "Bonfire Night (Guy Fawkes Night)");
  add(utc(year, 10, 11), "Armistice Day");
  add(nthWeekday(year, 10, 0, 2), "Remembrance Sunday");
  // Four Sundays before Christmas: the Sunday from 27 Nov to 3 Dec.
  const christmas = utc(year, 11, 25);
  add(addDays(christmas, -(weekday(christmas) || 7) - 21), "Advent begins");
  bankHoliday(utc(year, 10, 30), "St Andrew's Day", "St Andrew's Day bank holiday (substitute)");

  // December
  add(utc(year, 11, 6), "St Nicholas Day");
  add(seasonStart(year, 3), "First day of winter");
  add(hanukkahEve(year), "Hanukkah begins at sunset");
  add(utc(year, 11, 24), "Christmas Eve");
  bankHoliday(christmas, "Christmas Day", "Christmas bank holiday (substitute)");
  bankHoliday(utc(year, 11, 26), "Boxing Day", "Boxing Day bank holiday (substitute)");
  add(utc(year, 11, 31), "New Year's Eve");

  events.sort((a, b) => a.month - b.month || a.day - b.day);
  cache.set(year, events);
  return events;
}
