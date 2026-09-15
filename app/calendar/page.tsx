"use client";

import { useState } from "react";
import Link from "next/link";

// ---- 2027 calendar data ----
// "link" is the URL path to that category/occasion's page on the site.
// Leave "link" as null for anything that doesn't have a real page yet —
// it will show as plain text instead of a clickable date.
type CalEvent = { day: number; label: string; bankHoliday?: boolean; link: string | null };

const MONTHS: { name: string; events: CalEvent[]; note: string }[] = [
  { name: "January", note: "Twelfth Night is shown on 5 January; some traditions observe it on 6 January.", events: [
    { day: 1, label: "New Year's Day", bankHoliday: true, link: null },
    { day: 4, label: "Bank holiday (Scotland)", bankHoliday: true, link: null },
    { day: 5, label: "Twelfth Night", link: null },
    { day: 25, label: "Burns Night", link: null },
  ]},
  { name: "February", note: "Chinese/Lunar New Year: 6 February. Pancake Day: 9 February.", events: [
    { day: 6, label: "Chinese / Lunar New Year", link: null },
    { day: 9, label: "Pancake Day (Shrove Tuesday)", link: null },
    { day: 10, label: "Ash Wednesday", link: null },
    { day: 14, label: "Valentine's Day", link: null },
  ]},
  { name: "March", note: "Easter falls in March in 2027.", events: [
    { day: 1, label: "St David's Day", link: null },
    { day: 7, label: "Mother's Day", link: null },
    { day: 8, label: "International Women's Day", link: null },
    { day: 17, label: "St Patrick's Day", link: null },
    { day: 20, label: "First day of spring", link: null },
    { day: 21, label: "Palm Sunday", link: null },
    { day: 26, label: "Good Friday", bankHoliday: true, link: null },
    { day: 28, label: "Easter Sunday", link: null },
    { day: 29, label: "Easter Monday", bankHoliday: true, link: null },
  ]},
  { name: "April", note: "Easter was on 28 March this year.", events: [
    { day: 1, label: "April Fool's Day", link: null },
    { day: 23, label: "St George's Day", link: null },
  ]},
  { name: "May", note: "Chelsea Flower Show: 18-22 May.", events: [
    { day: 1, label: "May Day", link: null },
    { day: 3, label: "Early May bank holiday", bankHoliday: true, link: null },
    { day: 8, label: "VE Day", link: null },
    { day: 12, label: "International Nurses Day", link: null },
    { day: 18, label: "Chelsea Flower Show begins", link: null },
    { day: 22, label: "Chelsea Flower Show ends", link: null },
    { day: 31, label: "Spring bank holiday", bankHoliday: true, link: null },
  ]},
  { name: "June", note: "Wimbledon: 28 June - 11 July.", events: [
    { day: 6, label: "D-Day anniversary", link: null },
    { day: 20, label: "Father's Day", link: null },
    { day: 21, label: "First day of summer", link: null },
    { day: 28, label: "Wimbledon begins", link: null },
  ]},
  { name: "July", note: "Wimbledon continues until 11 July.", events: [
    { day: 4, label: "American Independence Day", link: null },
    { day: 7, label: "World Chocolate Day", link: null },
    { day: 11, label: "Wimbledon ends", link: null },
    { day: 12, label: "Battle of the Boyne (NI)", link: null },
  ]},
  { name: "August", note: "Notting Hill Carnival: 29-30 August.", events: [
    { day: 1, label: "Yorkshire Day", link: null },
    { day: 2, label: "Summer bank holiday (Scotland)", bankHoliday: true, link: null },
    { day: 8, label: "International Cat Day", link: null },
    { day: 15, label: "VJ Day", link: null },
    { day: 29, label: "Notting Hill Carnival begins", link: null },
    { day: 30, label: "Summer bank holiday", bankHoliday: true, link: null },
  ]},
  { name: "September", note: "Harvest Festival season: choose a date to suit your home.", events: [
    { day: 15, label: "Battle of Britain Day", link: null },
    { day: 21, label: "World Alzheimer's Day", link: null },
    { day: 22, label: "First day of autumn", link: null },
  ]},
  { name: "October", note: "Harvest Festival: local dates vary through September and October.", events: [
    { day: 1, label: "International Day of Older Persons", link: null },
    { day: 10, label: "World Mental Health Day", link: null },
    { day: 31, label: "Halloween", link: null },
  ]},
  { name: "November", note: "Advent begins on Sunday 28 November.", events: [
    { day: 1, label: "All Saints' Day", link: null },
    { day: 5, label: "Bonfire Night", link: null },
    { day: 11, label: "Armistice Day", link: null },
    { day: 14, label: "Remembrance Sunday", link: null },
    { day: 28, label: "Advent begins", link: null },
    { day: 30, label: "St Andrew's Day", bankHoliday: true, link: null },
  ]},
  { name: "December", note: "Hanukkah: sunset 24 December 2027 to nightfall 1 January 2028.", events: [
    { day: 6, label: "St Nicholas Day", link: null },
    { day: 20, label: "First day of winter", link: null },
    { day: 24, label: "Christmas Eve / Hanukkah begins", link: null },
    { day: 25, label: "Christmas Day", bankHoliday: true, link: null },
    { day: 26, label: "Boxing Day", bankHoliday: true, link: null },
    { day: 27, label: "Christmas bank holiday (substitute)", bankHoliday: true, link: null },
    { day: 28, label: "Boxing Day bank holiday (substitute)", bankHoliday: true, link: null },
    { day: 31, label: "New Year's Eve", link: null },
  ]},
];

const YEAR = 2027;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonthGrid(monthIndex: number) {
  const first = new Date(YEAR, monthIndex, 1);
  const startWeekday = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(YEAR, monthIndex + 1, 0).getDate();
  const cells: (number | null)[] = Array(startWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarPage() {
  const [monthIndex, setMonthIndex] = useState(0);
  const month = MONTHS[monthIndex];
  const cells = getMonthGrid(monthIndex);
  const eventsByDay = Object.fromEntries(month.events.map((e) => [e.day, e]));

  return (
    <div style={{ background: "#F5F0E4", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 32, textAlign: "center", color: "#3F3237" }}>
          {month.name} {YEAR}
        </h1>
        <p style={{ textAlign: "center", color: "#B5714A", fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
          HOLIDAYS &amp; CELEBRATIONS
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 16, margin: "20px 0" }}>
          <button
            onClick={() => setMonthIndex((m) => (m === 0 ? 11 : m - 1))}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #EAE4D6", background: "#fff", cursor: "pointer" }}
          >
            ← Previous
          </button>
          <button
            onClick={() => setMonthIndex((m) => (m === 11 ? 0 : m + 1))}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #EAE4D6", background: "#fff", cursor: "pointer" }}
          >
            Next →
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EAE4D6", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {WEEKDAYS.map((w) => (
              <div key={w} style={{ textAlign: "center", fontWeight: 700, fontSize: 12, color: "#6E8F73", padding: "10px 0" }}>
                {w}
              </div>
            ))}
            {cells.map((day, i) => {
              const ev = day ? eventsByDay[day] : undefined;
              return (
                <div
                  key={i}
                  style={{
                    minHeight: 90,
                    borderTop: "1px solid #EAE4D6",
                    borderLeft: i % 7 !== 0 ? "1px solid #EAE4D6" : "none",
                    padding: 6,
                    background: day && ev ? "#FBF3E4" : "#fff",
                  }}
                >
                  {day && (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#3F3237" }}>{day}</div>
                      {ev &&
                        (ev.link ? (
                          <Link
                            href={ev.link}
                            style={{ fontSize: 10, color: "#3E6E96", fontWeight: 700, textDecoration: "underline", display: "block", marginTop: 4 }}
                          >
                            {ev.label}
                          </Link>
                        ) : (
                          <div style={{ fontSize: 10, color: "#8A7A6B", marginTop: 4 }}>{ev.label}</div>
                        ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#8A7A6B", fontStyle: "italic", marginTop: 16 }}>
          {month.note}
        </p>
      </div>
    </div>
  );
}
