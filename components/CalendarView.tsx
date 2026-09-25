"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { occasionHref } from "@/lib/occasions";
import { occasionsForYear } from "@/lib/ukCalendar";


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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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

function getMonthGrid(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const startWeekday = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
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

// Both calendars start at the current month and roll on through the years.
// "activity": Holidays & Celebrations, with the built-in occasions worked
// out for whichever year is showing (lib/ukCalendar.ts), each linking to
// its themed activities.
// "professional": a blank calendar for the home's own events. Its events
// are kept separate from the activity calendar's.
export type CalendarVariant = "activity" | "professional";

export default function CalendarView({ variant = "activity" }: { variant?: CalendarVariant }) {
  const { status } = useSession();
  const signedIn = status === "authenticated";
  const professional = variant === "professional";

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [monthIndex, setMonthIndex] = useState(() => new Date().getMonth());
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

  const month = { name: MONTH_NAMES[monthIndex] };
  const cells = getMonthGrid(year, monthIndex);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  useEffect(() => {
    if (!signedIn) {
      setCustomEvents([]);
      return;
    }
    let cancelled = false;
    setLoadingEvents(true);
    fetch(`/api/calendar-events?year=${year}&calendar=${variant}`)
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
  }, [signedIn, year, variant]);

  const eventsByDay: Record<number, DisplayEvent[]> = {};
  const builtIn = professional ? [] : occasionsForYear(year).filter((e) => e.month === monthIndex);
  for (const e of builtIn) {
    (eventsByDay[e.day] ??= []).push({
      key: `built-in-${year}-${monthIndex}-${e.day}-${e.label}`,
      day: e.day,
      label: e.label,
      link: occasionHref(e.occasion ?? e.label),
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
          body: JSON.stringify({ calendar: variant, year, month: monthIndex, day, title, time: formTime.trim() || null }),
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
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          /* The whole calendar (header + weekday row + day grid + footer) has to fit on a
             single printed page, however many events a month has. So in print,
             .cal-content-wrap becomes a fixed-height flex column sized to the page's usable
             area (page size minus the @page margin set in handlePrint below); the header,
             weekday row and footer keep their natural size (flex-shrink: 0) and .cal-grid
             takes whatever height is left (flex: 1). Inside the grid, every row is an equal
             1fr share of that remaining height (grid-auto-rows: 1fr), so day boxes are
             always as big as the page allows — bigger for a light month, a little smaller
             for a packed 6-row one — but the calendar itself can never spill onto a second
             page. Every event tab is always in the markup (see cal-event-tab-overflow below)
             and wraps to fill its box rather than being cut off with "…"; overflow: hidden
             on the day box is only a backstop for the rare day whose content is still taller
             than its row, so one unusually busy day can't push the whole page over. */
          .cal-content-wrap { display: flex !important; flex-direction: column !important; height: 187mm !important; max-height: 187mm !important; }
          .cal-header-row, .cal-weekday-row, .cal-footer { flex: 0 0 auto !important; }
          .cal-grid { flex: 1 1 auto !important; min-height: 0 !important; display: grid !important; grid-auto-rows: 1fr !important; page-break-inside: avoid; overflow: hidden !important; }
          .cal-day-cell { height: 100% !important; min-height: 0 !important; }
          .cal-day-cell-inner { height: 100% !important; overflow: hidden !important; }
          .cal-event-tab-overflow { display: flex !important; }
        }
        @media print {
          [data-print-size="A3"] .cal-eyebrow { font-size: 16px !important; }
          [data-print-size="A3"] .cal-title { font-size: 46px !important; }
          [data-print-size="A3"] .cal-subtitle { font-size: 15px !important; }
          [data-print-size="A3"] .cal-year { font-size: 22px !important; padding: 9px 22px !important; }
          [data-print-size="A3"] .cal-weekday { font-size: 16px !important; padding: 9px 0 !important; }
          [data-print-size="A3"] .cal-day-cell-inner { padding: 13px !important; }
          [data-print-size="A3"] .cal-day-plain { font-size: 20px !important; margin-bottom: 4px !important; }
          [data-print-size="A3"] .cal-event-tab { font-size: 14px !important; padding: 7px 9px !important; }
          [data-print-size="A3"] .cal-content-wrap { max-width: 1450px !important; height: 274mm !important; max-height: 274mm !important; }
        }
        /* Short weekday names are only for phones (never printed). */
        .cal-wd-short { display: none; }
        /* Phones: stack the header, shorten weekday names and tighten the grid.
           Screen only, so printing is unchanged. */
        @media screen and (max-width: 640px) {
          #calendar-print-area { padding: 16px 8px !important; }
          .cal-header-row { grid-template-columns: 1fr auto !important; row-gap: 6px; }
          .cal-header-row > .cal-header-centre { grid-column: 1 / -1; grid-row: 2; }
          .cal-brand-name { display: none; }
          .cal-title { font-size: 32px !important; }
          .cal-year { font-size: 15px !important; padding: 6px 14px !important; }
          .cal-toolbar { flex-wrap: wrap; gap: 8px !important; }
          .cal-toolbar button { padding: 9px 12px !important; font-size: 13px; }
          .cal-weekday-row, .cal-grid { gap: 2px !important; }
          .cal-weekday { font-size: 11px !important; padding: 6px 0 !important; border-radius: 6px !important; }
          .cal-wd-long { display: none; }
          .cal-wd-short { display: inline; }
          .cal-day-cell { min-height: 68px !important; }
          .cal-day-cell-inner { padding: 4px !important; }
          .cal-day-plain { font-size: 12px !important; }
          .cal-event-tab { font-size: 9.5px !important; padding: 2px 3px !important; line-height: 1.15 !important; }
        }
      `}</style>
            <div className="cal-content-wrap" style={{ maxWidth: 980, margin: "0 auto" }}>

        {/* Header row: icon left, title centre, year pill right — grid keeps the centre column
            mathematically centred even when the left (logo + name) and right (year pill) content
            widths differ. */}
        <div className="cal-header-row" style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: 4 }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", justifySelf: "start" }}>
            <Image src="/activity-central-icon.png" alt="Activity Central - back to Dashboard" width={60} height={60} />
            <span className="cal-brand-name" style={{ fontFamily: "Georgia, serif", fontSize: 20, color: "#3F3237", marginLeft: 10 }}>Activity Central</span>
          </Link>
          <div className="cal-header-centre" style={{ textAlign: "center" }}>
            <p className="cal-eyebrow" style={{ color: "#B5714A", fontWeight: 700, fontSize: 12, letterSpacing: 1.5, margin: 0 }}>
              {professional ? "PROFESSIONAL CALENDAR" : <>HOLIDAYS &amp; CELEBRATIONS</>}
            </p>
            <h1 className="cal-title" style={{ fontFamily: "Georgia, serif", fontSize: 42, fontWeight: 400, color: "#3F3237", margin: "2px 0" }}>
              {month.name}
            </h1>
            <p className="cal-subtitle" style={{ color: "#8A7A6B", fontSize: 13, margin: 0 }}>
              {professional ? "Your home's own plan, however you want to use it" : "A year of meaningful moments together"}
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
            {year}
          </div>
        </div>

        {/* Month navigation */}
        <div className="cal-no-print cal-toolbar" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, margin: "20px 0" }}>
          <button
            onClick={() => {
              // Carry on into the previous year.
              if (monthIndex === 0) setYear((y) => y - 1);
              setMonthIndex((m) => (m === 0 ? 11 : m - 1));
              setOpenDay(null);
            }}
            style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #EAE4D6", background: "#fff", cursor: "pointer", fontWeight: 600, color: "#3F3237" }}
          >
            ← Previous
          </button>
          <button
            onClick={() => {
              if (monthIndex === 11) setYear((y) => y + 1);
              setMonthIndex((m) => (m === 11 ? 0 : m + 1));
              setOpenDay(null);
            }}
            style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #EAE4D6", background: "#fff", cursor: "pointer", fontWeight: 600, color: "#3F3237" }}
          >
            Next →
          </button>
        </div>

        {/* Print controls */}
        <div className="cal-no-print cal-toolbar" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, margin: "0 0 8px" }}>
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
        <div className="cal-weekday-row" style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4, marginBottom: 4 }}>
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
              <span className="cal-wd-long">{w}</span>
              <span className="cal-wd-short">{w.slice(0, 3)}</span>
            </div>
          ))}
        </div>

        {/* Day grid: every event — built-in occasion or staff-added — renders as a
            uniform colour tab (label text only, no icons), the same style used in the
            day popover. All the tabs on a given day share that day's own weekday
            colour (TAB_COLORS indexed by column, i % 7) rather than cycling through
            the palette by position, so every Monday tab is the same terracotta as
            the Monday header, etc. Day boxes have a minimum height rather than a
            fixed one, and event tabs wrap onto a second line instead of being cut
            off with "…" — so a long title like "Boxing Day bank holiday
            (substitute)" always reads in full. Because it's a CSS grid, a taller
            day only grows the other days in its own week (the row), never the
            whole calendar. The columns use minmax(0, 1fr) rather than plain 1fr: a
            plain 1fr track's minimum width is set by its widest content, which was
            silently stealing width from the other six columns; minmax(0, ...)
            removes that so every column stays exactly equal width.
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
                  minHeight: 108,
                  borderRadius: 10,
                  background: "#fff",
                  border: "1px solid #EAE4D6",
                  position: "relative",
                }}
              >
                {day && (
                  <>
                    {/* Content can grow this wrapper (and the day box around it) taller when
                        a title wraps onto a second line — overflow stays visible so nothing
                        is clipped. The popover below is a sibling so it's never affected. */}
                    <div className="cal-day-cell-inner" style={{ minHeight: "100%", padding: 8, display: "flex", flexDirection: "column", gap: 2, overflow: "visible" }}>
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
                      // Titles are never cut short with "…" — they wrap onto a second
                      // line instead, so the tab (and the day box around it, which has
                      // a minimum rather than fixed height) grows just enough to fit.
                      const tabStyle = {
                        fontWeight: 700,
                        fontSize: 10,
                        color: text,
                        padding: "2.5px 6px",
                        borderRadius: 6,
                        lineHeight: 1.15,
                        display: isOverflow ? "none" : "flex",
                        alignItems: "flex-start",
                        gap: 4,
                        whiteSpace: "normal" as const,
                        overflowWrap: "break-word" as const,
                        background: bg,
                        boxShadow: "0 1px 1px rgba(63,50,55,0.08)",
                        textDecoration: "none",
                        flexShrink: 0,
                      };
                      const className = isOverflow ? "cal-event-tab cal-event-tab-overflow" : "cal-event-tab";
                      const inner = (
                        <span style={{ overflowWrap: "break-word", whiteSpace: "normal" }}>
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
                        {dayEvents.map((ev) => {
                          // flex: 1 + minWidth: 0 lets a long title wrap and shrink to
                          // fit, instead of a flex row's default sizing pushing it (or
                          // the Edit/Delete links beside it) past the popover's edge.
                          const rowStyle: CSSProperties = {
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
                            textDecoration: "none",
                          };
                          const rowContent = (
                            <>
                              <span style={{ flex: 1, minWidth: 0 }}>
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
                              ) : ev.link ? (
                                // Built-in occasions can't be edited or deleted, but they
                                // are clickable through to the themed-category browser —
                                // "Browse" (rather than "Locked") reflects that it still
                                // does something on click.
                                <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, opacity: 0.75, textTransform: "uppercase", letterSpacing: 0.4 }}>
                                  Browse →
                                </span>
                              ) : (
                                <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, opacity: 0.6, textTransform: "uppercase", letterSpacing: 0.4 }}>
                                  Locked
                                </span>
                              )}
                            </>
                          );
                          return ev.link ? (
                            <Link key={ev.key} href={ev.link} style={{ ...rowStyle, cursor: "pointer" }}>
                              {rowContent}
                            </Link>
                          ) : (
                            <div key={ev.key} style={rowStyle}>
                              {rowContent}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="cal-footer" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8A7A6B", marginTop: 12 }}>
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
            <p style={{ fontSize: 12, color: "#8A7A6B", margin: "0 0 18px" }}>{month.name} {year} · visible to all staff</p>

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
