"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { occasionsForYear } from "@/lib/ukCalendar";

// "Print dates": prints any run of up to 7 days (a week, or whatever the home
// plans by) on one landscape page. The day boxes alternate high and low, each
// has ruled writing lines, and there's a notes box along the bottom.
//
// The page is always laid out at A4 size (in millimetres) in a hidden sheet,
// then enlarged with CSS zoom for A3. Before printing, each box shrinks its
// event text until every event fits inside the box, so writing can never run
// out of its box; the ruled lines only take the space that's left over.

const MONTHS = [
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
const MAX_DAYS = 7;
const RULE = "#D9D2C0";

type SheetEvent = { label: string; time: string | null };
type SheetDay = { date: Date; weekday: number; events: SheetEvent[] };
type Job = { days: SheetDay[]; size: "A4" | "A3"; lines: boolean; notes: boolean; notesText: string };

// The notes you type are remembered on this computer between prints (so a note
// like "Hairdresser every Tuesday" doesn't need retyping); clear the box to remove it.
const NOTES_KEY = "range-print-notes";

function toInput(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// "2026-11-02" read as a local date (not UTC, which can shift it a day).
function fromInput(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function rangeTitle(days: SheetDay[]) {
  const a = days[0].date;
  const b = days[days.length - 1].date;
  if (days.length === 1) return `${WEEKDAYS[days[0].weekday]} ${a.getDate()} ${MONTHS[a.getMonth()]}`;
  if (a.getFullYear() !== b.getFullYear()) {
    return `${a.getDate()} ${MONTHS[a.getMonth()]} ${a.getFullYear()} to ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`;
  }
  if (a.getMonth() !== b.getMonth()) return `${a.getDate()} ${MONTHS[a.getMonth()]} to ${b.getDate()} ${MONTHS[b.getMonth()]}`;
  return `${a.getDate()} to ${b.getDate()} ${MONTHS[a.getMonth()]}`;
}

const fieldStyle: CSSProperties = {
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
const labelStyle: CSSProperties = { fontSize: 12, fontWeight: 700, color: "#3F3237", marginBottom: 5, display: "block" };

export default function RangePrint({
  variant,
  professional,
  signedIn,
  homeName,
}: {
  variant: "activity" | "professional";
  professional: boolean;
  signedIn: boolean;
  homeName: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(() => toInput(new Date()));
  const [to, setTo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return toInput(d);
  });
  const [size, setSize] = useState<"A4" | "A3">("A4");
  const [lines, setLines] = useState(true);
  const [notes, setNotes] = useState(true);
  const [notesText, setNotesText] = useState("");
  useEffect(() => {
    try {
      setNotesText(localStorage.getItem(NOTES_KEY) ?? "");
    } catch {}
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  // The sheet is placed directly inside the calendar's print area (not inside the
  // toolbar, which doesn't print) so the print styles can show it on its own.
  const [area, setArea] = useState<HTMLElement | null>(null);
  useEffect(() => setArea(document.getElementById("calendar-print-area")), []);

  async function start() {
    setError(null);
    const a = fromInput(from);
    const b = fromInput(to);
    if (!a || !b) {
      setError("Choose a From and a To date.");
      return;
    }
    const count = Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
    if (count < 1) {
      setError("The To date can't be before the From date.");
      return;
    }
    if (count > MAX_DAYS) {
      setError(`Choose up to ${MAX_DAYS} days.`);
      return;
    }

    setBusy(true);
    try {
      const dates: Date[] = [];
      for (let i = 0; i < count; i++) dates.push(new Date(a.getFullYear(), a.getMonth(), a.getDate() + i));

      // The events you've added are kept per year, so fetch each year the dates touch.
      const years = Array.from(new Set(dates.map((d) => d.getFullYear())));
      const custom = new Map<string, SheetEvent[]>();
      if (signedIn) {
        const results = await Promise.all(
          years.map((y) =>
            fetch(`/api/calendar-events?year=${y}&calendar=${variant}`)
              .then((r) => r.json())
              .then((data) => (data.events ?? []) as { year: number; month: number; day: number; title: string; time: string | null }[])
              .catch(() => [])
          )
        );
        for (const e of results.flat()) {
          const key = `${e.year}-${e.month}-${e.day}`;
          custom.set(key, [...(custom.get(key) ?? []), { label: e.title, time: e.time }]);
        }
      }

      const days: SheetDay[] = dates.map((date) => {
        const events: SheetEvent[] = [];
        if (!professional) {
          for (const o of occasionsForYear(date.getFullYear())) {
            if (o.month === date.getMonth() && o.day === date.getDate()) events.push({ label: o.label, time: null });
          }
        }
        events.push(...(custom.get(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`) ?? []));
        return { date, weekday: (date.getDay() + 6) % 7, events };
      });

      setOpen(false);
      try {
        localStorage.setItem(NOTES_KEY, notesText);
      } catch {}
      setJob({ days, size, lines, notes, notesText: notesText.trim() });
    } finally {
      setBusy(false);
    }
  }

  // Shrink each box's event text until it all fits inside the box.
  useLayoutEffect(() => {
    if (!job || !sheetRef.current) return;
    sheetRef.current.querySelectorAll<HTMLElement>("[data-range-box]").forEach((box) => {
      const head = box.querySelector<HTMLElement>("[data-range-head]");
      const evs = box.querySelector<HTMLElement>("[data-range-events]");
      if (!head || !evs) return;
      let pt = 9.5;
      evs.style.fontSize = `${pt}pt`;
      while (head.offsetHeight + evs.offsetHeight > box.clientHeight - 2 && pt > 5) {
        pt -= 0.5;
        evs.style.fontSize = `${pt}pt`;
      }
    });

    // Typed notes shrink to fit the notes box in the same way.
    const noteEl = sheetRef.current.querySelector<HTMLElement>("[data-range-notes]");
    if (noteEl) {
      let pt = 10;
      noteEl.style.fontSize = `${pt}pt`;
      while (noteEl.scrollHeight > noteEl.clientHeight + 1 && pt > 5) {
        pt -= 0.5;
        noteEl.style.fontSize = `${pt}pt`;
      }
    }
  }, [job]);

  // Print, then put the page back to normal.
  useEffect(() => {
    if (!job) return;
    const area = document.getElementById("calendar-print-area");
    let styleEl = document.getElementById("dynamic-print-page");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "dynamic-print-page";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `@page { size: ${job.size} landscape; margin: 0; }`;
    area?.setAttribute("data-print-mode", "range");

    const finish = () => {
      area?.removeAttribute("data-print-mode");
      setJob(null);
    };
    window.addEventListener("afterprint", finish, { once: true });
    const timer = setTimeout(() => window.print(), 150);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", finish);
    };
  }, [job]);

  const offset = job && job.days.length > 1 ? 12 : 0;
  const crossesMonths = job ? new Set(job.days.map((d) => d.date.getMonth())).size > 1 : false;

  return (
    <>
      <style>{`
        .range-sheet { position: absolute; left: -10000px; top: 0; width: 297mm; height: 209mm; box-sizing: border-box; padding: 10mm; background: #fff; color: #3F3237; font-family: Georgia, serif; display: flex; flex-direction: column; overflow: hidden; pointer-events: none; }
        @media print {
          #calendar-print-area[data-print-mode="range"] { padding: 0 !important; background: #fff !important; }
          #calendar-print-area[data-print-mode="range"] .cal-content-wrap { display: none !important; }
          #calendar-print-area[data-print-mode="range"] .range-sheet { position: static !important; left: auto !important; page-break-after: avoid; break-after: avoid; }
          #calendar-print-area[data-print-mode="range"] .range-sheet[data-size="A3"] { zoom: 1.4142; }
          .range-sheet * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <button
        onClick={() => setOpen(true)}
        style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #B5714A", background: "#fff", color: "#B5714A", cursor: "pointer", fontWeight: 600 }}
      >
        Print dates
      </button>

      {open && (
        <div
          className="cal-no-print"
          style={{ position: "fixed", inset: 0, background: "rgba(63,50,55,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 380, maxWidth: "100%", background: "#fff", borderRadius: 16, border: "1px solid #EAE4D6", boxShadow: "0 12px 30px rgba(63,50,55,0.18)", padding: "22px 22px 20px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 19, color: "#3F3237", margin: 0 }}>Print dates</h2>
              <button onClick={() => setOpen(false)} style={{ border: "none", background: "none", color: "#8A7A6B", fontSize: 16, cursor: "pointer" }}>×</button>
            </div>
            <p style={{ fontSize: 12, color: "#8A7A6B", margin: "0 0 16px" }}>
              Pick up to {MAX_DAYS} days, such as a week. They print on one landscape page.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>From</label>
                <input type="date" style={fieldStyle} value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>To</label>
                <input type="date" style={fieldStyle} value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>

            <label style={labelStyle}>Paper size</label>
            <div style={{ display: "flex", gap: 16, marginBottom: 14, fontSize: 13.5, color: "#3F3237" }}>
              <label style={{ cursor: "pointer" }}>
                <input type="radio" name="range-size" checked={size === "A4"} onChange={() => setSize("A4")} /> A4
              </label>
              <label style={{ cursor: "pointer" }}>
                <input type="radio" name="range-size" checked={size === "A3"} onChange={() => setSize("A3")} /> Large print (A3)
              </label>
            </div>

            <div style={{ display: "grid", gap: 6, marginBottom: 14, fontSize: 13.5, color: "#3F3237" }}>
              <label style={{ cursor: "pointer" }}>
                <input type="checkbox" checked={lines} onChange={(e) => setLines(e.target.checked)} /> Writing lines in each day
              </label>
              <label style={{ cursor: "pointer" }}>
                <input type="checkbox" checked={notes} onChange={(e) => setNotes(e.target.checked)} /> Notes box at the bottom
              </label>
            </div>

            {notes && (
              <>
                <label style={labelStyle}>Notes to print</label>
                <textarea
                  style={{ ...fieldStyle, marginBottom: 4, resize: "vertical" }}
                  rows={4}
                  maxLength={600}
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Type anything to print in the notes box, or leave it empty for blank lines to write on."
                />
                <p style={{ fontSize: 11, color: "#8A7A6B", margin: "0 0 14px" }}>
                  Edit or clear it any time before you print. We remember your last notes on this computer.
                </p>
              </>
            )}

            {error && <p style={{ color: "#B5714A", fontSize: 12, fontWeight: 600, margin: "-4px 0 12px" }}>{error}</p>}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setOpen(false)}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #EAE4D6", background: "#fff", color: "#8A7A6B", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={start}
                disabled={busy}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #B5714A", background: "#B5714A", color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1 }}
              >
                {busy ? "Getting ready…" : "Print"}
              </button>
            </div>
          </div>
        </div>
      )}

      {job && area && createPortal(
        <div ref={sheetRef} className="range-sheet" data-size={job.size} aria-hidden="true">
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: "4mm" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "2mm" }}>
              <Image src="/activity-central-icon.png" alt="" width={44} height={44} />
              <span style={{ fontSize: "10pt" }}>Activity Central</span>
            </div>
            <div style={{ textAlign: "center" }}>
              {homeName && <p style={{ margin: 0, fontSize: "13pt" }}>{homeName}</p>}
              <p style={{ margin: "1mm 0", fontSize: "23pt", fontWeight: 400 }}>{rangeTitle(job.days)}</p>
              <p style={{ margin: 0, fontFamily: "Helvetica, Arial, sans-serif", fontSize: "7.5pt", letterSpacing: "1.5px", fontWeight: 700, color: "#B5714A" }}>
                {professional ? "PROFESSIONAL CALENDAR" : "HOLIDAYS & CELEBRATIONS"}
              </p>
            </div>
            <div style={{ justifySelf: "end", border: "1px solid #EAE4D6", borderRadius: "5mm", padding: "1mm 4mm", fontFamily: "Helvetica, Arial, sans-serif", fontSize: "10pt", fontWeight: 700 }}>
              {job.days[0].date.getFullYear() === job.days[job.days.length - 1].date.getFullYear()
                ? job.days[0].date.getFullYear()
                : `${job.days[0].date.getFullYear()}/${String(job.days[job.days.length - 1].date.getFullYear()).slice(2)}`}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "grid",
              gridTemplateColumns: `repeat(${job.days.length}, minmax(0, 1fr))`,
              gap: "2mm",
            }}
          >
            {job.days.map((d, i) => {
              const down = offset > 0 && i % 2 === 1;
              const c = TAB_COLORS[d.weekday];
              return (
                <div
                  key={i}
                  data-range-box
                  style={{
                    height: offset ? `calc(100% - ${offset}mm)` : "100%",
                    alignSelf: down ? "end" : "start",
                    border: "1px solid #EAE4D6",
                    borderRadius: "2.5mm",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    background: "#fff",
                    fontFamily: "Helvetica, Arial, sans-serif",
                  }}
                >
                  <div data-range-head style={{ flex: "0 0 auto" }}>
                    <div style={{ background: c.bg, color: c.text, textAlign: "center", fontSize: "8.5pt", fontWeight: 700, padding: "1.5mm 0" }}>
                      {WEEKDAYS[d.weekday]}
                    </div>
                    <p style={{ margin: "2mm 2mm 1mm", fontSize: "17pt", fontWeight: 700, lineHeight: 1 }}>
                      {d.date.getDate()}
                      {crossesMonths && <span style={{ fontSize: "8pt", fontWeight: 400, marginLeft: "1.5mm" }}>{MONTHS[d.date.getMonth()].slice(0, 3)}</span>}
                    </p>
                  </div>
                  <div data-range-events style={{ flex: "0 0 auto", padding: "0 2mm", fontSize: "9.5pt" }}>
                    {d.events.map((e, k) => (
                      <div
                        key={k}
                        style={{
                          background: c.bg,
                          color: c.text,
                          borderRadius: "1.5mm",
                          padding: "0.8mm 1.6mm",
                          marginBottom: "1mm",
                          fontWeight: 700,
                          lineHeight: 1.2,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {e.label}
                        {e.time ? ` · ${e.time}` : ""}
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      flex: "1 1 0",
                      minHeight: 0,
                      margin: "0 2mm",
                      backgroundImage: job.lines ? `repeating-linear-gradient(to bottom, transparent 0, transparent 6.2mm, ${RULE} 6.2mm, ${RULE} 6.5mm)` : "none",
                    }}
                  />
                </div>
              );
            })}
          </div>

          {job.notes && (
            <div style={{ flex: "0 0 auto", marginTop: "3mm", border: "1px solid #EAE4D6", borderRadius: "2.5mm", padding: "1.5mm 3mm", height: "24mm", boxSizing: "border-box", fontFamily: "Helvetica, Arial, sans-serif" }}>
              <p style={{ margin: 0, fontSize: "7.5pt", fontWeight: 700, letterSpacing: "1px", color: "#B5714A" }}>NOTES</p>
              {job.notesText ? (
                <div
                  data-range-notes
                  style={{ height: "calc(100% - 4mm)", overflow: "hidden", whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: "10pt", lineHeight: 1.3, paddingTop: "1mm" }}
                >
                  {job.notesText}
                </div>
              ) : (
                <div style={{ height: "calc(100% - 4mm)", backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent 5.2mm, ${RULE} 5.2mm, ${RULE} 5.5mm)` }} />
              )}
            </div>
          )}
        </div>,
        area
      )}
    </>
  );
}
