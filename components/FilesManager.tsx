"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import {
  MAX_CATEGORIES,
  MAX_ITEMS_PER_CATEGORY,
  MAX_SHARED_FILES,
  MAX_SHARED_FILE_MB,
  blobPathFor,
  checkUpload,
} from "@/lib/sharedFiles";
import QrCodeButton from "@/components/QrCodeButton";

type Item = { id: string; categoryId: string | null; contentType: string; sizeBytes: number };
type Category = { id: string; name: string };
type Link = { id: string; token: string; title: string; allowDownload: boolean; updatedAt: string; categories: Category[]; items: Item[] };
type Draft = { key: number; name: string; files: File[] };

const kindLabel = (t: string) => (t === "application/pdf" ? "PDF" : t === "image/png" ? "PNG" : "JPG");
const sizeLabel = (b: number) => (b >= 1024 * 1024 ? `${(b / (1024 * 1024)).toFixed(1)}MB` : `${Math.max(1, Math.round(b / 1024))}KB`);

export default function FilesManager() {
  const [links, setLinks] = useState<Link[] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [allowDownload, setAllowDownload] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([{ key: 1, name: "", files: [] }]);
  const nextKey = useRef(2);
  const [busy, setBusy] = useState<string | null>(null); // progress message while making a link
  const [working, setWorking] = useState<string | null>(null); // id of the section or file being changed
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const addInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const addFor = useRef<{ linkId: string; categoryId: string | null } | null>(null);
  const replaceFor = useRef<{ linkId: string; itemId: string } | null>(null);

  useEffect(() => {
    fetch("/api/shared-files")
      .then((r) => r.json())
      .then((d) => {
        setLinks(d.files ?? []);
        setUserId(d.userId ?? null);
      })
      .catch(() => setLinks([]));
  }, []);

  const urlFor = (token: string) => `${window.location.origin}/f/${token}`;
  const setOne = (link: Link) => setLinks((prev) => (prev ?? []).map((l) => (l.id === link.id ? link : l)));

  async function send(url: string, method: string, body?: FormData | Record<string, unknown>): Promise<any | undefined> {
    const isForm = typeof FormData !== "undefined" && body instanceof FormData;
    const res = await fetch(url, {
      method,
      body: body ? (isForm ? (body as FormData) : JSON.stringify(body)) : undefined,
      headers: body && !isForm ? { "Content-Type": "application/json" } : undefined,
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (!res || !res.ok) {
      setError(data?.error ?? "That didn't work. Please try again.");
      return undefined;
    }
    return data;
  }

  // Checks the file, then sends it straight to storage (so big files work).
  // Returns its address there, or null after showing why not.
  async function uploadFile(file: File, forTitle: string): Promise<string | null> {
    if (!userId) {
      setError("Still loading. Please try again in a moment.");
      return null;
    }
    const checked = await checkUpload(file);
    if ("error" in checked) {
      setError(`${file.name}: ${checked.error}`);
      return null;
    }
    try {
      const blob = await upload(blobPathFor(userId, forTitle, checked.kind.ext), file, {
        access: "public",
        handleUploadUrl: "/api/shared-files/upload",
        contentType: checked.kind.contentType,
      });
      return blob.url;
    } catch {
      setError("The upload didn't work. Please check your connection and try again.");
      return null;
    }
  }

  // ----- making a new link -----
  const setDraft = (key: number, change: Partial<Draft>) => setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...change } : d)));

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Give the link a title.");
    const several = drafts.length > 1;
    if (several && drafts.some((d) => !d.name.trim())) return setError("Give every section a name.");
    if (drafts.some((d) => d.files.length === 0)) return setError("Choose at least one file for every section.");
    if (drafts.some((d) => d.files.length > MAX_ITEMS_PER_CATEGORY)) return setError(`A section can hold up to ${MAX_ITEMS_PER_CATEGORY} files.`);

    const total = drafts.reduce((n, d) => n + d.files.length, 0);
    let done = 0;
    const categories: { name: string; blobUrls: string[] }[] = [];
    for (const d of drafts) {
      const blobUrls: string[] = [];
      for (const f of d.files) {
        setBusy(`Uploading file ${done + 1} of ${total}...`);
        const url = await uploadFile(f, title);
        if (!url) return setBusy(null);
        blobUrls.push(url);
        done++;
      }
      categories.push({ name: several ? d.name : "", blobUrls });
    }
    setBusy("Making your link...");
    const data = await send("/api/shared-files", "POST", { title, allowDownload, categories });
    setBusy(null);
    const link: Link | undefined = data?.file;
    if (!link) return;
    setLinks((prev) => [link, ...(prev ?? [])]);
    setTitle("");
    setAllowDownload(false);
    setDrafts([{ key: nextKey.current++, name: "", files: [] }]);
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

  // ----- changing an existing link -----
  async function toggleDownload(l: Link) {
    setError(null);
    const form = new FormData();
    form.append("allowDownload", String(!l.allowDownload));
    const data = await send(`/api/shared-files/${l.id}`, "PATCH", form);
    if (data?.file) setOne(data.file);
  }

  async function rename(l: Link) {
    const next = window.prompt("New title", l.title);
    if (next === null) return;
    setError(null);
    const form = new FormData();
    form.append("title", next);
    const data = await send(`/api/shared-files/${l.id}`, "PATCH", form);
    if (data?.file) setOne(data.file);
  }

  async function deleteLink(l: Link) {
    if (!window.confirm(`Delete "${l.title}"? All its files will be deleted for good and the link will stop working.`)) return;
    setError(null);
    const res = await fetch(`/api/shared-files/${l.id}`, { method: "DELETE" });
    if (res.ok) setLinks((prev) => (prev ?? []).filter((x) => x.id !== l.id));
  }

  async function addSection(l: Link) {
    const name = window.prompt("Name the new section (for example Menu, Calendar or Complaints form)");
    if (!name || !name.trim()) return;
    setError(null);
    const data = await send(`/api/shared-files/${l.id}/categories`, "POST", { name });
    if (data?.file) setOne(data.file);
  }

  async function renameSection(l: Link, c: Category) {
    const name = window.prompt("New section name", c.name);
    if (!name || !name.trim()) return;
    setError(null);
    const data = await send(`/api/shared-files/${l.id}/categories/${c.id}`, "PATCH", { name });
    if (data?.file) setOne(data.file);
  }

  async function deleteSection(l: Link, c: Category) {
    const count = l.items.filter((i) => i.categoryId === c.id).length;
    if (!window.confirm(`Delete the section "${c.name}"${count ? ` and its ${count} file${count === 1 ? "" : "s"}` : ""}? This can't be undone.`)) return;
    setError(null);
    const data = await send(`/api/shared-files/${l.id}/categories/${c.id}`, "DELETE");
    if (data?.file) setOne(data.file);
  }

  async function onAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const target = addFor.current;
    e.target.value = "";
    if (!file || !target) return;
    setError(null);
    setWorking(target.categoryId ?? target.linkId);
    const link = links?.find((l) => l.id === target.linkId);
    const blobUrl = await uploadFile(file, link?.title ?? "file");
    const data = blobUrl
      ? await send(`/api/shared-files/${target.linkId}/items`, "POST", { blobUrl, categoryId: target.categoryId ?? "" })
      : undefined;
    setWorking(null);
    if (data?.file) setOne(data.file);
  }

  async function onReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const target = replaceFor.current;
    e.target.value = "";
    if (!file || !target) return;
    setError(null);
    setWorking(target.itemId);
    const link = links?.find((l) => l.id === target.linkId);
    const blobUrl = await uploadFile(file, link?.title ?? "file");
    const data = blobUrl ? await send(`/api/shared-files/${target.linkId}/items/${target.itemId}`, "PUT", { blobUrl }) : undefined;
    setWorking(null);
    if (data?.file) setOne(data.file);
  }

  async function moveItem(l: Link, item: Item, categoryId: string) {
    setError(null);
    const data = await send(`/api/shared-files/${l.id}/items/${item.id}`, "PATCH", { categoryId });
    if (data?.file) setOne(data.file);
  }

  async function removeItem(l: Link, item: Item) {
    if (!window.confirm(`Remove this file from "${l.title}"? It will be deleted for good.`)) return;
    setError(null);
    const data = await send(`/api/shared-files/${l.id}/items/${item.id}`, "DELETE");
    if (data?.file) setOne(data.file);
  }

  const field = "w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sage bg-white";
  const accept = "application/pdf,image/jpeg,image/png";
  const smallBtn = "text-sageDeep underline font-semibold";

  function fileRow(l: Link, item: Item, n: number) {
    return (
      <div key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="text-ink">
          {n}. {kindLabel(item.contentType)} · {sizeLabel(item.sizeBytes)}
        </span>
        <button
          type="button"
          onClick={() => {
            replaceFor.current = { linkId: l.id, itemId: item.id };
            replaceInput.current?.click();
          }}
          disabled={working === item.id}
          className={`${smallBtn} disabled:opacity-60`}
        >
          {working === item.id ? "Replacing..." : "Replace"}
        </button>
        {l.categories.length > 0 && (
          <label className="flex items-center gap-1 text-inkSoft">
            Move to
            <select
              value={item.categoryId ?? ""}
              onChange={(e) => moveItem(l, item, e.target.value)}
              className="rounded-lg border border-line bg-white px-1.5 py-0.5 text-xs"
            >
              <option value="">No section</option>
              {l.categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
        )}
        {l.items.length > 1 && (
          <button type="button" onClick={() => removeItem(l, item)} className="text-red-600 underline font-semibold">
            Remove
          </button>
        )}
      </div>
    );
  }

  function addFileButton(l: Link, categoryId: string | null) {
    const count = l.items.filter((i) => (categoryId ? i.categoryId === categoryId : !i.categoryId)).length;
    if (count >= MAX_ITEMS_PER_CATEGORY) return <p className="text-xs text-inkSoft mt-1">Full ({MAX_ITEMS_PER_CATEGORY} files).</p>;
    const id = categoryId ?? l.id;
    return (
      <button
        type="button"
        onClick={() => {
          addFor.current = { linkId: l.id, categoryId };
          addInput.current?.click();
        }}
        disabled={working === id}
        className="mt-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-sageDeep hover:bg-cardTint disabled:opacity-60"
      >
        {working === id ? "Adding..." : "+ Add a file"}
      </button>
    );
  }

  return (
    <div>
      <form onSubmit={create} className="rounded-xl p-4 mt-6 bg-card border border-line space-y-3">
        <p className="text-sm font-semibold">Make a new link</p>
        <div>
          <label className="block text-xs font-semibold text-inkSoft mb-1" htmlFor="file-title">1. Title of the page</label>
          <input id="file-title" className={field} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="e.g. Information for families" />
        </div>

        <div>
          <p className="block text-xs font-semibold text-inkSoft mb-1">2. Sections and their files</p>
          <p className="text-xs text-inkSoft mb-2">
            Visitors scan one QR code and see your sections as buttons, such as Menu, Calendar and Complaints form. They tap a
            button to see the files in it. Up to {MAX_ITEMS_PER_CATEGORY} files in each section, PDF, JPG or PNG, up to {MAX_SHARED_FILE_MB}MB each.
            If you only have one group of files, leave the section name blank.
          </p>
          <div className="space-y-2">
            {drafts.map((d, idx) => (
              <div key={d.key} className="rounded-lg border border-line bg-white p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    className={field}
                    value={d.name}
                    onChange={(e) => setDraft(d.key, { name: e.target.value })}
                    maxLength={100}
                    placeholder={drafts.length > 1 ? `Section ${idx + 1} name, e.g. Menu` : "Section name (optional), e.g. Menu"}
                    aria-label={`Section ${idx + 1} name`}
                  />
                  {drafts.length > 1 && (
                    <button type="button" onClick={() => setDrafts((prev) => prev.filter((x) => x.key !== d.key))} className="text-xs text-red-600 underline font-semibold whitespace-nowrap">
                      Remove section
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  multiple
                  accept={accept}
                  onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []);
                    setDraft(d.key, { files: picked });
                  }}
                  className="text-sm"
                  aria-label={`Files for section ${idx + 1}`}
                />
                {d.files.length > 0 && (
                  <p className="text-xs text-inkSoft">
                    {d.files.length} file{d.files.length === 1 ? "" : "s"}: {d.files.map((f) => f.name).join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
          {drafts.length < MAX_CATEGORIES && (
            <button
              type="button"
              onClick={() => setDrafts((prev) => [...prev, { key: nextKey.current++, name: "", files: [] }])}
              className="mt-2 rounded-lg border border-dashed border-line bg-white px-3 py-1.5 text-xs font-semibold text-sageDeep hover:bg-cardTint"
            >
              + Add another section
            </button>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={allowDownload} onChange={(e) => setAllowDownload(e.target.checked)} />
          Let visitors download the files
        </label>
        <p className="text-xs text-inkSoft">
          Anyone with the link can see what's on it, so don't share residents' names or private details. You can add, rename or
          remove sections and files later, and delete a link at any time.
        </p>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={!!busy || (links?.length ?? 0) >= MAX_SHARED_FILES}
          className="rounded-lg bg-sage text-white px-4 py-2 font-semibold text-sm hover:bg-sageDeep transition-colors disabled:opacity-60"
        >
          {busy ?? "Upload and make my link"}
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
        {links?.map((l) => {
          const loose = l.items.filter((i) => !i.categoryId);
          return (
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

              <div className="mt-3 border-t border-line pt-2 space-y-3">
                {l.categories.map((c) => {
                  const inside = l.items.filter((i) => i.categoryId === c.id);
                  return (
                    <div key={c.id} className="rounded-lg bg-white border border-line p-2.5">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                        <p className="text-sm font-semibold">{c.name}</p>
                        <button type="button" onClick={() => renameSection(l, c)} className={`text-xs ${smallBtn}`}>Rename</button>
                        <button type="button" onClick={() => deleteSection(l, c)} className="text-xs text-red-600 underline font-semibold">Delete section</button>
                      </div>
                      {inside.length === 0 && <p className="text-xs text-inkSoft">No files yet. Add one so visitors see this section.</p>}
                      <div className="space-y-1">{inside.map((item, i) => fileRow(l, item, i + 1))}</div>
                      {addFileButton(l, c.id)}
                    </div>
                  );
                })}
                {(loose.length > 0 || l.categories.length === 0) && (
                  <div className={l.categories.length > 0 ? "rounded-lg bg-white border border-line p-2.5" : ""}>
                    <p className="text-xs font-semibold text-inkSoft mb-1">
                      {l.categories.length > 0 ? "Files not in a section (shown under Other)" : "Files on this link"}
                    </p>
                    <div className="space-y-1">{loose.map((item, i) => fileRow(l, item, i + 1))}</div>
                    {addFileButton(l, null)}
                  </div>
                )}
                {l.categories.length < MAX_CATEGORIES && (
                  <button
                    type="button"
                    onClick={() => addSection(l)}
                    className="rounded-lg border border-dashed border-line bg-white px-3 py-1.5 text-xs font-semibold text-sageDeep hover:bg-cardTint"
                  >
                    + Add a section
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
