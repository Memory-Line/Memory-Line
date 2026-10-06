"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_ITEMS_PER_LINK, MAX_SHARED_FILES } from "@/lib/sharedFiles";
import QrCodeButton from "@/components/QrCodeButton";

type Item = { id: string; contentType: string; sizeBytes: number };
type Link = { id: string; token: string; title: string; allowDownload: boolean; updatedAt: string; items: Item[] };

const kindLabel = (t: string) => (t === "application/pdf" ? "PDF" : t === "image/png" ? "PNG" : "JPG");
const sizeLabel = (b: number) => (b >= 1024 * 1024 ? `${(b / (1024 * 1024)).toFixed(1)}MB` : `${Math.max(1, Math.round(b / 1024))}KB`);

export default function FilesManager() {
  const [links, setLinks] = useState<Link[] | null>(null);
  const [title, setTitle] = useState("");
  const [allowDownload, setAllowDownload] = useState(false);
  const [picked, setPicked] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [working, setWorking] = useState<string | null>(null); // id of the link or file being changed
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const createInput = useRef<HTMLInputElement>(null);
  const addInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const addFor = useRef<string | null>(null);
  const replaceFor = useRef<{ linkId: string; itemId: string } | null>(null);

  useEffect(() => {
    fetch("/api/shared-files")
      .then((r) => r.json())
      .then((d) => setLinks(d.files ?? []))
      .catch(() => setLinks([]));
  }, []);

  const urlFor = (token: string) => `${window.location.origin}/f/${token}`;
  const setOne = (link: Link) => setLinks((prev) => (prev ?? []).map((l) => (l.id === link.id ? link : l)));

  async function send(url: string, method: string, form?: FormData): Promise<Link | null | undefined> {
    const res = await fetch(url, { method, body: form }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (!res || !res.ok) {
      setError(data?.error ?? "That didn't work. Please try again.");
      return undefined;
    }
    return data.file ?? null;
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!picked) return setError("Choose a file first.");
    if (!title.trim()) return setError("Give the link a title.");
    setBusy(true);
    const form = new FormData();
    form.append("file", picked);
    form.append("title", title);
    form.append("allowDownload", String(allowDownload));
    const link = await send("/api/shared-files", "POST", form);
    setBusy(false);
    if (!link) return;
    setLinks((prev) => [link, ...(prev ?? [])]);
    setTitle("");
    setPicked(null);
    setAllowDownload(false);
    if (createInput.current) createInput.current.value = "";
    copy(link.token);
  }

  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(urlFor(token));
      setCopied(token);
    } catch {
      setCopied(null);
    }
  }

  async function toggleDownload(l: Link) {
    setError(null);
    const form = new FormData();
    form.append("allowDownload", String(!l.allowDownload));
    const link = await send(`/api/shared-files/${l.id}`, "PATCH", form);
    if (link) setOne(link);
  }

  async function rename(l: Link) {
    const next = window.prompt("New title", l.title);
    if (next === null) return;
    setError(null);
    const form = new FormData();
    form.append("title", next);
    const link = await send(`/api/shared-files/${l.id}`, "PATCH", form);
    if (link) setOne(link);
  }

  async function deleteLink(l: Link) {
    if (!window.confirm(`Delete "${l.title}"? All its files will be deleted for good and the link will stop working.`)) return;
    setError(null);
    const res = await fetch(`/api/shared-files/${l.id}`, { method: "DELETE" });
    if (res.ok) setLinks((prev) => (prev ?? []).filter((x) => x.id !== l.id));
  }

  async function onAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const id = addFor.current;
    e.target.value = "";
    if (!file || !id) return;
    setError(null);
    setWorking(id);
    const form = new FormData();
    form.append("file", file);
    const link = await send(`/api/shared-files/${id}/items`, "POST", form);
    setWorking(null);
    if (link) setOne(link);
  }

  async function onReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const target = replaceFor.current;
    e.target.value = "";
    if (!file || !target) return;
    setError(null);
    setWorking(target.itemId);
    const form = new FormData();
    form.append("file", file);
    const link = await send(`/api/shared-files/${target.linkId}/items/${target.itemId}`, "PUT", form);
    setWorking(null);
    if (link) setOne(link);
  }

  async function removeItem(l: Link, item: Item, n: number) {
    if (!window.confirm(`Remove file ${n} from "${l.title}"? It will be deleted for good.`)) return;
    setError(null);
    const link = await send(`/api/shared-files/${l.id}/items/${item.id}`, "DELETE");
    if (link) setOne(link);
  }

  const field = "w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sage bg-white";
  const accept = "application/pdf,image/jpeg,image/png";

  return (
    <div>
      <form onSubmit={create} className="rounded-xl p-4 mt-6 bg-card border border-line space-y-3">
        <p className="text-sm font-semibold">Make a new link</p>
        <div>
          <label className="block text-xs font-semibold text-inkSoft mb-1" htmlFor="file-title">Title</label>
          <input id="file-title" className={field} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="e.g. This week's menu, or Room 12" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-inkSoft mb-1" htmlFor="file-pick">First file (PDF, JPG or PNG, up to 4MB)</label>
          <input id="file-pick" ref={createInput} type="file" accept={accept} onChange={(e) => setPicked(e.target.files?.[0] ?? null)} className="text-sm" />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={allowDownload} onChange={(e) => setAllowDownload(e.target.checked)} />
          Let visitors download the files
        </label>
        <p className="text-xs text-inkSoft">
          You can add up to {MAX_ITEMS_PER_LINK} files to each link once it's made, such as several photos of a room. Anyone with
          the link can see what's on it, so don't share residents' names or private details. Delete a link at any time.
        </p>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || (links?.length ?? 0) >= MAX_SHARED_FILES}
          className="rounded-lg bg-sage text-white px-4 py-2 font-semibold text-sm hover:bg-sageDeep transition-colors disabled:opacity-60"
        >
          {busy ? "Uploading..." : "Upload and make my link"}
        </button>
        {(links?.length ?? 0) >= MAX_SHARED_FILES && (
          <p className="text-xs text-inkSoft">You've reached {MAX_SHARED_FILES} links. Delete one to make another.</p>
        )}
      </form>

      <h2 className="font-serif text-xl mt-8 mb-3">Your links</h2>
      <input ref={addInput} type="file" accept={accept} onChange={onAdd} className="hidden" />
      <input ref={replaceInput} type="file" accept={accept} onChange={onReplace} className="hidden" />
      {links === null && <p className="text-sm text-inkSoft">Loading...</p>}
      {links?.length === 0 && <p className="text-sm text-inkSoft">Nothing shared yet. Make a link above to get started.</p>}
      <div className="space-y-3">
        {links?.map((l) => (
          <div key={l.id} className="rounded-xl p-4 bg-card border border-line">
            <p className="text-sm font-semibold break-words">{l.title}</p>
            <input
              readOnly
              value={urlFor(l.token)}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs bg-white mt-2"
              aria-label="Link"
            />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs font-semibold">
              <button type="button" onClick={() => copy(l.token)} className="text-sageDeep underline">
                {copied === l.token ? "Copied" : "Copy link"}
              </button>
              <QrCodeButton url={urlFor(l.token)} title={l.title} className="text-sageDeep underline" />
              <a href={`/f/${l.token}`} target="_blank" rel="noreferrer" className="text-sageDeep">Open</a>
              <button type="button" onClick={() => rename(l)} className="text-sageDeep underline">Rename</button>
              <label className="flex items-center gap-1 font-normal text-inkSoft cursor-pointer">
                <input type="checkbox" checked={l.allowDownload} onChange={() => toggleDownload(l)} /> Visitors can download
              </label>
              <button type="button" onClick={() => deleteLink(l)} className="text-red-600 underline ml-auto">
                Delete link
              </button>
            </div>

            <div className="mt-3 border-t border-line pt-2">
              <p className="text-xs font-semibold text-inkSoft mb-1">
                Files on this link ({l.items.length} of {MAX_ITEMS_PER_LINK})
              </p>
              <div className="space-y-1">
                {l.items.map((item, i) => (
                  <div key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="text-ink">
                      {i + 1}. {kindLabel(item.contentType)} · {sizeLabel(item.sizeBytes)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        replaceFor.current = { linkId: l.id, itemId: item.id };
                        replaceInput.current?.click();
                      }}
                      disabled={working === item.id}
                      className="text-sageDeep underline font-semibold disabled:opacity-60"
                    >
                      {working === item.id ? "Replacing..." : "Replace"}
                    </button>
                    {l.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(l, item, i + 1)} className="text-red-600 underline font-semibold">
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {l.items.length < MAX_ITEMS_PER_LINK && (
                <button
                  type="button"
                  onClick={() => {
                    addFor.current = l.id;
                    addInput.current?.click();
                  }}
                  disabled={working === l.id}
                  className="mt-2 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-sageDeep hover:bg-cardTint disabled:opacity-60"
                >
                  {working === l.id ? "Adding..." : "+ Add another file"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
