"use client";

import { useRef, useState } from "react";

type V = { id: string; label: string; note: string; style?: string };

const GROUPS: { title: string; voices: V[] }[] = [
  {
    title: "British women",
    voices: [
      { id: "en-GB-SoniaNeural", label: "Sonia", note: "The one used now" },
      { id: "en-GB-SoniaNeural", label: "Sonia, cheerful", note: "Same voice, friendlier", style: "cheerful" },
      { id: "en-GB-LibbyNeural", label: "Libby", note: "Warm and clear" },
      { id: "en-GB-AbbiNeural", label: "Abbi", note: "Young and bright" },
      { id: "en-GB-HollieNeural", label: "Hollie", note: "Gentle" },
      { id: "en-GB-BellaNeural", label: "Bella", note: "Soft" },
      { id: "en-GB-OliviaNeural", label: "Olivia", note: "Calm" },
      { id: "en-GB-AdaMultilingualNeural", label: "Ada", note: "Newer, more natural style" },
    ],
  },
  {
    title: "British men",
    voices: [
      { id: "en-GB-RyanNeural", label: "Ryan", note: "The male voice used now" },
      { id: "en-GB-ThomasNeural", label: "Thomas", note: "Friendly" },
      { id: "en-GB-ElliotNeural", label: "Elliot", note: "Relaxed" },
      { id: "en-GB-OllieMultilingualNeural", label: "Ollie", note: "Newer, more natural style" },
    ],
  },
  {
    title: "Newer 'HD' voices (American accent)",
    voices: [
      { id: "en-US-Ava:DragonHDLatestNeural", label: "Ava HD", note: "Very natural, if available" },
      { id: "en-US-AvaMultilingualNeural", label: "Ava", note: "Natural" },
      { id: "en-US-EmmaMultilingualNeural", label: "Emma", note: "Natural" },
    ],
  },
];

// Plays the sample script in each voice, so the admin can choose.
export default function VoiceSamples() {
  const [state, setState] = useState<Record<string, "loading" | "playing" | "error" | undefined>>({});
  const [msg, setMsg] = useState<Record<string, string>>({});
  const audio = useRef<HTMLAudioElement | null>(null);

  async function play(v: V) {
    const key = v.id + (v.style ?? "");
    if (audio.current) audio.current.pause();
    setState({ [key]: "loading" });
    setMsg({});
    const url = `/api/admin/voice-sample?voice=${encodeURIComponent(v.id)}${v.style ? `&style=${v.style}` : ""}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setState({ [key]: "error" });
        setMsg({ [key]: data?.error ?? "Could not play this voice" });
        return;
      }
      const blob = await res.blob();
      const a = new Audio(URL.createObjectURL(blob));
      audio.current = a;
      a.onended = () => setState({});
      setState({ [key]: "playing" });
      await a.play();
    } catch {
      setState({ [key]: "error" });
      setMsg({ [key]: "Could not play this voice" });
    }
  }

  return (
    <div className="mt-6 space-y-6">
      {GROUPS.map((g) => (
        <div key={g.title}>
          <h2 className="font-serif text-lg mb-2">{g.title}</h2>
          <div className="space-y-2">
            {g.voices.map((v) => {
              const key = v.id + (v.style ?? "");
              const s = state[key];
              return (
                <div key={key} className="rounded-xl p-3 bg-card border border-line flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{v.label}</p>
                    <p className="text-xs text-inkSoft">{v.note}</p>
                    {s === "error" && <p className="text-xs font-semibold text-red-600 mt-1">{msg[key]}</p>}
                  </div>
                  <button
                    onClick={() => play(v)}
                    className="rounded-lg bg-sage text-white px-4 py-2 text-sm font-semibold hover:bg-sageDeep"
                  >
                    {s === "loading" ? "Preparing…" : s === "playing" ? "Playing…" : "Play"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
