"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Eye, Lightbulb, Printer, RotateCcw } from "lucide-react";
import type { DifferenceRegion, PictureRect } from "@/lib/spotDifference";

const PDFJS_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs";
const PDFJS_WORKER_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs";
const RENDER_SCALE = 2.2; // page render resolution — plenty sharp for a cropped picture

const FOUND = "#2f7a63";
const HINT = "#b5714a";

// One picture: a cropped canvas with an invisible, big-target button over
// each difference (defined outside the player so it keeps its identity
// across renders — otherwise the canvas would remount and lose its image
// every time progress changes).
function Picture({
  canvasRef,
  aspect,
  label,
  regions,
  found,
  revealed,
  hint,
  loading,
  onTap,
}: {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  aspect: number;
  label: string;
  regions: DifferenceRegion[];
  found: boolean[];
  revealed: boolean;
  hint: number | null;
  loading: boolean;
  onTap: (i: number) => void;
}) {
  return (
    <div
      className="relative rounded-xl bg-white border border-line overflow-hidden"
      style={{ width: "100%", aspectRatio: `${aspect}` }}
      aria-label={label}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-inkSoft">Loading picture…</div>
      )}
      {regions.map((r, i) => {
        const show = found[i] || revealed || hint === i;
        return (
          <button
            key={i}
            onClick={() => onTap(i)}
            aria-label={found[i] ? `Difference ${i + 1}, found` : `Look for difference ${i + 1} here`}
            className="absolute"
            style={{
              left: `${r.x * 100}%`,
              top: `${r.y * 100}%`,
              width: `${r.w * 100}%`,
              height: `${r.h * 100}%`,
            }}
          >
            {show && (
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  border: `4px solid ${found[i] ? FOUND : HINT}`,
                  boxShadow: found[i] ? "0 0 0 2px rgba(47,122,99,0.25)" : "0 0 0 2px rgba(181,113,74,0.25)",
                  animation: hint === i && !found[i] ? "spotdiff-pulse 0.9s ease-in-out infinite" : undefined,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// Spot the Difference on screen: the sheet's own Standard PDF is loaded in
// the browser (pdf.js) and Picture A / Picture B are cropped out of it into
// two canvases, side by side. Tapping inside a difference circles it on both
// pictures at once. Progress is kept on this device.
export default function SpotDifferencePlayer({
  templateId,
  pictureA,
  pictureB,
  regions,
  tracking,
  initiallyCompleted,
  hasLargePrint,
}: {
  templateId: string;
  pictureA: PictureRect;
  pictureB: PictureRect;
  regions: DifferenceRegion[];
  tracking: boolean;
  initiallyCompleted: boolean;
  hasLargePrint: boolean;
}) {
  const storageKey = `spotdifference:${templateId}`;
  const [found, setFound] = useState<boolean[]>(() => regions.map(() => false));
  const [message, setMessage] = useState("");
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [revealed, setRevealed] = useState(false);
  const [hint, setHint] = useState<number | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const canvasARef = useRef<HTMLCanvasElement | null>(null);
  const canvasBRef = useRef<HTMLCanvasElement | null>(null);
  const [aspectA, setAspectA] = useState(1.4);
  const [aspectB, setAspectB] = useState(1.4);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
      if (saved && Array.isArray(saved.found) && saved.found.length === regions.length) {
        setFound(saved.found);
      }
    } catch {
      // nothing saved, or storage unavailable
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function save(next: boolean[]) {
    setFound(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ found: next }));
    } catch {
      // storage unavailable: progress just isn't kept
    }
  }

  async function markCompleted() {
    if (!tracking || completed) return;
    try {
      const res = await fetch("/api/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, completed: true }),
      });
      if (res.ok) setCompleted(true);
    } catch {
      // not marked; they can still use the Completed button on the list
    }
  }

  // Load the sheet's own PDF and crop out Picture A / Picture B.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const pdfjsLib: any = await import(/* webpackIgnore: true */ PDFJS_URL);
        pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
        const doc = await pdfjsLib.getDocument(`/api/download/${templateId}?file=standard`).promise;
        const page = await doc.getPage(1);
        const viewport = page.getViewport({ scale: RENDER_SCALE });
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = Math.ceil(viewport.width);
        pageCanvas.height = Math.ceil(viewport.height);
        const ctx = pageCanvas.getContext("2d");
        if (!ctx) throw new Error("no canvas context");
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (cancelled) return;

        const cropInto = (target: HTMLCanvasElement | null, rect: PictureRect) => {
          if (!target) return null;
          const sx = rect.x * pageCanvas.width;
          const sy = rect.y * pageCanvas.height;
          const sw = rect.w * pageCanvas.width;
          const sh = rect.h * pageCanvas.height;
          target.width = Math.ceil(sw);
          target.height = Math.ceil(sh);
          const tctx = target.getContext("2d");
          if (!tctx) return null;
          tctx.drawImage(pageCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
          return { width: sw, height: sh };
        };

        const a = cropInto(canvasARef.current, pictureA);
        const b = cropInto(canvasBRef.current, pictureB);
        if (a) setAspectA(a.width / a.height);
        if (b) setAspectB(b.width / b.height);
        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  useEffect(() => () => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
  }, []);

  function tap(i: number) {
    if (found[i]) return;
    const next = [...found];
    next[i] = true;
    save(next);
    setHint(null);
    const count = next.filter(Boolean).length;
    if (count === regions.length) {
      setMessage("Well done — you found every difference!");
      markCompleted();
    } else {
      setMessage(`Found ${count} of ${regions.length}.`);
    }
  }

  function showHint() {
    const i = found.findIndex((f) => !f);
    if (i === -1) return;
    setHint(i);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(null), 2500);
  }

  function startAgain() {
    save(regions.map(() => false));
    setMessage("");
    setRevealed(false);
    setHint(null);
  }

  const foundCount = found.filter(Boolean).length;

  return (
    <div className="max-w-[900px]">
      <style>{`@keyframes spotdiff-pulse { 0%,100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }`}</style>

      <p className="text-sm text-inkSoft mb-3">
        Tap a difference on either picture — it circles on both. There are {regions.length} to find.
      </p>

      {status === "error" ? (
        <p className="text-sm text-inkSoft rounded-xl p-4 bg-card border border-line mb-4">
          The pictures couldn't be loaded for playing on screen right now, but you can still print the sheet below.
        </p>
      ) : (
        <div className="flex flex-wrap gap-4 mb-4">
          <div style={{ flex: "1 1 320px", minWidth: 220 }}>
            <Picture
              canvasRef={canvasARef}
              aspect={aspectA}
              label="Picture A"
              regions={regions}
              found={found}
              revealed={revealed}
              hint={hint}
              loading={status === "loading"}
              onTap={tap}
            />
          </div>
          <div style={{ flex: "1 1 320px", minWidth: 220 }}>
            <Picture
              canvasRef={canvasBRef}
              aspect={aspectB}
              label="Picture B"
              regions={regions}
              found={found}
              revealed={revealed}
              hint={hint}
              loading={status === "loading"}
              onTap={tap}
            />
          </div>
        </div>
      )}

      <p className="text-sm font-semibold mb-3">
        {foundCount} of {regions.length} found
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={showHint}
          disabled={foundCount === regions.length}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint disabled:opacity-40"
        >
          <Lightbulb size={14} /> Show me one
        </button>
        <button onClick={() => setRevealed((v) => !v)} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint">
          <Eye size={14} /> {revealed ? "Hide all" : "Show all"}
        </button>
        <button onClick={startAgain} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint">
          <RotateCcw size={14} /> Start again
        </button>
      </div>

      {message && (
        <p className="mt-4 rounded-lg px-3 py-2 text-sm font-semibold inline-block" style={{ background: "#e4eee2", color: FOUND }}>
          {message}
        </p>
      )}
      {tracking && completed && (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold" style={{ color: FOUND }}>
          <Check size={14} /> Marked as completed
        </p>
      )}

      <div className="mt-6 pt-4 border-t border-line">
        <p className="text-xs font-semibold text-inkSoft mb-2">Prefer paper?</p>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/download/${templateId}?file=standard`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold"
            style={{ background: "#E4EEE2", color: "#6D8C6A" }}
          >
            <Printer size={14} /> Print
          </a>
          {hasLargePrint && (
            <a
              href={`/api/download/${templateId}?file=large-print`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold"
              style={{ background: "#FCEFE7", color: "#B5714A" }}
            >
              <Printer size={14} /> Print Large (A3)
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
