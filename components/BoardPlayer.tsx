"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ALWAYS, AUDIO, OTHER_LANGS, UI, type Board, type BoardAnswer, type LangCode, type Text3 } from "@/lib/boards";

const LEAF = ["#3E6E96", "#6B4A9B", "#A6822C", "#A05A6A", "#2F7A63", "#B5714A", "#5B8A9E", "#8A6E52"];
const CREAM = "#F5F0E4", LINE = "#E6DDC8", INK = "#2E2B24", SAGE = "#8BA888", SAGED = "#4C6B4A", CLAY = "#B08968";
const QR_URL = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm";
const importFromCdn = new Function("url", "return import(url)") as (url: string) => Promise<any>;

type Mode = "en" | "other" | "both";
type Voice = "female" | "male";
type Speed = "slow" | "normal";

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div>
      <div style={{ font: "700 12px Arial", letterSpacing: 0.8, color: "#8A7A6B", marginBottom: 6 }}>{label.toUpperCase()}</div>
      <div role="group" aria-label={label} style={{ display: "flex", gap: 2, background: "#fff", border: `2px solid ${LINE}`, borderRadius: 999, padding: 3 }}>
        {options.map(([v, text]) => (
          <button key={v} type="button" onClick={() => onChange(v)} aria-pressed={value === v}
            style={{ padding: "10px 16px", borderRadius: 999, border: 0, cursor: "pointer", font: "700 15px Arial", background: value === v ? SAGED : "transparent", color: value === v ? "#fff" : INK }}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BoardPlayer({ board, lang, back }: { board: Board; lang?: string; back?: { href: string; label: string } }) {
  const [mode, setMode] = useState<Mode>(lang === "en" ? "en" : "both");
  const [other, setOther] = useState<LangCode>(lang === "ur" ? "ur" : "pl");
  const [voice, setVoice] = useState<Voice>("female");
  const [speed, setSpeed] = useState<Speed>("slow");
  const [chosen, setChosen] = useState<BoardAnswer | null>(null);
  const [printSize, setPrintSize] = useState<"a4" | "a3">("a4");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const runId = useRef(0);
  const qrRef = useRef<HTMLDivElement | null>(null);
  const otherInfo = OTHER_LANGS.find((l) => l.code === other)!;

  const langs = (): LangCode[] => (mode === "en" ? ["en"] : mode === "other" ? [other] : ["en", other]);

  function stop() {
    runId.current++;
    audioRef.current?.pause();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }

  // Plays one phrase and resolves when it ends. Falls back to the device voice if the recording is missing.
  function playOne(lang: LangCode, text: string, id: number): Promise<void> {
    return new Promise((resolve) => {
      if (id !== runId.current) return resolve();
      const src = AUDIO[`${lang}|${voice}|${text}`];
      if (src) {
        const a = audioRef.current ?? (audioRef.current = new Audio());
        a.src = src;
        a.playbackRate = speed === "slow" ? 0.8 : 1;
        a.onended = () => resolve();
        a.onerror = () => resolve();
        a.play().catch(() => resolve());
      } else if (window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang === "en" ? "en-GB" : lang === "pl" ? "pl-PL" : "ur-PK";
        u.rate = speed === "slow" ? 0.75 : 1;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        window.speechSynthesis.speak(u);
      } else resolve();
    });
  }

  async function speak(items: Text3[]) {
    stop();
    const id = runId.current;
    for (const item of items) {
      for (const lang of langs()) {
        if (id !== runId.current) return;
        await playOne(lang, item[lang], id);
        await new Promise((r) => setTimeout(r, 250));
      }
    }
  }

  const choose = (a: BoardAnswer) => {
    setChosen(a);
    speak([a.say]);
  };
  const readChoices = () => speak([board.question, ...board.answers.map((a) => a.label)]);

  useEffect(() => () => stop(), []);

  // QR code for the printout: drawn in the browser, nothing stored.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await importFromCdn(QR_URL);
        const qrcode = mod.default ?? mod;
        const qr = qrcode(0, "M");
        qr.addData(`${window.location.origin}/boards/${board.id}`);
        qr.make();
        if (!cancelled && qrRef.current) {
          qrRef.current.innerHTML = qr.createSvgTag({ cellSize: 3, margin: 0, scalable: true });
          const sv = qrRef.current.querySelector("svg");
          sv?.setAttribute("width", "100%");
          sv?.setAttribute("height", "100%");
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [board.id]);

  const showEn = mode !== "other";
  const showOther = mode !== "en";
  const rtl = otherInfo.rtl;
  const secondary = (t: Text3) => (
    <span dir={rtl ? "rtl" : "ltr"}>{t[other]}</span>
  );

  function print(size: "a4" | "a3") {
    setPrintSize(size);
    setTimeout(() => window.print(), 100);
  }

  return (
    <main style={{ background: CREAM, minHeight: "100vh", color: INK }}>
      <style>{`
        .bp-print{display:none}
        @media print{
          @page{size:${printSize === "a3" ? "A3" : "A4"} portrait;margin:0}
          body *{visibility:hidden}
          .bp-print,.bp-print *{visibility:visible}
          .bp-print{display:block;position:absolute;left:0;top:0;width:100%;background:#fff}
          .bp-screen{display:none}
        }
      `}</style>

      <div className="bp-screen" style={{ maxWidth: 1100, margin: "0 auto", padding: "18px 14px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 20 }}>Activity Central</div>
            <div style={{ font: "700 12px Arial", letterSpacing: 1, color: CLAY }}>COMMUNICATION BOARD · {board.area.toUpperCase()} · {board.code}</div>
          </div>
          <Link href={back?.href ?? "/boards"} style={{ color: SAGED, font: "700 14px Arial" }}>{back?.label ?? "All boards"}</Link>
        </div>

        <div style={{ background: "#fff", border: `2px solid ${LINE}`, borderRadius: 18, padding: "14px 16px", marginBottom: 14, display: "flex", gap: 22, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Seg<Mode> label="Language" value={mode} onChange={setMode} options={[["en", "English"], ["other", otherInfo.name], ["both", "Both"]]} />
          <Seg<LangCode> label="Other language" value={other} onChange={setOther} options={OTHER_LANGS.map((l) => [l.code, l.name] as [LangCode, string])} />
          <Seg<Voice> label="Voice" value={voice} onChange={setVoice} options={[["female", "Female"], ["male", "Male"]]} />
          <Seg<Speed> label="Speed" value={speed} onChange={setSpeed} options={[["slow", "Slow"], ["normal", "Normal"]]} />
          <button type="button" onClick={readChoices} style={{ marginLeft: "auto", background: CLAY, color: "#fff", border: 0, borderRadius: 12, padding: "13px 18px", font: "700 15px Arial", cursor: "pointer" }}>
            🔊 {UI.readChoices.en}{showOther && showEn ? "" : ""}
          </button>
        </div>

        <div style={{ background: "#fff", border: `2px solid ${LINE}`, borderLeft: `10px solid ${SAGE}`, borderRadius: 22, padding: "20px 24px", marginBottom: 14 }}>
          {showEn && <div style={{ fontFamily: "Georgia, serif", fontSize: "clamp(26px,5vw,42px)", lineHeight: 1.15 }}>{board.question.en}</div>}
          {showOther && <div style={{ fontFamily: "Georgia, serif", fontSize: showEn ? "clamp(17px,3vw,25px)" : "clamp(26px,5vw,42px)", color: showEn ? "#6B6252" : INK, marginTop: showEn ? 6 : 0 }}>{secondary(board.question)}</div>}
        </div>

        {chosen && (
          <div style={{ background: SAGED, color: "#fff", borderRadius: 18, padding: "16px 20px", marginBottom: 14, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }} aria-live="polite">
            <div style={{ flex: 1, minWidth: 170 }}>
              {showEn && <div style={{ fontFamily: "Georgia, serif", fontSize: "clamp(20px,3.5vw,28px)", fontWeight: 700 }}>{chosen.say.en}</div>}
              {showOther && <div style={{ fontFamily: "Georgia, serif", fontSize: showEn ? "clamp(15px,2.5vw,19px)" : "clamp(20px,3.5vw,28px)", fontWeight: showEn ? 600 : 700, opacity: showEn ? 0.92 : 1, marginTop: 2 }}>{secondary(chosen.say)}</div>}
            </div>
            <button type="button" onClick={() => speak([chosen.say])} style={{ background: "#fff", color: SAGED, border: 0, borderRadius: 12, padding: "12px 18px", font: "700 16px Arial", cursor: "pointer" }}>▶ {UI.playAgain.en}</button>
            <button type="button" onClick={() => { stop(); setChosen(null); }} style={{ background: "transparent", color: "#fff", border: "2px solid #fff", borderRadius: 12, padding: "10px 16px", font: "700 15px Arial", cursor: "pointer" }}>Clear</button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 14, marginBottom: 18 }}>
          {board.answers.map((a, i) => {
            const sel = chosen ? chosen.id === a.id : null;
            const col = LEAF[i % LEAF.length];
            return (
              <button key={a.id} type="button" onClick={() => choose(a)} aria-pressed={sel === true}
                style={{ position: "relative", background: sel ? "#EEF3EC" : "#fff", border: sel ? `4px solid ${SAGED}` : `2px solid ${LINE}`, borderRadius: 20, padding: "0 10px 12px", textAlign: "center", overflow: "hidden", cursor: "pointer", opacity: sel === false ? 0.45 : 1, color: INK }}>
                <div style={{ height: 8, background: col, margin: "0 -10px 10px" }} />
                {sel && <div style={{ position: "absolute", right: 10, top: 14, width: 30, height: 30, borderRadius: "50%", background: SAGED, color: "#fff", font: "700 19px Arial", display: "flex", alignItems: "center", justifyContent: "center" }}>✓</div>}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/boards/icons/${a.id}.svg`} alt="" width={110} height={110} style={{ display: "block", margin: "0 auto 4px" }} />
                {showEn && <div style={{ font: "700 24px Georgia,serif" }}>{a.label.en}</div>}
                {showOther && <div style={{ font: showEn ? "600 17px Arial" : "700 24px Georgia,serif", color: showEn ? "#6B6252" : INK, marginTop: 2 }}>{secondary(a.label)}</div>}
              </button>
            );
          })}
        </div>

        <div style={{ font: "700 13px Arial", letterSpacing: 0.8, color: "#8A7A6B", margin: "0 0 8px" }}>{UI.always.en.toUpperCase()}</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
          {ALWAYS.map((a) => (
            <button key={a.id} type="button" onClick={() => choose(a)} style={{ flex: "1 1 110px", background: a.colour, color: "#fff", border: 0, borderRadius: 14, padding: "12px 6px", textAlign: "center", cursor: "pointer" }}>
              {showEn && <div style={{ font: "700 21px Georgia,serif" }}>{a.label.en}</div>}
              {showOther && <div style={{ font: showEn ? "600 15px Arial" : "700 21px Georgia,serif", opacity: 0.92 }}>{secondary(a.label)}</div>}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" onClick={() => print("a4")} style={{ background: "#fff", border: `2px solid ${LINE}`, borderRadius: 12, padding: "11px 16px", font: "700 15px Arial", cursor: "pointer", color: INK }}>🖨 Print A4</button>
          <button type="button" onClick={() => print("a3")} style={{ background: "#fff", border: `2px solid ${LINE}`, borderRadius: 12, padding: "11px 16px", font: "700 15px Arial", cursor: "pointer", color: INK }}>🖨 Print A3 large print</button>
          <span style={{ font: "12px Arial", color: "#8A7A6B" }}>Draft translations: to be checked by a fluent speaker before use. Pilot, admin only.</span>
        </div>
      </div>

      {/* Print layout: English + chosen other language, QR code to this board */}
      <div className="bp-print" style={{ boxSizing: "border-box", padding: printSize === "a3" ? "14mm 18mm" : "9mm 12mm", fontFamily: "Arial, sans-serif", color: "#111", zoom: printSize === "a3" ? 1.4 : 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4mm", paddingBottom: "3mm", borderBottom: `3px solid ${SAGE}` }}>
          <div>
            <div style={{ font: "600 21px Georgia,serif" }}>Activity Central</div>
            <div style={{ font: "700 12px Arial", letterSpacing: 1, color: CLAY }}>COMMUNICATION BOARD</div>
          </div>
          <div style={{ font: "600 15px Arial", color: "#666" }}>English + {otherInfo.name}</div>
        </div>
        <div style={{ border: `3px solid ${SAGED}`, borderLeft: `12px solid ${SAGED}`, borderRadius: 22, padding: "5mm 7mm", marginBottom: "5mm", background: "#F7F4EA" }}>
          <div style={{ font: "700 38px Georgia,serif", lineHeight: 1.1 }}>{board.question.en}</div>
          <div style={{ font: "600 24px Georgia,serif", color: "#555", marginTop: 6 }}>{secondary(board.question)}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4mm", marginBottom: "5mm" }}>
          {board.answers.map((a, i) => {
            const col = LEAF[i % LEAF.length];
            return (
              <div key={a.id} style={{ border: `3px solid ${col}`, borderRadius: 22, padding: "0 6px 9px", textAlign: "center", background: "#fff", overflow: "hidden", breakInside: "avoid" }}>
                <div style={{ height: 9, background: col, margin: "0 -6px 8px" }} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/boards/icons/${a.id}.svg`} alt="" width={100} height={100} style={{ display: "block", margin: "0 auto 2px" }} />
                <div style={{ font: "700 24px Georgia,serif" }}>{a.label.en}</div>
                <div style={{ font: "600 17px Arial", color: "#444", marginTop: 1 }}>{secondary(a.label)}</div>
              </div>
            );
          })}
        </div>
        <div style={{ font: "700 13px Arial", letterSpacing: 0.8, color: "#777", margin: "0 0 6px" }}>YOU CAN ALWAYS POINT TO</div>
        <div style={{ display: "flex", gap: 8 }}>
          {ALWAYS.map((a) => (
            <div key={a.id} style={{ flex: 1, border: `3px solid ${a.colour}`, color: a.colour, borderRadius: 14, padding: "9px 4px", textAlign: "center" }}>
              <div style={{ font: "700 21px Georgia,serif" }}>{a.label.en}</div>
              <div style={{ font: "600 15px Arial" }}>{secondary(a.label)}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "4mm" }}>
          <div ref={qrRef} style={{ width: 62, height: 62, flex: "none" }} />
          <div style={{ font: "600 15px Arial", color: "#333", lineHeight: 1.3 }}>Scan with your phone to hear this board read aloud. Choose English, {otherInfo.name} or both, and a male or female voice.</div>
        </div>
        <div style={{ marginTop: "5mm", display: "flex", justifyContent: "space-between", font: "12px Arial", color: "#777" }}>
          <span>Activity Central · activitycentral.co.uk · Draft translation: check with a fluent speaker before use.</span>
          <span>{board.code} · {printSize.toUpperCase()}</span>
        </div>
      </div>
    </main>
  );
}
