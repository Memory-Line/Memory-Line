"use client";

import { useState } from "react";
import Link from "next/link";

type CalEvent = { day: number; label: string; bankHoliday?: boolean; link: string | null };

const MONTHS: { name: string; slug: string; events: CalEvent[]; note: string }[] = [
  { name: "January", slug: "01-january", note: "Twelfth Night is shown on 5 January; some traditions observe it on 6 January. Lunar New Year falls on 6 February in 2027.", events: [
    { day: 1, label: "New Year's Day", bankHoliday: true, link: null },
    { day: 4, label: "Bank holiday (Scotland)", bankHoliday: true, link: null },
    { day: 5, label: "Twelfth Night", link: null },
    { day: 25, label: "Burns Night", link: null },
  ]},
  { name: "February", slug: "02-february", note: "Chinese / Lunar New Year: 6 February. Pancake Day: 9 February. Activity theme: friendship, familiar love songs and pancake traditions.", events: [
    { day: 6, label: "Chinese / Lunar New Year", link: null },
    { day: 9, label: "Pancake Day (Shrove Tuesday)", link: null },
    { day: 10, label: "Ash Wednesday", link: null },
    { day: 14, label: "Valentine's Day", link: null },
  ]},
  { name: "March", slug: "03-march", note: "Easter falls in March in 2027. Easter Monday is a bank holiday in England, Wales and Northern Ireland.", events: [
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
  { name: "April", slug: "04-april", note: "Easter was on 28 March this year; Easter Monday was on 29 March. Activity theme: spring gardens, flowers and St George's Day traditions.", events: [
    { day: 1, label: "April Fool's Day", link: null },
    { day: 23, label: "St George's Day", link: null },
  ]},
  { name: "May", slug: "05-may", note: "Chelsea Flower Show: 18-22 May. Mental Health Awareness Week: 2027 dates to be confirmed.", events: [
    { day: 1, label: "May Day", link: null },
    { day: 3, label: "Early May bank holiday", bankHoliday: true, link: null },
    { day: 8, label: "VE Day", link: null },
    { day: 12, label: "International Nurses Day", link: null },
    { day: 18, label: "Chelsea Flower Show begins", link: null },
    { day: 22, label: "Chelsea Flower Show ends", link: null },
    { day: 31, label: "Spring bank holiday", bankHoliday: true, link: null },
  ]},
  { name: "June", slug: "06-june", note: "Wimbledon: 28 June - 11 July. Trooping the Colour / King's Official Birthday: 2027 date to be confirmed.", events: [
    { day: 6, label: "D-Day anniversary", link: null },
    { day: 20, label: "Father's Day", link: null },
    { day: 21, label: "First day of summer", link: null },
    { day: 28, label: "Wimbledon begins", link: null },
  ]},
  { name: "July", slug: "07-july", note: "Wimbledon continues until 11 July. Summer / seaside celebrations: choose any day. Activity theme: seaside memories and summer music.", events: [
    { day: 4, label: "American Independence Day", link: null },
    { day: 7, label: "World Chocolate Day", link: null },
    { day: 11, label: "Wimbledon ends", link: null },
    { day: 12, label: "Battle of the Boyne (NI)", link: null },
  ]},
  { name: "August", slug: "08-august", note: "Notting Hill Carnival: 29-30 August. Bank holiday in England, Wales and NI on 30 August. Afternoon Tea Week: date to be confirmed.", events: [
    { day: 1, label: "Yorkshire Day", link: null },
    { day: 2, label: "Summer bank holiday (Scotland)", bankHoliday: true, link: null },
    { day: 8, label: "International Cat Day", link: null },
    { day: 15, label: "VJ Day", link: null },
    { day: 29, label: "Notting Hill Carnival begins", link: null },
    { day: 30, label: "Summer bank holiday", bankHoliday: true, link: null },
  ]},
  { name: "September", slug: "09-september", note: "Harvest Festival season: choose a date to suit your home or local community. Macmillan Coffee Morning: date to be confirmed.", events: [
    { day: 15, label: "Battle of Britain Day", link: null },
    { day: 21, label: "World Alzheimer's Day", link: null },
    { day: 22, label: "First day of autumn", link: null },
  ]},
  { name: "October", slug: "10-october", note: "Harvest Festival: local dates vary through September and October. Activity theme: autumn colours, harvest traditions and friendly Halloween crafts.", events: [
    { day: 1, label: "International Day of Older Persons", link: null },
    { day: 10, label: "World Mental Health Day", link: null },
    { day: 31, label: "Halloween", link: null },
  ]},
  { name: "November", slug: "11-november", note: "Advent begins on Sunday 28 November and continues into December. St Andrew's Day is a bank holiday in Scotland.", events: [
    { day: 1, label: "All Saints' Day", link: null },
    { day: 5, label: "Bonfire Night (Guy Fawkes Night)", link: null },
    { day: 11, label: "Armistice Day", link: null },
    { day: 14, label: "Remembrance Sunday", link: null },
    { day: 28, label: "Advent begins", link: null },
    { day: 30, label: "St Andrew's Day", bankHoliday: true, link: null },
  ]},
  { name: "December", slug: "12-december", note: "Advent continues. Hanukkah: sunset 24 December 2027 to nightfall 1 January 2028. Christmas Jumper Day: date to be confirmed.", events: [
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

const WEEKDAY_COLORS = [
  "#F1D2BE",
  "#DFD5EC",
  "#CFE3F2",
  "#F2E2B8",
  "#C9E6DD",
  "#F5F0E4",
  "#F2D6DA",
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

  const standardHref = "/holidays-calendar-2027-" + month.slug + "-standard.pdf";
  const largePrintHref = "/holidays-calendar-2027-" + month.slug + "-large-print.pdf";

  return (
    <div style={{ background: "#F5F0E4", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <Link
            href="/dashboard"
            style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #EAE4D6", background: "#fff", color: "#3F3237", fontWeight: 600, fontSize: 13, textDecoration: "none" }}
          >
            ← Back to Dashboard
          </Link>
          <div style={{ display: "flex", gap: 8 }}>
            
              href={standardHref}
              download
              style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #EAE4D6", background: "#fff", fontWeight: 600, fontSize: 13, color: "#3F3237", textDecoration: "none" }}
            >
              ⬇ Download {month.name}
            </a>
            
              href={largePrintHref}
              download
              style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #EAE4D6", background: "#fff", fontWeight: 600, fontSize: 13, color: "#3F3237", textDecoration: "none" }}
            >
              ⬇ Download {month.name} (Large Print)
            </a>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "#F2DED0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            📅
          </div>
          <div style={{ textAlign: "center", flex: 1 }}>
            <p style={{ color: "#B5714A", fontWeight: 700, fontSize: 12, letterSpacing: 1.5, margin: 0 }}>
              HOLIDAYS &amp; CELEBRATIONS
            </p>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 42, fontWeight: 400, color: "#3F3237", margin: "2px 0" }}>
              {month.name}
            </h1>
            <p style={{ color: "#8A7A6B", fontSize: 13, margin: 0 }}>
              A year of meaningful moments together
            </p>
          </div>
          <div
            style={{
              border: "1px solid #EAE4D6",
              borderRadius: 20,
              padding: "8px 20px",
              background: "#fff",
              fontWeight: 700,
              fontSize: 18,
              color: "#3F3237",
            }}
          >
            {YEAR}
          </div>
        </div>

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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              style={{
                textAlign: "center",
                fontWeight: 700,
                fontSize: 13,
                color: "#3F3237",
                padding: "10px 0",
                background: WEEKDAY_COLORS[i],
                borderRadius: 10,
              }}
            >
              {w}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {cells.map((day, i) => {
            const ev = day ? eventsByDay[day] : undefined;
            const columnColor = WEEKDAY_COLORS[i % 7];
            return (
              <div
                key={i}
                style={{
                  minHeight: 92,
                  borderRadius: 10,
                  padding: 10,
                  background: ev ? columnColor : "#fff",
                  border: ev ? "none" : "1px solid #EAE4D6",
                }}
              >
                {day && (
                  <>
                    {ev ? (
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          background: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#3F3237",
                          marginBottom: 4,
                        }}
                      >
                        {day}
                      </div>
                    ) : (
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#3F3237", marginBottom: 4 }}>{day}</div>
                    )}
                    {ev &&
                      (ev.link ? (
                        <Link href={ev.link} style={{ fontSize: 11, color: "#3F3237", fontWeight: 600, display: "block", lineHeight: 1.3, textDecoration: "underline" }}>
                          {ev.label}
                        </Link>
                      ) : (
                        <div style={{ fontSize: 11, color: "#3F3237", fontWeight: 600, lineHeight: 1.3 }}>
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

        <div style={{ background: "#fff", border: "1px solid #EAE4D6", borderRadius: 12, padding: "16px 20px", marginTop: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#3F3237", marginBottom: 6 }}>This month</div>
          <p style={{ fontSize: 13, color: "#3F3237", margin: 0, lineHeight: 1.5 }}>{month.note}</p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8A7A6B", marginTop: 12 }}>
          <span>Date sources: UK bank holidays, 2027 observances</span>
          <span>UK | {String(monthIndex + 1).padStart(2, "0")} / 12</span>
        </div>
      </div>
    </div>
  );
}
