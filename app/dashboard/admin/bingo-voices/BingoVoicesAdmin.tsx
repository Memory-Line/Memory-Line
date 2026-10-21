"use client";

import { useRef, useState } from "react";
import { bingoVoiceJobs } from "@/lib/bingoWords";

type Job = { lang: string; voice: string; text: string };

// Goes through every recording the Bingo caller can ask for and asks the voice route to make it if it is not
// already saved. Safe to run again: recordings that exist are skipped quickly, so it just carries on where it left off.
export default function BingoVoicesAdmin() {
  const jobs = useRef<Job[]>(bingoVoiceJobs());
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [failed, setFailed] = useState<Job[]>([]);
  const [finished, setFinished] = useState(false);
  const stop = useRef(false);

  async function one(job: Job): Promise<boolean> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`/api/boards/speak?prepare=1&use=bingo&lang=${job.lang}&voice=${job.voice}&text=${encodeURIComponent(job.text)}`);
        if (res.ok) return true;
      } catch {
        // try again below
      }
      await new Promise((r) => setTimeout(r, 2500 * (attempt + 1)));
    }
    return false;
  }

  async function start() {
    stop.current = false;
    setRunning(true);
    setFinished(false);
    setDone(0);
    setFailed([]);
    const list = jobs.current;
    let next = 0;
    let count = 0;
    const bad: Job[] = [];
    const worker = async () => {
      while (!stop.current && next < list.length) {
        const job = list[next++];
        if (!(await one(job))) bad.push(job);
        count++;
        if (count % 5 === 0 || count === list.length) {
          setDone(count);
          setFailed([...bad]);
        }
      }
    };
    await Promise.all(Array.from({ length: 3 }, worker));
    setDone(count);
    setFailed([...bad]);
    setRunning(false);
    setFinished(!stop.current);
  }

  const total = jobs.current.length;
  return (
    <div className="mt-6 rounded-xl border border-line bg-card p-5">
      <p className="text-sm text-inkSoft mb-4">
        {total.toLocaleString()} recordings in all. The first run can take a long time (it makes about three at a time); you can leave this page open and
        come back. Running it again only makes what is missing.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={start} disabled={running} className="rounded-lg bg-sage text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
          {running ? "Preparing…" : finished || done > 0 ? "Run it again" : "Prepare all Bingo voices"}
        </button>
        {running && (
          <button type="button" onClick={() => { stop.current = true; }} className="rounded-lg bg-cardTint px-4 py-2.5 text-sm font-semibold">
            Stop
          </button>
        )}
        <span className="text-sm font-semibold">{done.toLocaleString()} of {total.toLocaleString()} checked</span>
      </div>
      <div className="mt-4 h-3 w-full rounded-full bg-cardTint overflow-hidden" aria-hidden="true">
        <div className="h-full bg-sage" style={{ width: `${Math.round((done / total) * 100)}%` }} />
      </div>
      {finished && failed.length === 0 && <p className="mt-4 text-sm font-semibold" style={{ color: "#2f7a63" }}>All done. Every number is ready in every language and both voices.</p>}
      {failed.length > 0 && (
        <div className="mt-4 text-sm">
          <p className="font-semibold" style={{ color: "#b5453d" }}>
            {failed.length} could not be made{running ? " so far" : ""}. {running ? "" : "Run it again to retry them."}
          </p>
          <ul className="mt-2 max-h-48 overflow-auto text-xs text-inkSoft">
            {failed.slice(0, 60).map((j, i) => (
              <li key={i}>{j.lang} / {j.voice}: {j.text}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
