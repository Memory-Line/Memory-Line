"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
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

// Prints the month on one landscape page. The page is laid out at A4 size (in
// millimetres) in a hidden sheet and enlarged with CSS zoom for A3. Before
// printing, every day's events shrink until they fit inside the day's box, and if
// a day still has more than fit even at the smallest readable size, the last ones
// are replaced by "+2 more" so nothing is cut off without saying so. The notes
// box (when included) is part of the same sheet and shrinks its text to fit, so
// the calendar and the notes always print together on one page.

export type MonthEvent = { label: string; time?: string | null };

const RULE = "#D9D2C0";

export default function MonthPrint({
  size,
  year,
  monthIndex,
  professional,
  eventsByDay,
  notes,
  onDone,
  onNotice,
}: {
  size: "A4" | "A3";
  year: number;
  monthIndex: number;
  professional: boolean;
  eventsByDay: Record<number, MonthEvent[]>;
  notes: { include: boolean; text: string; colour: string };
  onDone: () => void;
  onNotice: (message: string | null) => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [area, setArea] = useState<HTMLElement | null>(null);
  useEffect(() => setArea(document.getElementById("calendar-print-area")), []);

  const cells = getMonthGrid(year, monthIndex);
  const weeks = cells.length / 7;
  const notesText = notes.text.trim();

  // Fit everything inside its box before printing.
  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const cut: string[] = [];
    sheet.querySelectorAll<HTMLElement>("[data-month-cell]").forEach((cell) => {
      const head = cell.querySelector<HTMLElement>("[data-cell-head]");
      const evs = cell.querySelector<HTMLElement>("[data-cell-events]");
      if (!head || !evs) return;
      const style = getComputedStyle(cell);
      const room = () => cell.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - 1;
      const over = () => head.offsetHeight + evs.offsetHeight > room();
      let pt = 7.5;
      evs.style.fontSize = `${pt}pt`;
      while (over() && pt > 4.8) {
        pt -= 0.3;
        evs.style.fontSize = `${pt}pt`;
      }
      if (over()) {
        // Still too many even at the smallest size: show what fits, then "+N more".
        const tabs = Array.from(evs.querySelectorAll<HTMLElement>("[data-tab]"));
        const more = evs.querySelector<HTMLElement>("[data-more]");
        let hidden = 0;
        for (let i = tabs.length - 1; i > 0 && over(); i--) {
          tabs[i].style.display = "none";
          hidden++;
          if (more) {
            more.style.display = "block";
            more.textContent = `+${hidden} more`;
          }
        }
        if (hidden > 0) cut.push(`${cell.getAttribute("data-day")}`);
      }
    });

    const noteEl = sheet.querySelector<HTMLElement>("[data-month-notes]");
    if (noteEl) {
      let pt = 9;
      noteEl.style.fontSize = `${pt}pt`;
      while (noteEl.scrollHeight > noteEl.clientHeight + 1 && pt > 5) {
        pt -= 0.5;
        noteEl.style.fontSize = `${pt}pt`;
      }
    }
    onNotice(
      cut.length
        ? `Some days have more events than fit on one page (day ${cut.join(", ")}). Those days show "+N more" on the printout, so check them on the screen.`
        : null
    );
  }, [area]); // eslint-disable-line react-hooks/exhaustive-deps

  // Print, then put the page back to normal.
  useEffect(() => {
    if (!area) return;
    let styleEl = document.getElementById("dynamic-print-page");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "dynamic-print-page";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `@page { size: ${size} landscape; margin: 0; }`;
    area.setAttribute("data-print-mode", "month");
    const finish = () => {
      area.removeAttribute("data-print-mode");
      onDone();
    };
    window.addEventListener("afterprint", finish, { once: true });
    const timer = setTimeout(() => window.print(), 200);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", finish);
    };
  }, [area]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!area) return null;

  return createPortal(
    <>
      <style>{`
        .month-sheet { position: absolute; left: -10000px; top: 0; width: 297mm; height: 209mm; box-sizing: border-box; padding: 9mm 10mm 8mm; background: #fff; color: #3F3237; font-family: Georgia, serif; display: flex; flex-direction: column; overflow: hidden; pointer-events: none; }
        @media print {
          #calendar-print-area[data-print-mode="month"] { padding: 0 !important; background: #fff !important; }
          #calendar-print-area[data-print-mode="month"] .cal-content-wrap { display: none !important; }
          #calendar-print-area[data-print-mode="month"] .month-sheet { position: static !important; left: auto !important; page-break-after: avoid; break-after: avoid; }
          #calendar-print-area[data-print-mode="month"] .month-sheet[data-size="A3"] { zoom: 1.4142; }
          .month-sheet * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
      <div ref={sheetRef} className="month-sheet" data-size={size} aria-hidden="true">
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: "2mm" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "2mm" }}>
            <Image src="/activity-central-icon.png" alt="" width={40} height={40} />
            <span style={{ fontSize: "10pt" }}>Activity Central</span>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontFamily: "Helvetica, Arial, sans-serif", fontSize: "7.5pt", letterSpacing: "1.5px", fontWeight: 700, color: "#B5714A" }}>
              {professional ? "PROFESSIONAL CALENDAR" : "HOLIDAYS & CELEBRATIONS"}
            </p>
            <p style={{ margin: "0.5mm 0 0", fontSize: "24pt", fontWeight: 400 }}>{MONTH_NAMES[monthIndex]}</p>
          </div>
          <div style={{ justifySelf: "end", border: "1px solid #EAE4D6", borderRadius: "5mm", padding: "0.8mm 4mm", fontFamily: "Helvetica, Arial, sans-serif", fontSize: "10pt", fontWeight: 700 }}>
            {year}
          </div>
        </div>

        {/* Weekday pills */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "1.2mm", marginBottom: "1.2mm" }}>
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              style={{ textAlign: "center", fontFamily: "Helvetica, Arial, sans-serif", fontSize: "8pt", fontWeight: 700, padding: "1.2mm 0", background: TAB_COLORS[i].bg, color: TAB_COLORS[i].text, borderRadius: "2mm" }}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Days */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gridTemplateRows: `repeat(${weeks}, minmax(0, 1fr))`,
            gap: "1.2mm",
          }}
        >
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const c = TAB_COLORS[i % 7];
            const events = eventsByDay[day] ?? [];
            return (
              <div
                key={i}
                data-month-cell
                data-day={day}
                style={{ border: "0.3mm solid #EAE4D6", borderRadius: "1.8mm", padding: "1.2mm", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: "Helvetica, Arial, sans-serif", minHeight: 0 }}
              >
                <div data-cell-head style={{ fontSize: "9pt", fontWeight: 700, lineHeight: 1.1, marginBottom: "0.6mm", flex: "0 0 auto" }}>
                  {day}
                </div>
                <div data-cell-events style={{ flex: "0 0 auto", fontSize: "7.5pt" }}>
                  {events.map((e, k) => (
                    <div
                      key={k}
                      data-tab
                      style={{ background: c.bg, color: c.text, borderRadius: "1mm", padding: "0.5mm 1.2mm", marginBottom: "0.6mm", fontWeight: 700, lineHeight: 1.15, overflowWrap: "anywhere" }}
                    >
                      {e.label}
                      {e.time ? ` · ${e.time}` : ""}
                    </div>
                  ))}
                  <div data-more style={{ display: "none", fontSize: "0.9em", fontWeight: 700, color: "#8A7A6B" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Notes (part of the same page) */}
        {notes.include && (
          <div style={{ flex: "0 0 auto", marginTop: "2mm", border: "0.3mm solid #EAE4D6", borderRadius: "2mm", padding: "1.2mm 2.5mm", height: "21mm", boxSizing: "border-box", fontFamily: "Helvetica, Arial, sans-serif" }}>
            <p style={{ margin: 0, fontSize: "7pt", fontWeight: 700, letterSpacing: "1px", color: "#B5714A" }}>NOTES</p>
            {notesText ? (
              <div
                data-month-notes
                style={{ height: "calc(100% - 4mm)", overflow: "hidden", overflowWrap: "anywhere", fontSize: "9pt", lineHeight: 1.25, color: notes.colour }}
              >
                {notesText.split("\n").map((line, i) =>
                  line.startsWith("• ") ? (
                    <div key={i} style={{ display: "flex", gap: "1.5mm" }}>
                      <span>•</span>
                      <span style={{ flex: 1, minWidth: 0 }}>{line.slice(2)}</span>
                    </div>
                  ) : (
                    <div key={i} style={{ minHeight: line === "" ? "1.25em" : undefined }}>{line}</div>
                  )
                )}
              </div>
            ) : (
              <div style={{ height: "calc(100% - 4mm)", backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent 4.6mm, ${RULE} 4.6mm, ${RULE} 4.9mm)` }} />
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ flex: "0 0 auto", display: "flex", justifyContent: "space-between", fontFamily: "Helvetica, Arial, sans-serif", fontSize: "6.5pt", color: "#8A7A6B", marginTop: "1.5mm" }}>
          <span>UK bank holidays and observances, worked out for {year}</span>
          <span>UK | {String(monthIndex + 1).padStart(2, "0")} / 12</span>
        </div>
      </div>
    </>,
    area
  );
}
