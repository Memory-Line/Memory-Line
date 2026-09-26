"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Printer, RotateCcw, Undo2 } from "lucide-react";
import type { PictureRect } from "@/lib/spotDifference";

const PDFJS_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs";
const PDFJS_WORKER_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs";
const RENDER_SCALE = 2.2;
const TARGET = 7;
const MARK = "#b5714a";

type Mark = { x: number; y: number };

// One picture: a cropped canvas that the person taps to drop a circle
// wherever they spot a difference. Nothing checks whether the tap is
// "right" — there's no answer key for this pack, so the aim is for people
// to circle what they notice and talk about it, the same spirit as Trivia.
function Picture({
  canvasRef,
  aspect,
  label,
  marks,
  loading,
  onTap,
  onRemove,
}: {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  aspect: number;
  label: string;
  marks: Mark[];
  loading: boolean;
  onTap: (x: number, y: number) => void;
  onRemove: (index: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    onTap(x, y);
  }

  return (
    <div
      ref={wrapRef}
      onClick={handleClick}
      className="relative rounded-xl bg-white border border-line overflow-hidden cursor-crosshair"
      style={{ width: "100%", aspectRatio: `${aspect}` }}
      aria-label={label}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", pointerEvents: "none" }} />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-inkSoft">Loading picture…</div>
      )}
      {marks.map((m, i) => (
        <button
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(i);
          }}
          aria-label="Remove this circle"
          className="absolute rounded-full"
          style={{
            left: `${m.x * 100}%`,
            top: `${m.y * 100}%`,
            width: 56,
            height: 56,
            transform: "translate(-50%, -50%)",
            border: `4px solid ${MARK}`,
            boxShadow: "0 0 0 2px rgba(181,113,74,0.25)",
            background: "rgba(255,255,255,0.05)",
          }}
        />
      ))}
    </div>
  );
}

// Spot the Difference on screen: the sheet's own Standard PDF is loaded in
// the browser (pdf.js) and Picture A / Picture B are cropped out of it into
// two canvases, side by side. Tap anywhere on either picture to circle
// something — tap a circle again to remove it. The sheet's own instructions
// say "find seven", so that's shown as a friendly target, but nothing here
// marks a circle right or wrong.
export default function SpotDifferencePlayer({
  templateId,
  pictureA,
  pictureB,
  tracking,
  initiallyCompleted,
  hasLargePrint,
}: {
  templateId: string;
  pictureA: PictureRect;
  pictureB: PictureRect;
  tracking: boolean;
  initiallyCompleted: boolean;
  hasLargePrint: boolean;
}) {
  const storageKey = `spotdifference:${templateId}`;
  const [marksA, setMarksA] = useState<Mark[]>([]);
  const [marksB, setMarksB] = useState<Mark[]>([]);
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const canvasARef = useRef<HTMLCanvasElement | null>(null);
  const canvasBRef = useRef<HTMLCanvasElement | null>(null);
  const [aspectA, setAspectA] = useState(1.4);
  const [aspectB, setAspectB] = useState(1.4);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
      if (saved && Array.isArray(saved.marksA) && Array.isArray(saved.marksB)) {
        setMarksA(saved.marksA);
        setMarksB(saved.marksB);
      }
    } catch {
      // nothing saved, or storage unavailable
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function save(a: Mark[], b: Mark[]) {
    setMarksA(a);
    setMarksB(b);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ marksA: a, marksB: b }));
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

  const total = marksA.length + marksB.length;

  function tapA(x: number, y: number) {
    const next = [...marksA, { x, y }];
    save(next, marksB);
    if (next.length + marksB.length === TARGET) markCompleted();
  }
  function tapB(x: number, y: number) {
    const next = [...marksB, { x, y }];
    save(marksA, next);
    if (marksA.length + next.length === TARGET) markCompleted();
  }
  function removeA(i: number) {
    save(marksA.filter((_, idx) => idx !== i), marksB);
  }
  function removeB(i: number) {
    save(marksA, marksB.filter((_, idx) => idx !== i));
  }
  function undoLast() {
    if (marksB.length >= marksA.length && marksB.length > 0) save(marksA, marksB.slice(0, -1));
    else if (marksA.length > 0) save(marksA.slice(0, -1), marksB);
  }
  function startAgain() {
    save([], []);
  }

  return (
    <div className="max-w-[900px]">
      <p className="text-sm text-inkSoft mb-3">
        Have a look at the two pictures together and tap to circle anything that's different — on either picture,
        wherever's easiest. The sheet has {TARGET} to find, but there's no wrong answer here; tap a circle again to
        take it away.
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
              marks={marksA}
              loading={status === "loading"}
              onTap={tapA}
              onRemove={removeA}
            />
          </div>
          <div style={{ flex: "1 1 320px", minWidth: 220 }}>
            <Picture
              canvasRef={canvasBRef}
              aspect={aspectB}
              label="Picture B"
              marks={marksB}
              loading={status === "loading"}
              onTap={tapB}
              onRemove={removeB}
            />
          </div>
        </div>
      )}

      <p className="text-sm font-semibold mb-3">
        {total} of {TARGET} circled
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={undoLast}
          disabled={total === 0}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint disabled:opacity-40"
        >
          <Undo2 size={14} /> Undo
        </button>
        <button onClick={startAgain} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint">
          <RotateCcw size={14} /> Start again
        </button>
      </div>

      {total >= TARGET && (
        <p className="mt-4 rounded-lg px-3 py-2 text-sm font-semibold inline-block" style={{ background: "#e4eee2", color: "#2f7a63" }}>
          Well done — {TARGET} circled! Take a moment to look over the two pictures together.
        </p>
      )}
      {tracking && completed && (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#2f7a63" }}>
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
