"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

// A file with its path inside the folder it came from ("Pack/A3/001-name.pdf"), the same shape a picked
// folder gives, so the pages that read the path (topic, A3, answers...) work the same either way.
export type Picked = { file: File; path: string };

// What a person picked with an <input type="file">.
export function fromInput(list: FileList | null): Picked[] {
  return Array.from(list ?? []).map((file) => ({ file, path: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name }));
}

type Entry = {
  isFile: boolean;
  isDirectory: boolean;
  fullPath: string;
  file?: (ok: (f: File) => void, fail: (e: unknown) => void) => void;
  createReader?: () => { readEntries: (ok: (list: Entry[]) => void, fail: (e: unknown) => void) => void };
};

// Every file inside a dropped file or folder, however deep.
async function walk(entry: Entry, out: Picked[]) {
  if (entry.isFile && entry.file) {
    const file = await new Promise<File>((ok, fail) => entry.file!(ok, fail));
    out.push({ file, path: entry.fullPath.replace(/^\//, "") });
  } else if (entry.isDirectory && entry.createReader) {
    const reader = entry.createReader();
    // A folder is read in chunks; keep asking until it says there is nothing left.
    for (;;) {
      const batch = await new Promise<Entry[]>((ok, fail) => reader.readEntries(ok, fail));
      if (batch.length === 0) break;
      for (const child of batch) await walk(child, out);
    }
  }
}

// A box to drop files or whole folders onto (or click to choose them), instead of hunting for them.
export default function DropZone({
  onPick,
  accept,
  disabled = false,
  hint,
}: {
  onPick: (files: Picked[]) => void;
  accept: string; // the file type wanted, e.g. ".pdf" or ".json"
  disabled?: boolean;
  hint?: string;
}) {
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const filesInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const ext = accept.replace(".", "").toLowerCase();

  function finish(all: Picked[]) {
    const wanted = all.filter((p) => p.file.name.toLowerCase().endsWith("." + ext));
    setCount(wanted.length);
    onPick(all);
  }

  async function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setOver(false);
    if (disabled) return;
    setBusy(true);
    try {
      const out: Picked[] = [];
      const items = Array.from(e.dataTransfer.items ?? []);
      const entries = items.map((i) => (i as DataTransferItem & { webkitGetAsEntry?: () => Entry | null }).webkitGetAsEntry?.() ?? null);
      if (entries.length > 0 && entries.every((x) => x)) {
        for (const entry of entries) await walk(entry as Entry, out);
      } else {
        out.push(...fromInput(e.dataTransfer.files));
      }
      finish(out);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={`rounded-xl border-2 border-dashed px-4 py-6 text-center mb-3 transition-colors ${over ? "border-sage bg-cardTint" : "border-line bg-white"} ${disabled ? "opacity-50" : ""}`}
    >
      <UploadCloud size={28} className="mx-auto mb-2 text-sage" />
      <p className="text-sm font-semibold">{busy ? "Reading what you dropped..." : "Drop files or a whole folder here"}</p>
      <p className="text-xs text-inkSoft mt-1">{hint ?? `Only ${accept} files are used; anything else in a folder is ignored.`}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <button type="button" disabled={disabled} onClick={() => filesInput.current?.click()} className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold">
          Choose files
        </button>
        <button type="button" disabled={disabled} onClick={() => folderInput.current?.click()} className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold">
          Choose a folder
        </button>
      </div>
      {count !== null && <p className="text-sm font-semibold mt-3 text-sageDeep">{count} {accept} file{count === 1 ? "" : "s"} ready</p>}
      <input ref={filesInput} type="file" multiple accept={accept} className="hidden" onChange={(e) => finish(fromInput(e.target.files))} />
      <input
        ref={folderInput}
        type="file"
        multiple
        className="hidden"
        // Not in React's typings, but supported by every current browser.
        {...{ webkitdirectory: "" }}
        onChange={(e) => finish(fromInput(e.target.files))}
      />
    </div>
  );
}
