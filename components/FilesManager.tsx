"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_SHARED_FILES } from "@/lib/sharedFiles";

type SharedFile = {
  id: string;
  token: string;
  title: string;
  contentType: string;
  sizeBytes: number;
  allowDownload: boolean;
  updatedAt: string;
};

const kindLabel = (t: string) => (t === "application/pdf" ? "PDF" : t === "image/png" ? "PNG" : "JPG");
const sizeLabel = (b: number) => (b >= 1024 * 1024 ? `${(b / (1024 * 1024)).toFixed(1)}MB` : `${Math.max(1, Math.round(b / 1024))}KB`);

export default function FilesManager() {
  const [files, setFiles] = useState<SharedFile[] | null>(null);
  const [title, setTitle] = useState("");
  const [allowDownload, setAllowDownload] = useState(false);
  const [picked, setPicked] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [replacing, setReplacing] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const replaceId = useRef<string | null>(null);

  useEffect(() => {
    fetch("/api/shared-files")
      .then((r) => r.json())
      .then((d) => setFiles(d.files ?? []))
      .catch(() => setFiles([]));
  }, []);

  const urlFor = (token: string) => `${window.location.origin}/f/${token}`;

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!picked) return setError("Choose a file first.");
    if (!title.trim()) return setError("Give the file a title.");
    setBusy(true);
    const form = new FormData();
    form.append("file", picked);
    form.append("title", title);
    form.append("allowDownload", String(allowDownload));
    const res = await fetch("/api/shared-files", { method: "POST", body: form }).catch(() => null);
    setBusy(false);
    const data = await res?.json().catch(() => ({}));
    if (!res || !res.ok) return setError(data?.error ?? "The upload didn't work. Please try again.");
    setFiles((prev) => [data.file, ...(prev ?? [])]);
    setTitle("");
    setPicked(null);
    setAllowDownload(false);
    if (fileInput.current) fileInput.current.value = "";
    copy(data.file.token);
  }

  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(urlFor(token));
      setCopied(token);
    } catch {
      setCopied(null);
    }
  }

  async function patch(id: string, form: FormData) {
    const res = await fetch(`/api/shared-files/${id}`, { method: "PATCH", body: form }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (!res || !res.ok) {
      setError(data?.error ?? "That didn't save. Please try again.");
      return false;
    }
    setFiles((prev) => (prev ?? []).map((f) => (f.id === id ? data.file : f)));
    return true;
  }

  function toggleDownload(f: SharedFile) {
    const form = new FormData();
    form.append("allowDownload", String(!f.allowDownload));
    setError(null);
    patch(f.id, form);
  }

  function rename(f: SharedFile) {
    const next = window.prompt("New title", f.title);
    if (next === null) return;
    const form = new FormData();
    form.append("title", next);
    setError(null);
    patch(f.id, form);
  }

  async function onReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const id = replaceId.current;
    e.target.value = "";
    if (!file || !id) return;
    setError(null);
    setReplacing(id);
    const form = new FormData();
    form.append("file", file);
    await patch(id, form);
    setReplacing(null);
  }

  async function remove(f: SharedFile) {
    if (!window.confirm(`Switch off "${f.title}"? The link will stop working and the file will be deleted.`)) return;
    const res = await fetch(`/api/shared-files/${f.id}`, { method: "DELETE" });
    if (res.ok) setFiles((prev) => (prev ?? []).filter((x) => x.id !== f.id));
  }

  const field = "w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sage bg-white";

  return (
    <div>
      <form onSubmit={upload} className="rounded-xl p-4 mt-6 bg-card border border-line space-y-3">
        <p className="text-sm font-semibold">Add a file</p>
        <div>
          <label className="block text-xs font-semibold text-inkSoft mb-1" htmlFor="file-title">Title</label>
          <input id="file-title" className={field} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="e.g. This week's menu" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-inkSoft mb-1" htmlFor="file-pick">File (PDF, JPG or PNG, up to 4MB)</label>
          <input
            id="file-pick"
            ref={fileInput}
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            onChange={(e) => setPicked(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={allowDownload} onChange={(e) => setAllowDownload(e.target.checked)} />
          Let visitors download the file
        </label>
        <p className="text-xs text-inkSoft">
          Anyone with the link can see this file. Don't share anything with residents' names or private details. You can
          switch a link off at any time.
        </p>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || (files?.length ?? 0) >= MAX_SHARED_FILES}
          className="rounded-lg bg-sage text-white px-4 py-2 font-semibold text-sm hover:bg-sageDeep transition-colors disabled:opacity-60"
        >
          {busy ? "Uploading..." : "Upload and make my link"}
        </button>
        {(files?.length ?? 0) >= MAX_SHARED_FILES && (
          <p className="text-xs text-inkSoft">You've reached {MAX_SHARED_FILES} files. Remove one to add another.</p>
        )}
      </form>

      <h2 className="font-serif text-xl mt-8 mb-3">Your files</h2>
      <input ref={replaceInput} type="file" accept="application/pdf,image/jpeg,image/png" onChange={onReplace} className="hidden" />
      {files === null && <p className="text-sm text-inkSoft">Loading...</p>}
      {files?.length === 0 && <p className="text-sm text-inkSoft">Nothing shared yet. Add a file above to get your first link.</p>}
      <div className="space-y-3">
        {files?.map((f) => (
          <div key={f.id} className="rounded-xl p-4 bg-card border border-line">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold break-words">{f.title}</p>
                <p className="text-xs text-inkSoft mt-0.5">
                  {kindLabel(f.contentType)} · {sizeLabel(f.sizeBytes)} · updated {new Date(f.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </p>
              </div>
            </div>
            <input
              readOnly
              value={urlFor(f.token)}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs bg-white mt-2"
              aria-label="Link"
            />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs font-semibold">
              <button type="button" onClick={() => copy(f.token)} className="text-sageDeep underline">
                {copied === f.token ? "Copied" : "Copy link"}
              </button>
              <a href={`/f/${f.token}`} target="_blank" rel="noreferrer" className="text-sageDeep">Open</a>
              <button
                type="button"
                onClick={() => {
                  replaceId.current = f.id;
                  replaceInput.current?.click();
                }}
                disabled={replacing === f.id}
                className="text-sageDeep underline disabled:opacity-60"
              >
                {replacing === f.id ? "Replacing..." : "Replace file"}
              </button>
              <button type="button" onClick={() => rename(f)} className="text-sageDeep underline">Rename</button>
              <label className="flex items-center gap-1 font-normal text-inkSoft cursor-pointer">
                <input type="checkbox" checked={f.allowDownload} onChange={() => toggleDownload(f)} /> Visitors can download
              </label>
              <button type="button" onClick={() => remove(f)} className="text-inkSoft underline ml-auto">
                Switch off
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
