"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

type BuiltInEvent = { day: number; label: string; bankHoliday?: boolean; link: string | null };

type CustomEvent = {
  id: string;
  year: number;
  month: number; // 0-11
  day: number;
  title: string;
  time: string | null;
};

// A single shape used for rendering, whichever source an event came from.
type DisplayEvent = {
  key: string;
  day: number;
  label: string;
  time?: string | null;
  link: string | null;
  custom: boolean;
  id?: string;
};

const MONTHS: { name: string; events: BuiltInEvent[]; note: string }[] = [
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

// One colour per weekday column, matching the reference design
const WEEKDAY_COLORS = [
  "#F1D2BE", // Monday - terracotta
  "#DFD5EC", // Tuesday - lavender
  "#CFE3F2", // Wednesday - blue
  "#F2E2B8", // Thursday - gold
  "#C9E6DD", // Friday - teal
  "#D8E7CB", // Saturday - mint green
  "#F2D6DA", // Sunday - pink
];

// Same palette, with a readable text colour for each. Indexed by weekday
// (0 = Monday … 6 = Sunday) so every event tab on a given day always matches
// that day's own column colour, instead of cycling through the palette by
// the event's position in the list.
const TAB_COLORS = [
  { bg: "#F1D2BE", text: "#6B3F24" },
  { bg: "#DFD5EC", text: "#4A3B63" },
  { bg: "#CFE3F2", text: "#1F4E66" },
  { bg: "#F2E2B8", text: "#6B5723" },
  { bg: "#C9E6DD", text: "#295044" },
  { bg: "#D8E7CB", text: "#3B5A2A" },
  { bg: "#F2D6DA", text: "#7A3A44" },
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

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "9px 11px",
  borderRadius: 8,
  border: "1px solid #EAE4D6",
  fontSize: 13.5,
  color: "#3F3237",
  fontFamily: "inherit",
  marginBottom: 14,
  background: "#FBF9F4",
};

const labelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#3F3237",
  marginBottom: 5,
  display: "block",
};

export default function CalendarPage() {
  const { status } = useSession();
  const signedIn = status === "authenticated";

  const [monthIndex, setMonthIndex] = useState(0);
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [modal, setModal] = useState<null | { mode: "add" } | { mode: "edit"; event: CustomEvent }>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDay, setFormDay] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const month = MONTHS[monthIndex];
  const cells = getMonthGrid(monthIndex);
  const daysInMonth = new Date(YEAR, monthIndex + 1, 0).getDate();

  useEffect(() => {
    if (!signedIn) {
      setCustomEvents([]);
      return;
    }
    let cancelled = false;
    setLoadingEvents(true);
    fetch(`/api/calendar-events?year=${YEAR}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setCustomEvents(data.events ?? []);
      })
      .catch(() => {
        if (!cancelled) setCustomEvents([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingEvents(false);
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  const eventsByDay: Record<number, DisplayEvent[]> = {};
  for (const e of month.events) {
    (eventsByDay[e.day] ??= []).push({
      key: `built-in-${monthIndex}-${e.day}-${e.label}`,
      day: e.day,
      label: e.label,
      link: e.link,
      custom: false,
    });
  }
  for (const e of customEvents) {
    if (e.month !== monthIndex) continue;
    (eventsByDay[e.day] ??= []).push({
      key: e.id,
      day: e.day,
      label: e.title,
      time: e.time,
      link: null,
      custom: true,
      id: e.id,
    });
  }

  function openAddModal(day?: number) {
    setModal({ mode: "add" });
    setFormTitle("");
    setFormDay(day ? String(day) : "");
    setFormTime("");
    setFormError(null);
  }

  function openEditModal(event: CustomEvent) {
    setModal({ mode: "edit", event });
    setFormTitle(event.title);
    setFormDay(String(event.day));
    setFormTime(event.time ?? "");
    setFormError(null);
  }

  function closeModal() {
    setModal(null);
    setFormError(null);
  }

  async function submitForm() {
    const title = formTitle.trim();
    const day = Number(formDay);

    if (!title) {
      setFormError("Give the event a title.");
      return;
    }
    if (!Number.isInteger(day) || day < 1 || day > daysInMonth) {
      setFormError(`Day must be between 1 and ${daysInMonth} for ${month.name}.`);
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (modal?.mode === "edit") {
        const res = await fetch(`/api/calendar-events/${modal.event.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, day, time: formTime.trim() || null }),
        });
        if (!res.ok) throw new Error();
        const { event } = await res.json();
        setCustomEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
      } else {
        const res = await fetch("/api/calendar-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ year: YEAR, month: monthIndex, day, title, time: formTime.trim() || null }),
        });
        if (!res.ok) throw new Error();
        const { event } = await res.json();
        setCustomEvents((prev) => [...prev, event]);
      }
      closeModal();
    } catch {
      setFormError("Something went wrong saving that event. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/calendar-events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setCustomEvents((prev) => prev.filter((e) => e.id !== id));
    } catch {
      // Leave the event in place if the delete failed — the "Delete" link stays available to retry.
    } finally {
      setSaving(false);
      setConfirmDeleteId(null);
    }
  }

  function handlePrint(size: "A4" | "A3") {
    let styleEl = document.getElementById("dynamic-print-page");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "dynamic-print-page";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `@page { size: ${size} landscape; margin: 10mm; }`;

    const wrapper = document.getElementById("calendar-print-area");
    if (wrapper) wrapper.setAttribute("data-print-size", size);

    setTimeout(() => window.print(), 50);
  }

  return (
    <div id="calendar-print-area" data-print-size="A4" style={{ background: "#F5F0E4", minHeight: "auto", padding: "40px 20px" }}>
      <style>{`
        @media print {
          .cal-no-print { display: none !important; }
          #calendar-print-area { background: #fff !important; min-height: auto !important; padding: 0 !important; }
          body { background: #fff !important; }
          .cal-grid { page-break-inside: avoid; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          /* On screen, a day with more events than fit shows a "+N more" button that opens
             a popover — neither works on a printed page. So every event tab is always in
             the markup (see cal-event-tab-overflow below) and the box grows to fit them all
             when printed, instead of silently leaving events off the page. */
          .cal-day-cell { height: auto !important; min-height: 108px !important; }
          .cal-day-cell-inner { height: auto !important; overflow: visible !important; }
          .cal-event-tab-overflow { display: flex !important; }
        }
        @media print {
                              [data-print-size="A3"] .cal-eyebrow { font-size: 16px !important; }
                                        [data-print-size="A3"] .cal-title { font-size: 46px !important; }
                                        [data-print-size="A3"] .cal-subtitle { font-size: 15px !important; }
                                        [data-print-size="A3"] .cal-year { font-size: 22px !important; padding: 9px 22px !important; }
                                        [data-print-size="A3"] .cal-weekday { font-size: 16px !important; padding: 9px 0 !important; }
                                        [data-print-size="A3"] .cal-day-cell { height: auto !important; min-height: 148px !important; }
                                        [data-print-size="A3"] .cal-day-cell-inner { padding: 13px !important; height: auto !important; overflow: visible !important; }
                                        [data-print-size="A3"] .cal-day-plain { font-size: 20px !important; margin-bottom: 4px !important; }
                                        [data-print-size="A3"] .cal-event-tab { font-size: 14px !important; padding: 7px 9px !important; }
          [data-print-size="A3"] .cal-content-wrap { max-width: 1450px !important; }
        }
      `}</style>
            <div className="cal-content-wrap" style={{ maxWidth: 980, margin: "0 auto" }}>

        {/* Header row: icon left, title centre, year pill right — grid keeps the centre column
            mathematically centred even when the left (logo + name) and right (year pill) content
            widths differ. */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: 4 }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", justifySelf: "start" }}>
            <Image src="/activity-central-icon.png" alt="Activity Central - back to Dashboard" width={60} height={60} />
            <span style={{ fontFamily: "Georgia, serif", fontSize: 20, color: "#3F3237", marginLeft: 10 }}>Activity Central</span>
          </Link>
          <div style={{ textAlign: "center" }}>
            <p className="cal-eyebrow" style={{ color: "#B5714A", fontWeight: 700, fontSize: 12, letterSpacing: 1.5, margin: 0 }}>
              HOLIDAYS &amp; CELEBRATIONS
            </p>
            <h1 className="cal-title" style={{ fontFamily: "Georgia, serif", fontSize: 42, fontWeight: 400, color: "#3F3237", margin: "2px 0" }}>
              {month.name}
            </h1>
            <p className="cal-subtitle" style={{ color: "#8A7A6B", fontSize: 13, margin: 0 }}>
              A year of meaningful moments together
            </p>
          </div>
          <div
            className="cal-year"
            style={{
              justifySelf: "end",
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

        {/* Month navigation */}
        <div className="cal-no-print" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, margin: "20px 0" }}>
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

        {/* Print controls */}
        <div className="cal-no-print" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, margin: "0 0 8px" }}>
          <button
            onClick={() => handlePrint("A4")}
            style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #B5714A", background: "#B5714A", color: "#fff", cursor: "pointer", fontWeight: 600 }}
          >
            Print (A4)
          </button>
          <button
            onClick={() => handlePrint("A3")}
            style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #B5714A", background: "#fff", color: "#B5714A", cursor: "pointer", fontWeight: 600 }}
          >
            Print Large (A3)
          </button>
          <button
            onClick={() => signedIn && openAddModal()}
            disabled={!signedIn}
            title={signedIn ? "Add an event" : "Sign in to add events"}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "1px dashed #B5714A",
              background: "#FCEFE7",
              color: "#B5714A",
              cursor: signedIn ? "pointer" : "not-allowed",
              fontWeight: 600,
              opacity: signedIn ? 1 : 0.55,
            }}
          >
            + Add event
          </button>
        </div>
        {!signedIn && status !== "loading" && (
          <p className="cal-no-print" style={{ textAlign: "center", fontSize: 11.5, color: "#8A7A6B", margin: "0 0 16px" }}>
            <Link href="/login" style={{ color: "#B5714A", fontWeight: 600 }}>Sign in</Link> to add your own events to this calendar.
          </p>
        )}
        {signedIn && (
          <p className="cal-no-print" style={{ textAlign: "center", fontSize: 11.5, color: "#8A7A6B", margin: "0 0 16px" }}>
            Click a day's number to see its events — events you've added can be edited or deleted from there.
          </p>
        )}
        <p className="cal-no-print" style={{ textAlign: "center", fontSize: 12, color: "#8A7A6B", margin: "0 0 24px" }}>
          Large Print (A3) makes the calendar text and layout bigger, but you also need to set your printer to A3 paper size in its print settings for it to come out correctly.
        </p>
        {/* Weekday header pills */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4, marginBottom: 4 }}>
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className="cal-weekday"
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

        {/* Day grid: every event — built-in occasion or staff-added — renders as a
            uniform colour tab (label text only, no icons), the same style used in the
            day popover. All the tabs on a given day share that day's own weekday
            colour (TAB_COLORS indexed by column, i % 7) rather than cycling through
            the palette by position, so every Monday tab is the same terracotta as
            the Monday header, etc. Day boxes are always plain white and a fixed
            height, so no day can ever grow into or shrink its neighbours. The
            columns use minmax(0, 1fr) rather than plain 1fr: a plain 1fr track's
            minimum width is set by its widest un-wrapped content (a long event
            label), which was silently stealing width from the other six columns.
            minmax(0, ...) removes that content-driven minimum so every column stays
            exactly equal, and the tab's own text-overflow: ellipsis takes over
            instead.
            There's no "add" button inside each box (it lives in the toolbar above,
            next to Print) — up to 4 events fit at close to their original size
            instead of needing to shrink hard. A day with more than 4 shows only 3
            plus "+N more", rather than 4 plus "+N more", so the overflow pill is
            never squeezed for room.
            The day number itself is clickable whenever the day has any events —
            not just on overflow — so staff always have a way to reach Edit/Delete
            on their own events, even on a day with just one or two. */}
        <div className="cal-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4 }}>
          {cells.map((day, i) => {
            const dayEvents = day ? eventsByDay[day] ?? [] : [];
            const maxVisible = dayEvents.length > 4 ? 3 : 4;
            const hiddenCount = Math.max(0, dayEvents.length - maxVisible);
            const isOpen = day !== null && openDay === day;
            const colIndex = i % 7;
            const { bg, text } = TAB_COLORS[colIndex];

            return (
              <div
                key={i}
                className="cal-day-cell"
                style={{
                  height: 108,
                  borderRadius: 10,
                  background: "#fff",
                  border: "1px solid #EAE4D6",
                  position: "relative",
                }}
              >
                {day && (
                  <>
                    {/* Inner wrapper clips to the fixed cell height so extra tabs never grow
                        the box; the popover below is a sibling so it isn't clipped too. */}
                    <div className="cal-day-cell-inner" style={{ height: "100%", padding: 8, display: "flex", flexDirection: "column", gap: 2, overflow: "hidden" }}>
                    {dayEvents.length > 0 ? (
                      // A <button> with no visible chrome (no border/background) reads and
                      // prints exactly like the plain day number below — it's only
                      // interactive on screen, so it doesn't need cal-no-print.
                      <button
                        className="cal-day-plain"
                        onClick={() => setOpenDay(isOpen ? null : day)}
                        style={{ fontSize: 14, fontWeight: 700, color: "#3F3237", lineHeight: 1.1, flexShrink: 0, background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}
                      >
                        {day}
                      </button>
                    ) : (
                      <div className="cal-day-plain" style={{ fontSize: 14, fontWeight: 700, color: "#3F3237", lineHeight: 1.1, flexShrink: 0 }}>{day}</div>
                    )}

                    {dayEvents.map((ev, idx) => {
                      // On screen, only the first maxVisible tabs show — the rest are
                      // reached through "+N more". A printed page can't be clicked, so every
                      // tab is always in the markup and the overflow ones are revealed by the
                      // print stylesheet instead, so nothing is silently left off the page.
                      const isOverflow = idx >= maxVisible;
                      const tabStyle = {
                        fontWeight: 700,
                        fontSize: 10,
                        color: text,
                        padding: "2.5px 6px",
                        borderRadius: 6,
                        lineHeight: 1.15,
                        display: isOverflow ? "none" : "flex",
                        alignItems: "center",
                        gap: 4,
                        whiteSpace: "nowrap" as const,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        background: bg,
                        boxShadow: "0 1px 1px rgba(63,50,55,0.08)",
                        textDecoration: "none",
                        flexShrink: 0,
                      };
                      const className = isOverflow ? "cal-event-tab cal-event-tab-overflow" : "cal-event-tab";
                      const inner = (
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ev.label}
                          {ev.time ? ` · ${ev.time}` : ""}
                        </span>
                      );
                      return ev.link ? (
                        <Link key={ev.key} href={ev.link} className={className} style={tabStyle}>
                          {inner}
                        </Link>
                      ) : (
                        <div key={ev.key} className={className} style={tabStyle}>
                          {inner}
                        </div>
                      );
                    })}

                    {hiddenCount > 0 && (
                      <button
                        className="cal-no-print"
                        onClick={() => setOpenDay(isOpen ? null : day)}
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          borderRadius: 7,
                          padding: "2px 7px",
                          cursor: "pointer",
                          border: "1px solid #F0D9C8",
                          color: "#B5714A",
                          background: "#FCEFE7",
                          alignSelf: "flex-start",
                          marginTop: 1,
                          flexShrink: 0,
                        }}
                      >
                        +{hiddenCount} more
                      </button>
                    )}
                    </div>

                    {isOpen && (
                      <div
                        className="cal-no-print"
                        style={{
                          position: "absolute",
                          top: "calc(100% + 4px)",
                          left: 0,
                          width: 250,
                          background: "#fff",
                          border: "1px solid #EAE4D6",
                          borderRadius: 14,
                          padding: "14px 16px",
                          boxShadow: "0 8px 20px rgba(63,50,55,0.15)",
                          zIndex: 20,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "#8A7A6B", margin: 0 }}>
                            {month.name} {day} — all events
                          </p>
                          <button
                            onClick={() => setOpenDay(null)}
                            style={{ border: "none", background: "none", color: "#8A7A6B", fontSize: 14, cursor: "pointer", lineHeight: 1 }}
                          >
                            ×
                          </button>
                        </div>
                        {dayEvents.map((ev) => (
                          <div
                            key={ev.key}
                            style={{
                              background: bg,
                              color: text,
                              borderRadius: 8,
                              padding: "6px 9px",
                              fontSize: 11.5,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginBottom: 6,
                            }}
                          >
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                              {ev.label}
                              {ev.time ? ` · ${ev.time}` : ""}
                            </span>
                            {ev.custom && ev.id ? (
                              confirmDeleteId === ev.id ? (
                                <span style={{ marginLeft: "auto", display: "flex", gap: 8, fontSize: 9.5, fontWeight: 700 }}>
                                  <span
                                    onClick={() => !saving && deleteEvent(ev.id!)}
                                    style={{ cursor: "pointer", textDecoration: "underline" }}
                                  >
                                    Confirm delete
                                  </span>
                                  <span
                                    onClick={() => setConfirmDeleteId(null)}
                                    style={{ cursor: "pointer", opacity: 0.75 }}
                                  >
                                    Cancel
                                  </span>
                                </span>
                              ) : (
                                <span style={{ marginLeft: "auto", display: "flex", gap: 8, fontSize: 9.5, fontWeight: 700, opacity: 0.85 }}>
                                  <span
                                    onClick={() => openEditModal(customEvents.find((c) => c.id === ev.id)!)}
                                    style={{ cursor: "pointer", textDecoration: "underline" }}
                                  >
                                    Edit
                                  </span>
                                  <span
                                    onClick={() => setConfirmDeleteId(ev.id!)}
                                    style={{ cursor: "pointer", textDecoration: "underline" }}
                                  >
                                    Delete
                                  </span>
                                </span>
                              )
                            ) : (
                              <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, opacity: 0.6, textTransform: "uppercase", letterSpacing: 0.4 }}>
                                Locked
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8A7A6B", marginTop: 12 }}>
          <span>Date sources: UK bank holidays, 2027 observances</span>
          <span>UK | {String(monthIndex + 1).padStart(2, "0")} / 12</span>
        </div>
      </div>

      {modal && (
        <div
          className="cal-no-print"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(63,50,55,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 20,
          }}
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 360,
              maxWidth: "100%",
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #EAE4D6",
              boxShadow: "0 12px 30px rgba(63,50,55,0.18)",
              padding: "22px 22px 20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 19, color: "#3F3237", margin: 0 }}>
                {modal.mode === "edit" ? "Edit event" : "Add an event"}
              </h2>
              <button onClick={closeModal} style={{ border: "none", background: "none", color: "#8A7A6B", fontSize: 16, cursor: "pointer" }}>×</button>
            </div>
            <p style={{ fontSize: 12, color: "#8A7A6B", margin: "0 0 18px" }}>{month.name} {YEAR} · visible to all staff</p>

            <label style={labelStyle}>Event title</label>
            <input
              style={inputStyle}
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Sing-Along Afternoon"
            />

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Day</label>
                <input
                  style={inputStyle}
                  value={formDay}
                  onChange={(e) => setFormDay(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder={`1–${daysInMonth}`}
                  inputMode="numeric"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Time (optional)</label>
                <input
                  style={inputStyle}
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  placeholder="e.g. 2:00 PM"
                />
              </div>
            </div>

            {formError && (
              <p style={{ color: "#B5714A", fontSize: 12, fontWeight: 600, margin: "-6px 0 12px" }}>{formError}</p>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                onClick={closeModal}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #EAE4D6", background: "#fff", color: "#8A7A6B", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={submitForm}
                disabled={saving}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #B5714A", background: "#B5714A", color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Saving…" : modal.mode === "edit" ? "Save changes" : "Save event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
