"use client";

import { useState } from "react";
import { NARRATION_VOICES } from "@/lib/narrationScripts";

type Item = { title: string; text: string };
type Made = { url: string; blob: Blob; seconds: number };

// Makes the Bella audio for each slide, lets the admin listen and edit, and downloads everything as one zip.
function Studio({ scripts, zipName, voice }: { scripts: Item[]; zipName: string; voice: string }) {
  const [texts, setTexts] = useState(scripts.map((s) => s.text));
  const [made, setMade] = useState<(Made | null)[]>(scripts.map(() => null));
  const [busy, setBusy] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [all, setAll] = useState(false);

  async function make(i: number) {
    setBusy(i);
    setErrors((e) => ({ ...e, [i]: "" }));
    try {
      const res = await fetch("/api/admin/narration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: texts[i], voice }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErrors((e) => ({ ...e, [i]: d?.error ?? "Could not make this audio" }));
        return false;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const seconds = await new Promise<number>((resolve) => {
        const a = new Audio(url);
        a.onloadedmetadata = () => resolve(a.duration);
        a.onerror = () => resolve(0);
      });
      setMade((m) => m.map((x, k) => (k === i ? { url, blob, seconds } : x)));
      return true;
    } catch {
      setErrors((e) => ({ ...e, [i]: "Could not make this audio" }));
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function makeAll() {
    setAll(true);
    for (let i = 0; i < scripts.length; i++) {
      if (!made[i]) await make(i);
    }
    setAll(false);
  }

  // A simple zip file (no compression), built in the browser.
  async function downloadAll() {
    const enc = new TextEncoder();
    const crcTable = new Uint32Array(256).map((_, n) => {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      return c >>> 0;
    });
    const crc = (d: Uint8Array) => {
      let c = 0xffffffff;
      for (let i = 0; i < d.length; i++) c = crcTable[(c ^ d[i]) & 255] ^ (c >>> 8);
      return (c ^ 0xffffffff) >>> 0;
    };
    const parts: Uint8Array[] = [];
    const central: Uint8Array[] = [];
    let offset = 0;
    const u16 = (v: number) => [v & 255, (v >> 8) & 255];
    const u32 = (v: number) => [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255];
    for (let i = 0; i < made.length; i++) {
      const m = made[i];
      if (!m) continue;
      const data = new Uint8Array(await m.blob.arrayBuffer());
      const name = enc.encode(`slide${String(i + 1).padStart(2, "0")}.mp3`);
      const c = crc(data);
      const local = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0x21), ...u32(c), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...name]);
      parts.push(local, data);
      central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0x21), ...u32(c), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...name]));
      offset += local.length + data.length;
    }
    const cdSize = central.reduce((n, p) => n + p.length, 0);
    const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(central.length), ...u16(central.length), ...u32(cdSize), ...u32(offset), ...u16(0)]);
    const blob = new Blob([...parts, ...central, end] as BlobPart[], { type: "application/zip" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = zipName;
    a.click();
  }

  const doneCount = made.filter(Boolean).length;
  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <button onClick={makeAll} disabled={all || busy !== null} className="rounded-lg bg-sage text-white px-5 py-2.5 font-semibold text-sm hover:bg-sageDeep disabled:opacity-60">
          {all ? "Making audio…" : "Make all audio"}
        </button>
        <button onClick={downloadAll} disabled={doneCount === 0} className="rounded-lg border-2 border-ink px-5 py-2.5 font-semibold text-sm disabled:opacity-40">
          Download all audio ({doneCount} of {scripts.length})
        </button>
      </div>
      <div className="space-y-3">
        {scripts.map((s, i) => (
          <div key={i} className="rounded-xl p-3 bg-card border border-line">
            <p className="text-sm font-semibold mb-1">{s.title}</p>
            <textarea
              value={texts[i]}
              onChange={(e) => {
                setTexts((t) => t.map((x, k) => (k === i ? e.target.value : x)));
                setMade((m) => m.map((x, k) => (k === i ? null : x)));
              }}
              rows={4}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <button onClick={() => make(i)} disabled={busy !== null} className="rounded-lg bg-sage text-white px-4 py-1.5 text-sm font-semibold disabled:opacity-60">
                {busy === i ? "Making…" : made[i] ? "Make again" : "Make audio"}
              </button>
              {made[i] && (
                <>
                  <audio controls src={made[i]!.url} className="h-9" />
                  <span className="text-xs text-inkSoft">{Math.round(made[i]!.seconds)} seconds</span>
                </>
              )}
              {errors[i] && <span className="text-xs font-semibold text-red-600">{errors[i]}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type VideoSet = { key: string; label: string; slides: Item[] };

// Pick which video to make the audio for. Each video has its own zip of slide audio.
export default function NarrationStudio({ sets }: { sets: VideoSet[] }) {
  const [key, setKey] = useState(sets[0].key);
  const [voice, setVoice] = useState(NARRATION_VOICES[0].key);
  const [sample, setSample] = useState<string | null>(null);
  const [sampling, setSampling] = useState(false);

  // Plays a short line in the chosen voice so the voices can be compared.
  async function hear() {
    setSampling(true);
    try {
      const res = await fetch("/api/admin/narration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Welcome to Activity Central. Choose an activity, print it, and you're ready to go.", voice }),
      });
      if (res.ok) {
        const url = URL.createObjectURL(await res.blob());
        setSample(url);
        new Audio(url).play().catch(() => {});
      }
    } finally {
      setSampling(false);
    }
  }
  const set = sets.find((s) => s.key === key) ?? sets[0];
  return (
    <div>
      <label className="block mt-6 text-sm font-semibold">
        Video
        <select value={key} onChange={(e) => setKey(e.target.value)} className="ml-3 rounded-lg border border-line bg-white px-3 py-2 text-sm font-normal">
          {sets.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold">
        <label>
          Voice
          <select value={voice} onChange={(e) => { setVoice(e.target.value); setSample(null); }} className="ml-3 rounded-lg border border-line bg-white px-3 py-2 text-sm font-normal">
            {NARRATION_VOICES.map((v) => (
              <option key={v.key} value={v.key}>{v.label}</option>
            ))}
          </select>
        </label>
        <button onClick={hear} disabled={sampling} className="rounded-lg border-2 border-ink px-4 py-1.5 text-sm font-semibold disabled:opacity-60">
          {sampling ? "Making sample…" : "Hear this voice"}
        </button>
        {sample && <audio controls src={sample} className="h-9" />}
      </div>
      <p className="text-xs text-inkSoft mt-1">Choosing a different voice clears the audio on this page, so press &ldquo;Make all audio&rdquo; again.</p>
      <Studio key={`${set.key}-${voice}`} scripts={set.slides} zipName={`${set.key}-${voice.replace("en-GB-", "").replace("Neural", "").toLowerCase()}-audio.zip`} voice={voice} />
    </div>
  );
}
