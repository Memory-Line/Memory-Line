"use client";

import { useState } from "react";
import Link from "next/link";

type CalEvent = { day: number; label: string; bankHoliday?: boolean; link: string | null };

const MONTHS: { name: string; events: CalEvent[]; note: string }[] = [
  { name: "January", note: "Twelfth Night is shown on 5 January; some traditions observe it on 6 January. Lunar New Year falls on 6 February in 2027.", events: [
    { day: 1, label: "New Year's Day", bankHoliday: true, link: null },
    { day: 4, label: "Bank holiday (Scotland)", bankHoliday: true, link: null },
    { day: 5, label: "Twelfth Night", link: null },
    { day: 25, label: "Burns Night", link: null },
  ]},
  { name: "February", note: "Chinese / Lunar New Year: 6 February. Pancake Day: 9 February. Activity theme: friendship, familiar love songs and pancake traditions.", events: [
    { day: 6, label: "Chinese / Lunar New Year", link: null },
    { day: 9, label: "Pancake Day (Shrove Tuesday)", link: null },
    { day: 10, label: "Ash Wednesday", link: null },
    { day: 14, label: "Valentine's Day", link: null },
  ]},
  { name: "March", note: "Easter falls in March in 2027. Easter Monday is a bank holiday in England, Wales and Northern Ireland.", events: [
    { day: 1, label: "St David's Day", link: null },
    { day: 7, label: "Mother's Day (Mothering Sunday)", link: null },
    { day: 8, label: "International Women's Day", link: null },
    { day: 17, label: "St Patrick's Day", link: null },
    { day: 20, label: "First day of spring", link: null },
    { day: 21, label: "Palm Sunday", link: null },
    { day: 26, label: "Good Friday", bankHoliday: true, link: null },
    { day: 28, label: "Easter Sunday", link: null },
    { day: 29, label: "Easter Monday", bankHoliday: true, link: null },
  ]},
  { name: "April", note: "Easter was on 28 March this year; Easter Monday was on 29 March. Activity theme: spring gardens, flowers and St George's Day traditions.", events: [
    { day: 1, label: "April Fool's Day", link: null },
    { day: 23, label: "St George's Day", link: null },
  ]},
  { name: "May", note: "Chelsea Flower Show: 18-22 May. Mental Health Awareness Week: 2027 dates to be confirmed.", events: [
    { day: 1, label: "May Day", link: null },
    { day: 3, label: "Early May bank holiday", bankHoliday: true, link: null },
    { day: 8, label: "VE Day", link: null },
    { day: 12, label: "International Nurses Day", link: null },
    { day: 18, label: "Chelsea Flower Show begins", link: null },
    { day: 22, label: "Chelsea Flower Show ends", link: null },
    { day: 31, label: "Spring bank holiday", bankHoliday: true, link: null },
  ]},
  { name: "June", note: "Wimbledon: 28 June - 11 July. Trooping the Colour / King's Official Birthday: 2027 date to be confirmed.", events: [
    { day: 6, label: "D-Day anniversary", link: null },
    { day: 20, label: "Father's Day", link: null },
    { day: 21, label: "First day of summer", link: null },
    { day: 28, label: "Wimbledon begins", link: null },
  ]},
  { name: "July", note: "Wimbledon continues until 11 July. Summer / seaside celebrations: choose any day. Activity theme: seaside memories and summer music.", events: [
    { day: 4, label: "American Independence Day", link: null },
    { day: 7, label: "World Chocolate Day", link: null },
    { day: 11, label: "Wimbledon ends", link: null },
    { day: 12, label: "Battle of the Boyne (NI)", link: null },
  ]},
  { name: "August", note: "Notting Hill Carnival: 29-30 August. Bank holiday in England, Wales and NI on 30 August. Afternoon Tea Week: date to be confirmed.", events: [
    { day: 1, label: "Yorkshire Day", link: null },
    { day: 2, label: "Summer bank holiday (Scotland)", bankHoliday: true, link: null },
    { day: 8, label: "International Cat Day", link: null },
    { day: 15, label: "VJ Day", link: null },
    { day: 29, label: "Notting Hill Carnival begins", link: null },
    { day: 30, label: "Summer bank holiday", bankHoliday: true, link: null },
  ]},
  { name: "September", note: "Harvest Festival season: choose a date to suit your home or local community. Macmillan Coffee Morning: date to be confirmed.", events: [
    { day: 15, label: "Battle of Britain Day", link: null },
    { day: 21, label: "World Alzheimer's Day", link: null },
    { day: 22, label: "First day of autumn", link: null },
  ]},
  { name: "October", note: "Harvest Festival: local dates vary through September and October. Activity theme: autumn colours, harvest traditions and friendly Halloween crafts.", events: [
    { day: 1, label: "International Day of Older Persons", link: null },
    { day: 10, label: "World Mental Health Day", link: null },
    { day: 31, label: "Halloween", link: null },
  ]},
  { name: "November", note: "Advent begins on Sunday 28 November and continues into December. St Andrew's Day is a bank holiday in Scotland.", events: [
    { day: 1, label: "All Saints' Day", link: null },
    { day: 5, label: "Bonfire Night (Guy Fawkes Night)", link: null },
    { day: 11, label: "Armistice Day", link: null },
    { day: 14, label: "Remembrance Sunday", link: null },
    { day: 28, label: "Advent begins", link: null },
    { day: 30, label: "St Andrew's Day", bankHoliday: true, link: null },
  ]},
  { name: "December", note: "Advent continues. Hanukkah: sunset 24 December 2027 to nightfall 1 January 2028. Christmas Jumper Day: date to be confirmed.", events: [
    { day: 6, label: "St Nicholas Day", link: null },
    { day: 20, label: "First day of winter", link: null },
    { day: 24, label: "Christmas Eve / Hanukkah begins at sunset", link: null },
    { day: 25, label: "Christmas Day", bankHoliday: true, link: null },
    { day: 26, label: "Boxing Day", bankHoliday: true, link: null },
    { day: 27, label: "Christmas bank holiday (substitute)", bankHoliday: true, link: null },
    { day: 28, label: "Boxing Day bank holiday (substitute)", bankHoliday: true, link: null },
    { day: 31, label: "New Year's Eve", link: null },
  ]},
];

const YEAR = 2027;
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const PALETTE = [
  { bg: "#CFE3F2", text: "#3E6E96" },
  { bg: "#C9E6DD", text: "#2F7A63" },
  { bg: "#F1D2BE", text: "#B5714A" },
  { bg: "#DFD5EC", text: "#6E56A0" },
  { bg: "#F2E2B8", text: "#A6822C" },
  { bg: "#F2D6DA", text: "#B05F6C" },
];

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
      <div style={{ maxWidth: 920, margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 16, color: "#3F3237", letterSpacing: 0.5 }}>
            Memory-Line
          </div>
        </div>
        <p style={{ textAlign: "center", color: "#B5714A", fontWeight: 700, fontSize: 13, letterSpacing: 1.5, margin: "6px 0 2px" }}>
          HOLIDAYS &amp; CELEBRATIONS
        </p>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 700, textAlign: "center", color: "#3F3237", margin: "2px 0" }}>
          {month.name}
        </h1>
        <p style={{ textAlign: "center", color: "#8A7A6B", fontSize: 14, margin: "4px 0" }}>
          A year of meaningful moments together
        </p>
        <p style={{ textAlign: "center", color: "#3F3237", fontWeight: 700, fontSize: 15, margin: "2px 0 0" }}>
          {YEAR}
        </p>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, margin: "20px 0" }}>
          <button
            onClick={() => setMonthIndex((m) => (m === 0 ? 11 : m - 1))}
            style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #EAE4D6", background: "#fff", cursor: "pointer", fontWeight: 600, color: "#3F3237" }}
          >
            ← Previous
          </button>
          <button
            onClick={() => setMonthIndex((m) => (m === 11 ? 0 : m + 1))}
            style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #EAE4D6", background: "#fff", cursor: "pointer", fontWeight: 600, color: "#3F3237" }}
          >
            Next →
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EAE4D6", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #EAE4D6" }}>
            {WEEKDAYS.map((w) => (
              <div key={w} style={{ textAlign: "center", fontWeight: 700, fontSize: 11, color: "#6E8F73", padding: "10px 4px", letterSpacing: 0.3 }}>
                {w}
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {cells.map((day, i) => {
              const ev = day ? eventsByDay[day] : undefined;
              const colorIdx = day ? day % PALETTE.length : 0;
              const colors = PALETTE[colorIdx];
              return (
                <div
                  key={i}
                  style={{
                    minHeight: 96,
                    borderTop: i >= 7 ? "1px solid #EAE4D6" : "none",
                    borderLeft: i % 7 !== 0 ? "1px solid #EAE4D6" : "none",
                    padding: 8,
                    background: "#fff",
                  }}
                >
                  {day && (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#3F3237", marginBottom: 4 }}>{day}</div>
                      {ev &&
                        (ev.link ? (
                          <Link
                            href={ev.link}
                            style={{
                              fontSize: 10.5,
                              color: colors.text,
                              fontWeight: 700,
                              display: "block",
                              lineHeight: 1.3,
                            }}
                          >
                            {ev.label}
                          </Link>
                        ) : (
                          <div style={{ fontSize: 10.5, color: colors.text, fontWeight: 600, lineHeight: 1.3 }}>
                            {ev.label}
                            {ev.bankHoliday && <span style={{ marginLeft: 3 }}>●</span>}
                          </div>
                        ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #EAE4D6", borderRadius: 12, padding: "16px 20px", marginTop: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: "#B5714A", letterSpacing: 0.5, marginBottom: 6 }}>
            THIS MONTH
          </div>
          <p style={{ fontSize: 13, color: "#3F3237", margin: 0, lineHeight: 1.5 }}>
            {month.note}
          </p>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "#8A7A6B", marginTop: 16 }}>
          Memory-Line · memoryline.co.uk
        </p>
      </div>
    </div>
  );
}
