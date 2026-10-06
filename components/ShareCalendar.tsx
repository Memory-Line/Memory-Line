"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { MONTH_NAMES, monthsLabel } from "@/lib/calendarShared";

// "Share calendar": makes a public, read-only link to chosen months, for a care
// home to put on its own website. Lists the account's links so they can be
// copied again or switched off.

type Link = { id: string; token: string; calendar: string; year: number; months: number[] };

const labelStyle: CSSProperties = { fontSize: 12, fontWeight: 700, color: "#3F3237", marginBottom: 5, display: "block" };

export default function ShareCalendar({
  variant,
  signedIn,
  defaultYear,
  defaultMonth,
}: {
  variant: "activity" | "professional";
  signedIn: boolean;
  defaultYear: number;
  defaultMonth: number;
}) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(defaultYear);
  const [months, setMonths] = useState<number[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/shared-calendar").catch(() => null);
    if (res?.ok) setLinks((await res.json()).links ?? []);
  }

  function openDialog() {
    setYear(defaultYear);
    // The month on screen and the next two (up to December).
    setMonths([defaultMonth, defaultMonth + 1, defaultMonth + 2].filter((m) => m <= 11));
    setError(null);
    setOpen(true);
    load();
  }

  useEffect(() => {
    if (!open) setCopied(null);
  }, [open]);

  function toggle(m: number) {
    setMonths((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  const urlFor = (token: string) => `${window.location.origin}/c/${token}`;

  async function create() {
    setError(null);
    if (months.length === 0) {
      setError("Pick at least one month.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/shared-calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendar: variant, year, months }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }
    setLinks((prev) => [data.link, ...prev]);
    copy(data.link.token);
  }

  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(urlFor(token));
      setCopied(token);
    } catch {
      setCopied(null);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/shared-calendar/${id}`, { method: "DELETE" });
    if (res.ok) setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  const mine = links.filter((l) => l.calendar === variant);

  return (
    <>
      <button
        onClick={() => signedIn && openDialog()}
        disabled={!signedIn}
        style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #B5714A", background: "#fff", color: "#B5714A", cursor: signedIn ? "pointer" : "not-allowed", fontWeight: 600, opacity: signedIn ? 1 : 0.55 }}
      >
        Share calendar
      </button>

      {open && (
        <div
          className="cal-no-print"
          style={{ position: "fixed", inset: 0, background: "rgba(63,50,55,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 440, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: 16, border: "1px solid #EAE4D6", boxShadow: "0 12px 30px rgba(63,50,55,0.18)", padding: "22px 22px 20px", color: "#3F3237" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 19, margin: 0 }}>Share your calendar</h2>
              <button onClick={() => setOpen(false)} style={{ border: "none", background: "none", color: "#8A7A6B", fontSize: 16, cursor: "pointer" }}>×</button>
            </div>
            <p style={{ fontSize: 12.5, color: "#8A7A6B", margin: "0 0 14px" }}>
              Get a link to put on your home's website, newsletter or Facebook page. It shows the months you pick, in our design, with
              the built-in dates and the events you've added.
            </p>

            <label style={labelStyle}>Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #EAE4D6", background: "#FBF9F4", fontSize: 13.5, marginBottom: 14 }}
            >
              {[defaultYear - 1, defaultYear, defaultYear + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <label style={labelStyle}>Months to show</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 14, fontSize: 13.5 }}>
              {MONTH_NAMES.map((name, m) => (
                <label key={m} style={{ cursor: "pointer" }}>
                  <input type="checkbox" checked={months.includes(m)} onChange={() => toggle(m)} /> {name.slice(0, 3)}
                </label>
              ))}
            </div>

            <p style={{ fontSize: 12, color: "#8A5A2A", background: "#FCEFE7", borderRadius: 8, padding: "8px 10px", margin: "0 0 14px" }}>
              Anyone with the link can see these months, including events you've added. Don't put residents' names or private
              details in them. You can switch a link off below at any time.
            </p>

            {error && <p style={{ color: "#B5714A", fontSize: 12, fontWeight: 600, margin: "0 0 10px" }}>{error}</p>}

            <button
              onClick={create}
              disabled={busy}
              style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: "1px solid #B5714A", background: "#B5714A", color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1 }}
            >
              {busy ? "Making your link…" : "Make my link"}
            </button>

            {mine.length > 0 && (
              <>
                <p style={{ ...labelStyle, marginTop: 18 }}>Your links</p>
                <div style={{ display: "grid", gap: 8 }}>
                  {mine.map((l) => (
                    <div key={l.id} style={{ border: "1px solid #EAE4D6", borderRadius: 10, padding: "8px 10px", background: "#FBF9F4" }}>
                      <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700 }}>
                        {monthsLabel(l.months)} {l.year}
                      </p>
                      <input
                        readOnly
                        value={typeof window !== "undefined" ? urlFor(l.token) : ""}
                        onFocus={(e) => e.currentTarget.select()}
                        style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #EAE4D6", fontSize: 12, background: "#fff", marginBottom: 6 }}
                      />
                      <div style={{ display: "flex", gap: 12, fontSize: 12, fontWeight: 700 }}>
                        <span onClick={() => copy(l.token)} style={{ cursor: "pointer", color: "#B5714A", textDecoration: "underline" }}>
                          {copied === l.token ? "Copied" : "Copy link"}
                        </span>
                        <a href={`/c/${l.token}`} target="_blank" rel="noreferrer" style={{ color: "#B5714A" }}>Open</a>
                        <span onClick={() => remove(l.id)} style={{ cursor: "pointer", color: "#8A7A6B", textDecoration: "underline", marginLeft: "auto" }}>
                          Switch off
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
