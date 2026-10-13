import Link from "next/link";
import { MONTH_NAMES, WEEKDAYS, TAB_COLORS } from "@/lib/calendarShared";
import { loadMonthItems } from "@/lib/calendarMonth";

// A live calendar inside a shared link, laid out as a day list for phones: a big
// date on the left, the day's events as coloured bars on the right.
export default async function CalendarSection({
  userId,
  calendar,
  token,
  sectionId,
  year,
  month,
}: {
  userId: string;
  calendar: string;
  token: string;
  sectionId: string;
  year: number;
  month: number;
}) {
  const byDay = await loadMonthItems(userId, calendar, year, month);
  const days = Object.keys(byDay).map(Number).sort((a, b) => a - b);
  const prev = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);
  const href = (d: Date) => `/f/${token}?s=${sectionId}&m=${d.getFullYear()}-${d.getMonth() + 1}`;
  const arrow = { padding: "8px 16px", borderRadius: 999, border: "1px solid #EAE4D6", background: "#FBF9F4", color: "#3F3237", fontWeight: 700, fontSize: 15, textDecoration: "none" } as const;
  const today = new Date();
  const isThisMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div style={{ margin: "0 6px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <Link href={href(prev)} style={arrow} aria-label="Previous month">‹ {MONTH_NAMES[prev.getMonth()].slice(0, 3)}</Link>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 400, margin: 0, textAlign: "center" }}>
          {MONTH_NAMES[month]} {year}
        </h2>
        <Link href={href(next)} style={arrow} aria-label="Next month">{MONTH_NAMES[next.getMonth()].slice(0, 3)} ›</Link>
      </div>
      {days.length === 0 && <p style={{ textAlign: "center", fontSize: 15, color: "#8A7A6B", padding: "16px 0" }}>Nothing listed this month.</p>}
      {days.map((day) => {
        const weekday = (new Date(year, month, day).getDay() + 6) % 7;
        const c = TAB_COLORS[weekday];
        const isToday = isThisMonth && today.getDate() === day;
        return (
          <div key={day} style={{ display: "flex", gap: 12, padding: "10px 0", borderTop: "1px solid #F0EBDD" }}>
            <div style={{ width: 58, flex: "0 0 58px", textAlign: "center", borderRadius: 10, background: isToday ? "#B5714A" : "transparent", color: isToday ? "#fff" : "#3F3237", padding: "2px 0" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: isToday ? "#fff" : c.text }}>{WEEKDAYS[weekday].slice(0, 3)}</div>
              <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.1 }}>{day}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {byDay[day].map((it, k) => (
                <div key={k} style={{ background: c.bg, color: c.text, fontWeight: 700, fontSize: 16, lineHeight: 1.3, padding: "7px 10px", borderRadius: 8, marginBottom: 4, overflowWrap: "anywhere" }}>
                  {it.label}
                  {it.time ? ` · ${it.time}` : ""}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
