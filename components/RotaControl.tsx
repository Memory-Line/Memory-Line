"use client";

import { useState, type CSSProperties } from "react";
import {
  PRESET_ROTA,
  ROTA_DAYS,
  ROTA_ACTIVITIES,
  ROTA_WEEKDAYS,
  ROTA_WEEKS,
  defaultRota,
  fromInputDate,
  mondayOf,
  rotaMonthKey,
  toInputDate,
  type RotaConfig,
} from "@/lib/rota";

// The weekly rota on the calendar: a tick box to show or hide it for the month
// being looked at (it applies to that month only, not the whole calendar), and a
// window to choose the preset rota or make your own, which Monday Week 1 starts
// on, and which months it's on for.

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthName = (key: string) => {
  const [y, m] = key.split("-");
  return `${MONTH_NAMES[Number(m) - 1]} ${y}`;
};

const labelStyle: CSSProperties = { fontSize: 12, fontWeight: 700, color: "#3F3237", marginBottom: 5, display: "block" };
const inputStyle: CSSProperties = {
  width: "100%",
  padding: "7px 9px",
  borderRadius: 8,
  border: "1px solid #EAE4D6",
  fontSize: 12.5,
  color: "#3F3237",
  fontFamily: "inherit",
  background: "#FBF9F4",
};

export default function RotaControl({
  variant,
  signedIn,
  rota,
  onChange,
  year,
  monthIndex,
}: {
  variant: "activity" | "professional";
  signedIn: boolean;
  rota: RotaConfig | null;
  onChange: (rota: RotaConfig | null) => void;
  // The month on screen: the tick box switches the rota on or off for this month only.
  year: number;
  monthIndex: number;
}) {
  const monthKey = rotaMonthKey(year, monthIndex);
  const thisMonth = monthName(monthKey);
  const onForThisMonth = !!rota?.months.includes(monthKey);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RotaConfig>(defaultRota(year, monthIndex));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: RotaConfig): Promise<boolean> {
    setError(null);
    setSaving(true);
    const res = await fetch("/api/calendar-rota", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendar: variant, ...next }),
    }).catch(() => null);
    setSaving(false);
    const data = await res?.json().catch(() => ({}));
    if (!res || !res.ok) {
      setError(data?.error ?? "That didn't save. Please try again.");
      return false;
    }
    onChange(data.rota);
    return true;
  }

  // The tick box: switches the rota on or off for the month on screen, straight away.
  async function toggle(on: boolean) {
    const base = rota ?? defaultRota(year, monthIndex);
    const months = on ? Array.from(new Set([...base.months, monthKey])) : base.months.filter((m) => m !== monthKey);
    const ok = await save({ ...base, months });
    if (!ok && !open) window.alert("The rota couldn't be changed just now. Please try again.");
  }

  // Takes the rota off the calendar and deletes it, including any "my own" activities.
  async function remove() {
    if (!window.confirm("Remove your weekly rota? It will disappear from the calendar and your own activity choices will be deleted.")) return;
    setError(null);
    setSaving(true);
    const res = await fetch(`/api/calendar-rota?calendar=${variant}`, { method: "DELETE" }).catch(() => null);
    setSaving(false);
    if (!res || !res.ok) {
      setError("That didn't work. Please try again.");
      return;
    }
    onChange(null);
    setOpen(false);
  }

  function openDialog() {
    setDraft(
      rota
        ? { ...rota, months: [...rota.months], slots: rota.slots.map((r) => [...r]) }
        : { ...defaultRota(year, monthIndex), months: [monthKey] }
    );
    setError(null);
    setOpen(true);
  }

  function setSlot(w: number, d: number, value: string) {
    setDraft((prev) => ({ ...prev, slots: prev.slots.map((row, i) => (i === w ? row.map((c, j) => (j === d ? value.slice(0, 60) : c)) : row)) }));
  }

  // Week 1 has to start on a Monday, so a date picked on another day moves to that week's Monday.
  function setStart(value: string) {
    const d = fromInputDate(value);
    setDraft((prev) => ({ ...prev, startDate: d ? toInputDate(mondayOf(d)) : value }));
  }

  async function saveDraft() {
    if (await save(draft)) setOpen(false);
  }

  return (
    <>
      {/* A small tick box and link above the calendar (not printed). */}
      <div className="cal-no-print" style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12.5, color: "#6B5F57", margin: "0 0 6px" }}>
        <label
          title={signedIn ? `Show or hide your weekly rota for ${thisMonth} only` : "Sign in to use the weekly rota"}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, cursor: signedIn ? "pointer" : "not-allowed", opacity: signedIn ? 1 : 0.55 }}
        >
          <input type="checkbox" disabled={!signedIn || saving} checked={onForThisMonth} onChange={(e) => toggle(e.target.checked)} />
          Weekly rota for {thisMonth}
        </label>
        <button
          onClick={() => signedIn && openDialog()}
          disabled={!signedIn}
          style={{ border: "none", background: "none", padding: 0, color: "#B5714A", fontWeight: 700, fontSize: 12.5, textDecoration: "underline", cursor: signedIn ? "pointer" : "not-allowed", opacity: signedIn ? 1 : 0.55 }}
        >
          Rota settings
        </button>
      </div>

      {open && (
        <div
          className="cal-no-print"
          style={{ position: "fixed", inset: 0, background: "rgba(63,50,55,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 800, maxWidth: "100%", maxHeight: "92vh", overflowY: "auto", background: "#fff", borderRadius: 16, border: "1px solid #EAE4D6", boxShadow: "0 12px 30px rgba(63,50,55,0.18)", padding: "22px 22px 20px", color: "#3F3237" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 19, margin: 0 }}>Weekly rota</h2>
              <button onClick={() => setOpen(false)} style={{ border: "none", background: "none", color: "#8A7A6B", fontSize: 16, cursor: "pointer" }}>×</button>
            </div>
            <p style={{ fontSize: 12.5, color: "#8A7A6B", margin: "0 0 14px" }}>
              A 4-week pattern, Monday to Friday. It only shows on the months you switch it on for, on the screen, in printouts and on
              shared calendar links. Your own events aren't touched.
            </p>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, marginBottom: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={draft.months.includes(monthKey)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    months: e.target.checked ? Array.from(new Set([...draft.months, monthKey])) : draft.months.filter((m) => m !== monthKey),
                  })
                }
              />
              Show the rota on {thisMonth}
            </label>
            {draft.months.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 14, fontSize: 12.5 }}>
                <span style={{ color: "#8A7A6B" }}>On for:</span>
                {[...draft.months].sort().map((m) => (
                  <span key={m} style={{ background: "#F2E2B8", color: "#6B5723", borderRadius: 8, padding: "3px 4px 3px 9px", fontWeight: 700 }}>
                    {monthName(m)}{" "}
                    <button
                      onClick={() => setDraft({ ...draft, months: draft.months.filter((x) => x !== m) })}
                      aria-label={`Switch off for ${monthName(m)}`}
                      style={{ border: "none", background: "none", color: "#6B5723", cursor: "pointer", fontSize: 14, padding: "0 4px" }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <span style={labelStyle}>Which rota?</span>
            <div style={{ display: "grid", gap: 6, marginBottom: 14, fontSize: 13.5 }}>
              <label style={{ cursor: "pointer" }}>
                <input type="radio" name="rota-mode" checked={draft.mode === "preset"} onChange={() => setDraft({ ...draft, mode: "preset" })} /> Use the
                preset rota
              </label>
              <label style={{ cursor: "pointer" }}>
                <input type="radio" name="rota-mode" checked={draft.mode === "custom"} onChange={() => setDraft({ ...draft, mode: "custom" })} /> Pick my
                own
              </label>
            </div>

            <label style={labelStyle}>Week 1 starts on (a Monday)</label>
            <input type="date" value={draft.startDate} onChange={(e) => setStart(e.target.value)} style={{ ...inputStyle, width: 190, marginBottom: 14, fontSize: 13.5 }} />

            {draft.mode === "preset" ? (
              <RotaGrid rows={PRESET_ROTA} readOnly />
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={labelStyle}>Pick an activity for each day from the list. Choose "Nothing" to leave a day empty.</span>
                  <button
                    onClick={() => setDraft({ ...draft, slots: PRESET_ROTA.map((r) => [...r]) })}
                    style={{ border: "none", background: "none", color: "#B5714A", fontWeight: 700, fontSize: 12, cursor: "pointer", textDecoration: "underline", whiteSpace: "nowrap" }}
                  >
                    Start from the preset
                  </button>
                </div>
                <RotaGrid rows={draft.slots} onEdit={setSlot} />
              </>
            )}

            {error && <p style={{ color: "#B5714A", fontSize: 12, fontWeight: 600, margin: "12px 0 0" }}>{error}</p>}

            {rota && (
              <button
                onClick={remove}
                disabled={saving}
                style={{ marginTop: 14, border: "none", background: "none", padding: 0, color: "#B5453D", fontWeight: 700, fontSize: 12.5, textDecoration: "underline", cursor: saving ? "default" : "pointer" }}
              >
                Remove the rota from my calendar
              </button>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button
                onClick={() => setOpen(false)}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #EAE4D6", background: "#fff", color: "#8A7A6B", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={saveDraft}
                disabled={saving}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #B5714A", background: "#B5714A", color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Saving…" : "Save rota"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function RotaGrid({
  rows,
  readOnly,
  onEdit,
}: {
  rows: string[][];
  readOnly?: boolean;
  onEdit?: (week: number, day: number, value: string) => void;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 4, fontSize: 12.5, minWidth: 520 }}>
        <thead>
          <tr>
            <th />
            {ROTA_WEEKDAYS.map((d) => (
              <th key={d} style={{ textAlign: "left", fontSize: 11.5, color: "#8A7A6B", padding: "0 2px" }}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: ROTA_WEEKS }, (_, w) => (
            <tr key={w}>
              <td style={{ fontWeight: 700, whiteSpace: "nowrap", paddingRight: 6 }}>Week {w + 1}</td>
              {Array.from({ length: ROTA_DAYS }, (_, d) => (
                <td key={d} style={{ verticalAlign: "top" }}>
                  {readOnly ? (
                    <div style={{ background: "#FBF9F4", border: "1px solid #EAE4D6", borderRadius: 8, padding: "7px 9px", minHeight: 34 }}>{rows[w]?.[d]}</div>
                  ) : (
                    <select
                      value={rows[w]?.[d] ?? ""}
                      onChange={(e) => onEdit?.(w, d, e.target.value)}
                      aria-label={`Week ${w + 1}, ${ROTA_WEEKDAYS[d]}`}
                      style={inputStyle}
                    >
                      <option value="">Nothing</option>
                      {/* A saved activity that isn't in the list (typed in an earlier version) stays selectable. */}
                      {rows[w]?.[d] && !ROTA_ACTIVITIES.includes(rows[w][d]) && <option value={rows[w][d]}>{rows[w][d]}</option>}
                      {ROTA_ACTIVITIES.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
