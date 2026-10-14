"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ALWAYS, AUDIO, OTHER_LANGS, UI, type Board, type BoardAnswer, type LangCode, type Text3 } from "@/lib/boards";
import BoardIcon from "@/components/BoardIcon";

const LEAF = ["#3E6E96", "#6B4A9B", "#A6822C", "#A05A6A", "#2F7A63", "#B5714A", "#5B8A9E", "#8A6E52"];
const CREAM = "#F5F0E4", LINE = "#E6DDC8", INK = "#2E2B24", SAGE = "#8BA888", SAGED = "#4C6B4A", CLAY = "#B08968";
const QR_URL = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm";
const importFromCdn = new Function("url", "return import(url)") as (url: string) => Promise<any>;

type Mode = "en" | "other" | "both";
type Voice = "female" | "male";
type Speed = "slow" | "normal";
type Person = "man" | "woman";

// Best device voice for a language and a male or female choice (used only when we have no recording).
const FEMALE_RE = /zira|hazel|susan|sonia|libby|female|woman|samantha|zofia|ewa|agnieszka|paulina|uzma|heera|kalpana|katja|helena|laura|paola/i;
const MALE_RE = /david|mark|george|ryan|(?<!fe)male|(?<![a-z])man\b|daniel|marek|adam|jacek|asad|hemant|pablo|stefan|guy/i;
function pickDeviceVoice(lang: LangCode, voice: "female" | "male") {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const prefix = lang;
  const list = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(prefix));
  if (list.length === 0) return null;
  const want = voice === "female" ? FEMALE_RE : MALE_RE;
  return list.find((v) => want.test(v.name)) ?? list[0];
}

// Keeps long words (e.g. Polish ones) inside their box: wraps anywhere if needed and shrinks the type a little.
const FIT: React.CSSProperties = { overflowWrap: "anywhere", wordBreak: "break-word", hyphens: "auto", minWidth: 0, maxWidth: "100%", lineHeight: 1.15 };
const fs = (text: string, big: number, small: number) => (text.length > 16 ? small : text.length > 11 ? Math.round((big + small) / 2) : big);

// Words that change for a man or a woman are written as a pair (for example Pan/Pani or głodny/głodna).
// The board shows the side that matches who it is for.
function forPerson(text: string, lang: LangCode, person: Person | null) {
  if (lang === "en" || !person) return text;
  return text.replace(/([\p{L}\p{M}]+)\/([\p{L}\p{M}]+)/gu, (_m, man: string, woman: string) => (person === "man" ? man : woman));
}

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
  const [mode, setMode] = useState<Mode>("en");
  const [other, setOther] = useState<LangCode>(lang && lang !== "en" ? (lang as LangCode) : "pl");
  const [voice, setVoice] = useState<Voice>("female");
  const [speed, setSpeed] = useState<Speed>("slow");
  const [chosen, setChosen] = useState<BoardAnswer | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [deviceNote, setDeviceNote] = useState<string>("");
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
  function deviceSpeak(lang: LangCode, text: string, resolve: () => void) {
    if (!window.speechSynthesis) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = { en: "en-GB", pl: "pl-PL", ur: "ur-PK", ro: "ro-RO", pt: "pt-PT", es: "es-ES", fr: "fr-FR", hi: "hi-IN", pa: "pa-IN", bn: "bn-IN", gu: "gu-IN", ar: "ar-SA", fa: "fa-IR", tr: "tr-TR", zh: "zh-CN", yue: "zh-HK", tl: "fil-PH", ta: "ta-IN", ml: "ml-IN" }[lang];
    const dv = pickDeviceVoice(lang, voice);
    if (dv) u.voice = dv;
    setDeviceNote(dv ? `The natural voice did not load, so this device's ${dv.name} voice is reading it.` : `The natural voice did not load and this device has no ${{ en: "English", pl: "Polish", ur: "Urdu", ro: "Romanian", pt: "Portuguese", es: "Spanish", fr: "French", hi: "Hindi", pa: "Punjabi", bn: "Bengali", gu: "Gujarati", ar: "Arabic", fa: "Farsi", tr: "Turkish", zh: "Mandarin Chinese", yue: "Cantonese Chinese", tl: "Tagalog", ta: "Tamil", ml: "Malayalam" }[lang]} voice, so it may stay silent.`);
    u.rate = speed === "slow" ? 0.75 : 1;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  }

  // Plays one phrase and resolves when it ends. Pilot phrases have saved recordings; every other phrase
  // is made on first use by the speech service and saved. The device voice is the last resort.
  function playOne(lang: LangCode, text: string, id: number): Promise<void> {
    return new Promise((resolve) => {
      if (id !== runId.current) return resolve();
      const saved = AUDIO[`${lang}|${voice}|${text}`];
      const src = saved ?? `/api/boards/speak?lang=${lang}&voice=${voice}&text=${encodeURIComponent(text)}`;
      const a = audioRef.current ?? (audioRef.current = new Audio());
      const ready = saved ? Promise.resolve(null) : warm.current.get(src) ?? Promise.resolve(null);
      ready.then((made) => {
      if (id !== runId.current) return resolve();
      a.src = made ?? src;
      a.playbackRate = speed === "slow" ? 0.8 : 1;
      a.onended = () => resolve();
      let failed = false;
      const fallback = () => {
        if (failed) return;
        failed = true;
        if (saved) resolve();
        else deviceSpeak(lang, text, resolve);
      };
      a.onerror = fallback;
      setDeviceNote("");
      a.play().catch(fallback);
      });
    });
  }

  async function speak(items: Text3[]) {
    stop();
    const id = runId.current;
    for (const item of items) {
      for (const lang of langs()) {
        if (id !== runId.current) return;
        const text = item[lang];
        if (!text) continue;
        await playOne(lang, forPerson(text, lang, person), id);
        await new Promise((r) => setTimeout(r, 250));
      }
    }
  }

  const choose = (a: BoardAnswer) => {
    setChosen(a);
    speak([a.say]);
  };
  const readQuestion = () => speak([board.question]);
  const readChoices = () => speak([board.question, ...board.answers.map((a) => a.label)]);

  useEffect(() => () => stop(), []);

  // Gets the voice recordings for this board ready in the background (a few at a time). A press waits for
  // the same recording if it is already being made, instead of asking for it twice.
  const warm = useRef(new Map<string, Promise<string | null>>());
  const start = (u: string) => {
    let p = warm.current.get(u);
    if (!p) {
      p = fetch(u)
        .then((r) => (r.ok ? r.blob() : null))
        .then((blob) => (blob ? URL.createObjectURL(blob) : null))
        .catch(() => null);
      warm.current.set(u, p);
    }
    return p;
  };
  useEffect(() => {
    if (lang !== "en" && !person) return;
    let cancelled = false;
    const urls: string[] = [];
    const items = [board.question, ...board.answers.flatMap((a) => [a.label, a.say]), ...ALWAYS.map((a) => a.say as Text3)];
    for (const l of langs()) {
      for (const item of items) {
        const text = item[l];
        if (!text) continue;
        const spoken = forPerson(text, l, person);
        if (AUDIO[`${l}|${voice}|${spoken}`]) continue;
        urls.push(`/api/boards/speak?lang=${l}&voice=${voice}&text=${encodeURIComponent(spoken)}`);
      }
    }
    let next = 0;
    const worker = async () => {
      while (next < urls.length && !cancelled) await start(urls[next++]);
    };
    for (let i = 0; i < 3; i++) worker();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.id, voice, mode, other, person]);
  useEffect(() => {
    try {
      const p = localStorage.getItem("board-person");
      if (p === "man" || p === "woman") setPerson(p);
    } catch {}
  }, []);
  const pickPerson = (p: Person) => {
    setPerson(p);
    try { localStorage.setItem("board-person", p); } catch {}
  };

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

  const showEn = true;
  const showOther = lang !== "en";
  const rtl = otherInfo.rtl;
  const secondary = (t: Text3) => (
    <span dir={rtl ? "rtl" : "ltr"}>{forPerson(t[other] ?? "", other, person)}</span>
  );
  const needPerson = showOther && !person;

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
          {lang !== "en" && <Seg<Mode> label="Read aloud in" value={mode} onChange={setMode} options={[["en", "English"], ["other", otherInfo.name], ["both", "Both"]]} />}
          {!lang && <Seg<LangCode> label="Other language" value={other} onChange={setOther} options={OTHER_LANGS.map((l) => [l.code, l.name] as [LangCode, string])} />}
          {showOther && (
            <Seg<Person> label="Who is it for?" value={(person ?? "") as Person} onChange={pickPerson} options={[["man", "A man"], ["woman", "A woman"]]} />
          )}
          <Seg<Voice> label="Voice" value={voice} onChange={setVoice} options={[["female", "Female"], ["male", "Male"]]} />
          <Seg<Speed> label="Speed" value={speed} onChange={setSpeed} options={[["slow", "Slow"], ["normal", "Normal"]]} />
          <button type="button" onClick={readChoices} style={{ marginLeft: "auto", background: CLAY, color: "#fff", border: 0, borderRadius: 12, padding: "13px 18px", font: "700 15px Arial", cursor: "pointer" }}>
            🔊 {UI.readChoices.en}{showOther && showEn ? "" : ""}
          </button>
        </div>

        {deviceNote && <div style={{ background: "#FFF8E1", border: `2px solid ${LINE}`, borderRadius: 12, padding: "10px 14px", marginBottom: 14, font: "14px Arial", color: "#6B5A2A" }}>{deviceNote}</div>}

        {needPerson && (
          <div style={{ background: "#fff", border: `2px solid ${LINE}`, borderRadius: 22, padding: "22px 24px", marginBottom: 14, textAlign: "center" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 26, marginBottom: 4 }}>Who is this board for?</div>
            <div style={{ fontSize: 14, color: "#6B6252", marginBottom: 14 }}>Polish wording is different for a man and a woman. Choose first.</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button type="button" onClick={() => pickPerson("man")} style={{ background: SAGED, color: "#fff", border: 0, borderRadius: 14, padding: "16px 34px", font: "700 20px Georgia,serif", cursor: "pointer" }}>A man</button>
              <button type="button" onClick={() => pickPerson("woman")} style={{ background: SAGED, color: "#fff", border: 0, borderRadius: 14, padding: "16px 34px", font: "700 20px Georgia,serif", cursor: "pointer" }}>A woman</button>
            </div>
          </div>
        )}

        <div style={{ background: "#fff", border: `2px solid ${LINE}`, borderLeft: `10px solid ${SAGE}`, borderRadius: 22, padding: "20px 24px", marginBottom: 14, display: needPerson ? "none" : "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <button type="button" onClick={readQuestion} aria-label="Read the question aloud" style={{ flex: "none", width: 58, height: 58, borderRadius: "50%", background: SAGED, color: "#fff", border: 0, fontSize: 26, cursor: "pointer" }}>🔊</button>
          <div style={{ flex: 1, minWidth: 200 }}>
          {showEn && <div style={{ ...FIT, fontFamily: "Georgia, serif", fontSize: "clamp(24px,5vw,42px)" }}>{board.question.en}</div>}
          {showOther && <div style={{ ...FIT, fontFamily: "Georgia, serif", fontSize: showEn ? "clamp(17px,3vw,25px)" : "clamp(24px,5vw,42px)", color: showEn ? "#6B6252" : INK, marginTop: showEn ? 6 : 0 }}>{secondary(board.question)}</div>}
          </div>
        </div>

        {chosen && (
          <div style={{ background: SAGED, color: "#fff", borderRadius: 18, padding: "16px 20px", marginBottom: 14, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }} aria-live="polite">
            <div style={{ flex: 1, minWidth: 170 }}>
              {showEn && <div style={{ ...FIT, fontFamily: "Georgia, serif", fontSize: "clamp(20px,3.5vw,28px)", fontWeight: 700 }}>{chosen.say.en}</div>}
              {showOther && <div style={{ ...FIT, fontFamily: "Georgia, serif", fontSize: showEn ? "clamp(15px,2.5vw,19px)" : "clamp(20px,3.5vw,28px)", fontWeight: showEn ? 600 : 700, opacity: showEn ? 0.92 : 1, marginTop: 2 }}>{secondary(chosen.say)}</div>}
            </div>
            <button type="button" onClick={() => speak([chosen.say])} style={{ background: "#fff", color: SAGED, border: 0, borderRadius: 12, padding: "12px 18px", font: "700 16px Arial", cursor: "pointer" }}>▶ {UI.playAgain.en}</button>
            <button type="button" onClick={() => { stop(); setChosen(null); }} style={{ background: "transparent", color: "#fff", border: "2px solid #fff", borderRadius: 12, padding: "10px 16px", font: "700 15px Arial", cursor: "pointer" }}>Clear</button>
          </div>
        )}

        <div style={{ display: needPerson ? "none" : "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 14, marginBottom: 18 }}>
          {board.answers.map((a, i) => {
            // Only a card on this board is marked: the always-available buttons below share names (Yes, No...) but are separate.
            const sel = chosen && board.answers.some((x) => x.id === chosen.id) ? chosen.id === a.id : null;
            const col = LEAF[i % LEAF.length];
            return (
              <button key={a.id} type="button" onClick={() => choose(a)} aria-pressed={sel === true}
                style={{ position: "relative", minWidth: 0, background: sel ? "#EEF3EC" : "#fff", border: sel ? `4px solid ${SAGED}` : `2px solid ${LINE}`, borderRadius: 20, padding: "0 10px 12px", textAlign: "center", overflow: "hidden", cursor: "pointer", opacity: sel === false ? 0.45 : 1, color: INK }}>
                <div style={{ height: 8, background: col, margin: "0 -10px 10px" }} />
                {sel && <div style={{ position: "absolute", right: 10, top: 14, width: 30, height: 30, borderRadius: "50%", background: SAGED, color: "#fff", font: "700 19px Arial", display: "flex", alignItems: "center", justifyContent: "center" }}>✓</div>}
                <div style={{ marginBottom: 4 }}><BoardIcon icon={a.icon} colour={col} size={104} /></div>
                {showEn && <div style={{ ...FIT, font: `700 ${fs(a.label.en, 24, 18)}px Georgia,serif` }}>{a.label.en}</div>}
                {showOther && <div style={{ ...FIT, font: showEn ? `600 ${fs(a.label[other] ?? "", 17, 14)}px Arial` : `700 ${fs(a.label[other] ?? "", 24, 18)}px Georgia,serif`, color: showEn ? "#6B6252" : INK, marginTop: 2 }}>{secondary(a.label)}</div>}
              </button>
            );
          })}
        </div>

        <div style={{ font: "700 13px Arial", letterSpacing: 0.8, color: "#8A7A6B", margin: "0 0 8px" }}>{UI.always.en.toUpperCase()}</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
          {ALWAYS.map((a) => (
            <button key={a.id} type="button" onClick={() => choose({ ...a, id: `always-${a.id}` })} style={{ flex: "1 1 120px", minWidth: 0, background: a.colour, color: "#fff", border: 0, borderRadius: 14, padding: "12px 6px", textAlign: "center", cursor: "pointer" }}>
              {showEn && <div style={{ ...FIT, font: "700 21px Georgia,serif" }}>{a.label.en}</div>}
              {showOther && <div style={{ ...FIT, font: showEn ? `600 ${fs(a.label[other] ?? "", 15, 13)}px Arial` : `700 ${fs(a.label[other] ?? "", 21, 16)}px Georgia,serif`, opacity: 0.92 }}>{secondary(a.label)}</div>}
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
              <div key={a.id} style={{ minWidth: 0, border: `3px solid ${col}`, borderRadius: 22, padding: "0 6px 9px", textAlign: "center", background: "#fff", overflow: "hidden", breakInside: "avoid" }}>
                <div style={{ height: 9, background: col, margin: "0 -6px 8px" }} />
                <div style={{ marginBottom: 2 }}><BoardIcon icon={a.icon} colour={col} size={92} /></div>
                <div style={{ ...FIT, font: `700 ${fs(a.label.en, 24, 18)}px Georgia,serif` }}>{a.label.en}</div>
                <div style={{ ...FIT, font: `600 ${fs(a.label[other] ?? "", 17, 14)}px Arial`, color: "#444", marginTop: 1 }}>{secondary(a.label)}</div>
              </div>
            );
          })}
        </div>
        <div style={{ font: "700 13px Arial", letterSpacing: 0.8, color: "#777", margin: "0 0 6px" }}>YOU CAN ALWAYS POINT TO</div>
        <div style={{ display: "flex", gap: 8 }}>
          {ALWAYS.map((a) => (
            <div key={a.id} style={{ flex: 1, minWidth: 0, border: `3px solid ${a.colour}`, color: a.colour, borderRadius: 14, padding: "9px 4px", textAlign: "center" }}>
              <div style={{ ...FIT, font: "700 21px Georgia,serif" }}>{a.label.en}</div>
              <div style={{ ...FIT, font: `600 ${fs(a.label[other] ?? "", 15, 13)}px Arial` }}>{secondary(a.label)}</div>
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
