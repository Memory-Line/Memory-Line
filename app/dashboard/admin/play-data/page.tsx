"use client";

import { useRef, useState } from "react";

// Loads the puzzle data for the calendar activities so they can be played online.
// Pick the .json files made by scripts/calendarpack/extract_pack.py (one per
// calendar date, in the "Calander-playdata" folder). Do this after the PDFs have
// been uploaded: each puzzle is attached to its uploaded activity by number.
// Safe to repeat; the same data just replaces what's there.

type Result = { prefix: string; category: string; attached: number; missing: number[] };

const CATEGORY_KEYS: [string, string][] = [
  ["word-searches", "Word Searches"],
  ["guess-the-word", "Guess the Word"],
  ["crosswords", "Crosswords"],
  ["trivia", "Trivia"],
  ["bingo", "Bingo"],
];

export default function PlayDataPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<Result[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState({ batches: 0, total: 0 });
  const stopRef = useRef(false);

  async function start() {
    stopRef.current = false;
    setRunning(true);
    setDone(false);
    setLog([]);
    setErrors([]);

    // Read every file first, so the progress bar knows how much there is.
    type Batch = { prefix: string; category: string; entries: { n: number; data: Record<string, unknown> }[] };
    const batches: Batch[] = [];
    for (const file of files) {
      let data: any;
      try {
        data = JSON.parse(await file.text());
      } catch {
        setErrors((e) => [...e, `${file.name}: not a valid data file`]);
        continue;
      }
      for (const [key, category] of CATEGORY_KEYS) {
        const list: any[] | undefined = key === "bingo" ? data.bingo?.cards : data[key];
        if (!list?.length) continue;
        const entries = list.map((item) => {
          const { n, ...rest } = item;
          // Every bingo card carries the caller's words so a card can be played on its own.
          return { n: n as number, data: key === "bingo" ? { ...rest, caller: data.bingo.caller ?? [] } : rest };
        });
        for (let i = 0; i < entries.length; i += 50) batches.push({ prefix: data.prefix, category, entries: entries.slice(i, i + 50) });
      }
    }
    setProgress({ batches: 0, total: batches.length });

    for (let i = 0; i < batches.length && !stopRef.current; i++) {
      const b = batches[i];
      try {
        const res = await fetch("/api/admin/play-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(b),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error ?? `Failed (${res.status})`);
        setLog((l) => [...l, { prefix: b.prefix, category: b.category, attached: data.attached, missing: data.missing }]);
      } catch (err: any) {
        setErrors((e) => (e.length < 100 ? [...e, `${b.prefix} ${b.category}: ${err.message}`] : e));
      }
      setProgress({ batches: i + 1, total: batches.length });
    }
    setRunning(false);
    setDone(true);
  }

  const attached = log.reduce((n, r) => n + r.attached, 0);
  const missing = log.filter((r) => r.missing.length > 0);
  const pct = progress.total ? Math.round((progress.batches / progress.total) * 100) : 0;

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl mb-1">Load the puzzles for playing online</h1>
      <p className="text-sm text-inkSoft mb-5">
        Pick all the .json files from the Calander-playdata folder. Each puzzle is attached to the activity with the same number, so what
        people play matches the printed sheet. Do this once the PDFs have finished uploading. It's safe to run again.
      </p>

      <label className="block text-xs font-semibold text-inkSoft mb-1">The data files</label>
      <input
        type="file"
        accept=".json"
        multiple
        disabled={running}
        onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        className="w-full text-sm mb-3"
      />
      {files.length > 0 && <p className="text-xs text-inkSoft mb-3">{files.length} files chosen.</p>}

      <div className="flex gap-2 mb-4">
        <button
          onClick={start}
          disabled={running || files.length === 0}
          className="rounded-lg bg-sage text-white px-4 py-2 font-semibold text-sm hover:bg-sageDeep transition-colors disabled:opacity-50"
        >
          {running ? "Loading..." : "Load the puzzles"}
        </button>
        {running && (
          <button onClick={() => (stopRef.current = true)} className="rounded-lg border border-line px-4 py-2 font-semibold text-sm">
            Stop
          </button>
        )}
      </div>

      {progress.total > 0 && (
        <div className="rounded-xl p-4 bg-card border border-line mb-4">
          <div className="h-2 rounded bg-cardTint overflow-hidden mb-2">
            <div className="h-2 bg-sage" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-sm">
            {pct}% · {attached.toLocaleString("en-GB")} puzzles attached · {errors.length} problems
          </p>
          {done && <p className="text-sm font-semibold text-sageDeep mt-1">{stopRef.current ? "Stopped." : "Finished."}</p>}
        </div>
      )}

      {missing.length > 0 && (
        <div className="rounded-xl p-4 border border-line mb-4 text-xs" style={{ background: "#FCEFE7" }}>
          <p className="font-semibold mb-1">Puzzles with no uploaded activity yet (upload the PDFs, then load again)</p>
          <ul className="max-h-48 overflow-y-auto space-y-0.5">
            {missing.map((r, i) => (
              <li key={i}>
                Date {r.prefix}, {r.category}: numbers {r.missing.slice(0, 12).join(", ")}
                {r.missing.length > 12 ? ` and ${r.missing.length - 12} more` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {errors.length > 0 && (
        <div className="rounded-xl p-4 border border-line text-xs">
          <p className="font-semibold mb-1">Problems</p>
          <ul className="space-y-0.5 max-h-48 overflow-y-auto">
            {errors.map((e, i) => (
              <li key={i} className="text-red-600">{e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
