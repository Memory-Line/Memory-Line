"use client";

import { useRef, useState } from "react";
import { OCCASIONS } from "@/lib/occasions";
import { parsePackPath, type PackFile } from "@/lib/calendarPack";
import { titleFromFilename } from "@/lib/titles";

// Uploads the whole calendar activity pack in one go. Pick the folder that holds
// everything (e.g. "Calander-unzipped"); each file's folder path says which
// calendar date, format and version (worksheet, answers, large print) it is, so
// it lands in the right place on its own. Worksheets go up first so the answer
// and large print files have something to attach to. Safe to stop and carry on:
// files already on the site are skipped.

type Job = { file: File; path: string; info: PackFile };
type Failure = { path: string; message: string };

const occasionLabel = (slug: string) => OCCASIONS.find((o) => o.slug === slug)?.label ?? slug;

export default function UploadCalendarPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [notOnCalendar, setNotOnCalendar] = useState<Record<string, number>>({});
  const [unrecognised, setUnrecognised] = useState(0);
  const [skipExisting, setSkipExisting] = useState(true);
  const [running, setRunning] = useState(false);
  const [checking, setChecking] = useState(false);
  const [progress, setProgress] = useState({ done: 0, skipped: 0, failed: 0, total: 0 });
  const [failures, setFailures] = useState<Failure[]>([]);
  const [finished, setFinished] = useState(false);
  const stopRef = useRef(false);

  function onPick(list: FileList | null) {
    setFinished(false);
    setFailures([]);
    setProgress({ done: 0, skipped: 0, failed: 0, total: 0 });
    if (!list) return;
    const found: Job[] = [];
    const missing: Record<string, number> = {};
    let other = 0;
    for (const file of Array.from(list)) {
      if (!/\.pdf$/i.test(file.name)) continue;
      const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      const info = parsePackPath(path);
      if (!info) {
        other++;
        continue;
      }
      if (!info.occasion) {
        missing[info.prefix] = (missing[info.prefix] ?? 0) + 1;
        continue;
      }
      found.push({ file, path, info });
    }
    // Worksheets first, then answers and large print, each in path order.
    found.sort((a, b) => Number(a.info.kind !== "worksheet") - Number(b.info.kind !== "worksheet") || a.path.localeCompare(b.path));
    setJobs(found);
    setNotOnCalendar(missing);
    setUnrecognised(other);
  }

  // What will be uploaded, by category.
  const summary = new Map<string, number>();
  jobs.forEach((j) => summary.set(j.info.category, (summary.get(j.info.category) ?? 0) + 1));
  const occasionCount = new Set(jobs.map((j) => j.info.occasion)).size;

  async function start() {
    if (jobs.length === 0) return;
    stopRef.current = false;
    setRunning(true);
    setFinished(false);
    setFailures([]);

    // Work out what is already on the site, so a stopped upload can carry on.
    const skip = new Set<number>();
    if (skipExisting) {
      setChecking(true);
      try {
        for (const category of Array.from(summary.keys())) {
          const res = await fetch(`/api/admin/upload-template?category=${encodeURIComponent(category)}`);
          const data = await res.json();
          if (!res.ok || !data?.ok) continue;
          const worksheets = new Set<string>();
          const variants = new Map<string, { largePrint: boolean; answers: boolean }>();
          for (const e of data.existing as { fileName: string; number: string | null; scope: string; largePrint: boolean; answers: boolean }[]) {
            worksheets.add(`${e.scope}|${e.fileName}`);
            if (e.number) variants.set(`${e.scope}|${e.number}`, e);
          }
          jobs.forEach((j, i) => {
            if (j.info.category !== category) return;
            const scope = j.info.occasion!;
            const number = j.file.name.match(/^(\d+)/)?.[1];
            const sheet = number ? variants.get(`${scope}|${parseInt(number, 10)}`) : undefined;
            const already =
              j.info.kind === "answers" ? sheet?.answers : j.info.kind === "largePrint" ? sheet?.largePrint : worksheets.has(`${scope}|${j.file.name}`);
            if (already) skip.add(i);
          });
        }
      } catch {
        // couldn't check; upload everything
      }
      setChecking(false);
    }

    const todo = jobs.map((_, i) => i).filter((i) => !skip.has(i));
    setProgress({ done: 0, skipped: skip.size, failed: 0, total: jobs.length });

    const uploadOne = async (i: number) => {
      const { file, path, info } = jobs[i];
      const form = new FormData();
      form.append("file", file);
      form.append("category", info.category);
      form.append("title", titleFromFilename(file.name));
      form.append("isAnswer", String(info.kind === "answers"));
      form.append("isLargePrint", String(info.kind === "largePrint"));
      form.append("occasion", info.occasion!);
      form.append("language", "");
      form.append("subcategory", "");
      try {
        const res = await fetch("/api/admin/upload-template", { method: "POST", body: form });
        if (!res.ok) {
          let message = `Upload failed (${res.status})`;
          try {
            const data = await res.json();
            if (data?.error) message = data.error;
          } catch {
            // keep the status-only message
          }
          throw new Error(message);
        }
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      } catch (err: any) {
        setProgress((p) => ({ ...p, failed: p.failed + 1 }));
        setFailures((f) => (f.length < 200 ? [...f, { path, message: err.message }] : f));
      }
    };

    // Two at a time: quicker than one by one, but gentle on the database.
    const runAll = async (indexes: number[]) => {
      let next = 0;
      const worker = async () => {
        while (next < indexes.length && !stopRef.current) await uploadOne(indexes[next++]);
      };
      await Promise.all(Array.from({ length: Math.min(2, indexes.length) }, worker));
    };
    await runAll(todo.filter((i) => jobs[i].info.kind === "worksheet"));
    await runAll(todo.filter((i) => jobs[i].info.kind !== "worksheet"));

    setRunning(false);
    setFinished(true);
  }

  const handled = progress.done + progress.skipped + progress.failed;
  const pct = progress.total ? Math.round((handled / progress.total) * 100) : 0;
  const missingList = Object.entries(notOnCalendar);

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl mb-1">Upload the calendar activities</h1>
      <p className="text-sm text-inkSoft mb-5">
        Pick the one folder that holds all the unzipped calendar packs. Each file goes to the right calendar date and category by
        its folder names. Keep this page open and the computer awake until it finishes. If it stops, pick the folder again and it
        carries on where it left off.
      </p>

      <label className="block text-xs font-semibold text-inkSoft mb-1">The folder</label>
      <input
        type="file"
        multiple
        // Not in React's typings, but supported by every current browser.
        {...{ webkitdirectory: "" }}
        disabled={running}
        onChange={(e) => onPick(e.target.files)}
        className="w-full text-sm mb-4"
      />

      {jobs.length > 0 && (
        <div className="rounded-xl p-4 bg-card border border-line mb-4">
          <p className="text-sm font-semibold mb-1">
            {jobs.length.toLocaleString("en-GB")} files ready, for {occasionCount} calendar dates
          </p>
          <ul className="text-sm text-inkSoft">
            {Array.from(summary.entries()).map(([category, n]) => (
              <li key={category}>
                {category}: {n.toLocaleString("en-GB")} files
              </li>
            ))}
          </ul>
        </div>
      )}

      {missingList.length > 0 && (
        <div className="rounded-xl p-4 border border-line mb-4" style={{ background: "#FCEFE7" }}>
          <p className="text-sm font-semibold mb-1">Left out: no activities page for these dates</p>
          <ul className="text-sm text-inkSoft">
            {missingList.map(([prefix, n]) => (
              <li key={prefix}>
                Pack date {prefix}: {n.toLocaleString("en-GB")} files
              </li>
            ))}
          </ul>
          <p className="text-xs text-inkSoft mt-1">These dates have no activities page on the site, so their files are not uploaded.</p>
        </div>
      )}

      {unrecognised > 0 && (
        <p className="text-xs text-inkSoft mb-4">{unrecognised} PDF files weren't part of a calendar pack and were ignored.</p>
      )}

      <label className="flex items-center gap-2 text-sm mb-4">
        <input type="checkbox" checked={skipExisting} onChange={(e) => setSkipExisting(e.target.checked)} disabled={running} />
        Skip files that are already on the site
      </label>

      <div className="flex gap-2 mb-4">
        <button
          onClick={start}
          disabled={running || jobs.length === 0}
          className="rounded-lg bg-sage text-white px-4 py-2 font-semibold text-sm hover:bg-sageDeep transition-colors disabled:opacity-50"
        >
          {running ? (checking ? "Checking what's already there..." : "Uploading...") : "Start uploading"}
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
            {pct}% · {progress.done.toLocaleString("en-GB")} uploaded · {progress.skipped.toLocaleString("en-GB")} already there ·{" "}
            <span className={progress.failed ? "text-red-600 font-semibold" : ""}>{progress.failed} failed</span>
          </p>
          {finished && (
            <p className="text-sm font-semibold text-sageDeep mt-1">
              {stopRef.current ? "Stopped." : "Finished."} {progress.failed ? "Pick the folder again to retry the ones that failed." : ""}
            </p>
          )}
        </div>
      )}

      {failures.length > 0 && (
        <div className="rounded-xl p-4 border border-line text-xs">
          <p className="font-semibold mb-1">First problems (up to 200)</p>
          <ul className="space-y-1 max-h-64 overflow-y-auto">
            {failures.map((f, i) => (
              <li key={i}>
                <span className="font-mono">{f.path}</span>
                <br />
                <span className="text-red-600">{f.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {jobs.length > 0 && !running && !finished && (
        <p className="text-xs text-inkSoft mt-4">
          Dates are matched to the calendar by name, e.g. "{occasionLabel(jobs[0].info.occasion!)}". Occasion activities appear on that date's own page, not
          in the regular library.
        </p>
      )}
    </div>
  );
}
