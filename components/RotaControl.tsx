"use client";

import { useState, type CSSProperties } from "react";
import {
  PRESET_ROTA,
  ROTA_DAYS,
  ROTA_SUGGESTIONS,
  ROTA_WEEKDAYS,
  ROTA_WEEKS,
  defaultRota,
  fromInputDate,
  mondayOf,
  toInputDate,
  type RotaConfig,
} from "@/lib/rota";

// The weekly rota on the calendar: a tick box to show or hide it, and a window to
// choose the preset rota or make your own, and which Monday Week 1 starts on.

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
}: {
  variant: "activity" | "professional";
  signedIn: boolean;
  rota: RotaConfig | null;
  onChange: (rota: RotaConfig) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RotaConfig>(defaultRota());
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

  // The tick box: switches the rota on or off straight away.
  async function toggle(enabled: boolean) {
    const base = rota ?? defaultRota();
    const ok = await save({ ...base, enabled });
    if (!ok && !open) window.alert("The rota couldn't be changed just now. Please try again.");
  }

  function openDialog() {
    setDraft(rota ? { ...rota, slots: rota.slots.map((r) => [...r]) } : { ...defaultRota(), enabled: true });
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
      <label
        title={signedIn ? "Show or hide your weekly rota" : "Sign in to use the weekly rota"}
        style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 14px", borderRadius: 10, border: "1px solid #EAE4D6", background: "#fff", color: "#3F3237", fontWeight: 600, fontSize: 14, cursor: signedIn ? "pointer" : "not-allowed", opacity: signedIn ? 1 : 0.55 }}
      >
        <input type="checkbox" disabled={!signedIn || saving} checked={!!rota?.enabled} onChange={(e) => toggle(e.target.checked)} />
        Weekly rota
      </label>
      <button
        onClick={() => signedIn && openDialog()}
        disabled={!signedIn}
        style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #B5714A", background: "#fff", color: "#B5714A", cursor: signedIn ? "pointer" : "not-allowed", fontWeight: 600, opacity: signedIn ? 1 : 0.55 }}
      >
        Rota settings
      </button>

      {open && (
        <div
          className="cal-no-print"
          style={{ position: "fixed", inset: 0, background: "rgba(63,50,55,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 640, maxWidth: "100%", maxHeight: "92vh", overflowY: "auto", background: "#fff", borderRadius: 16, border: "1px solid #EAE4D6", boxShadow: "0 12px 30px rgba(63,50,55,0.18)", padding: "22px 22px 20px", color: "#3F3237" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 19, margin: 0 }}>Weekly rota</h2>
              <button onClick={() => setOpen(false)} style={{ border: "none", background: "none", color: "#8A7A6B", fontSize: 16, cursor: "pointer" }}>×</button>
            </div>
            <p style={{ fontSize: 12.5, color: "#8A7A6B", margin: "0 0 14px" }}>
              A 4-week pattern, Monday to Friday, that repeats on your calendar. It shows on the screen, in printouts and on shared calendar
              links, and disappears when you untick it. Your own events aren't touched.
            </p>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, marginBottom: 14, cursor: "pointer" }}>
              <input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} />
              Show the rota on my calendar
            </label>

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
                  <span style={labelStyle}>Type or pick an activity for each day. Leave a box empty for nothing.</span>
                  <button
                    onClick={() => setDraft({ ...draft, slots: PRESET_ROTA.map((r) => [...r]) })}
                    style={{ border: "none", background: "none", color: "#B5714A", fontWeight: 700, fontSize: 12, cursor: "pointer", textDecoration: "underline", whiteSpace: "nowrap" }}
                  >
                    Start from the preset
                  </button>
                </div>
                <datalist id="rota-suggestions">
                  {ROTA_SUGGESTIONS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                <RotaGrid rows={draft.slots} onEdit={setSlot} />
              </>
            )}

            {error && <p style={{ color: "#B5714A", fontSize: 12, fontWeight: 600, margin: "12px 0 0" }}>{error}</p>}

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
                    <input
                      list="rota-suggestions"
                      value={rows[w]?.[d] ?? ""}
                      maxLength={60}
                      onChange={(e) => onEdit?.(w, d, e.target.value)}
                      aria-label={`Week ${w + 1}, ${ROTA_WEEKDAYS[d]}`}
                      style={inputStyle}
                    />
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
