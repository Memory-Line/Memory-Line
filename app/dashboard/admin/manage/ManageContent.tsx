"use client";

import { useCallback, useEffect, useState } from "react";

type Cat = { name: string; builtIn: boolean; removed: boolean; count: number; icon?: string };
type Colour = { name: string; color: string; tint: string };
type Item = { id: string; title: string; fileName: string; hasAnswers: boolean; hasLargePrint: boolean };

const box = "rounded-xl border border-line bg-card p-4";
const field = "w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sage bg-white";
const btn = "rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60";

export default function ManageContent() {
  const [cats, setCats] = useState<Cat[] | null>(null);
  const [icons, setIcons] = useState<string[]>([]);
  const [colours, setColours] = useState<Colour[]>([]);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // new category
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("Star");
  const [newColour, setNewColour] = useState("Terracotta");
  const [busy, setBusy] = useState(false);

  // activities
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [list, setList] = useState<{ total: number; pages: number; items: Item[] } | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const loadCats = useCallback(async () => {
    const res = await fetch("/api/admin/categories");
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) return setMessage({ ok: false, text: "Couldn't load the categories." });
    setCats(data.categories);
    setIcons(data.icons);
    setColours(data.colours);
    setCategory((c) => c || data.categories.find((x: Cat) => !x.removed)?.name || "");
  }, []);
  useEffect(() => {
    loadCats();
  }, [loadCats]);

  const loadList = useCallback(async () => {
    if (!category) return;
    const res = await fetch(`/api/admin/templates?category=${encodeURIComponent(category)}&q=${encodeURIComponent(query)}&page=${page}`);
    const data = await res.json().catch(() => null);
    if (res.ok && data) {
      setList(data);
      setPicked(new Set());
    }
  }, [category, query, page]);
  useEffect(() => {
    const t = setTimeout(loadList, query ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadList, query]);

  async function call(url: string, method: string, body: unknown) {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const { ok, data } = await call("/api/admin/categories", "POST", { name: newName, icon: newIcon, colour: newColour });
    setBusy(false);
    if (!ok) return setMessage({ ok: false, text: data.error ?? "That didn't work." });
    setMessage({ ok: true, text: `"${newName}" is made. It now shows in the menu. Upload activities into it from the Upload page.` });
    setNewName("");
    loadCats();
  }

  async function removeCategory(c: Cat) {
    const typed = window.prompt(
      `This removes the category "${c.name}" and permanently deletes its ${c.count} activities and their files.\n\nType the category's name to confirm.`
    );
    if (typed === null) return;
    setBusy(true);
    setMessage(null);
    const { ok, data } = await call("/api/admin/categories", "DELETE", { name: c.name, confirm: typed });
    setBusy(false);
    if (!ok) return setMessage({ ok: false, text: data.error ?? "That didn't work." });
    setMessage({ ok: true, text: `"${c.name}" is removed (${data.deleted} activities deleted).` });
    if (category === c.name) setCategory("");
    await loadCats();
    setList(null);
  }

  async function restoreCategory(c: Cat) {
    await call("/api/admin/categories", "POST", { action: "restore", name: c.name });
    setMessage({ ok: true, text: `"${c.name}" is back (empty). Upload activities into it again.` });
    loadCats();
  }

  async function deletePicked() {
    if (picked.size === 0) return;
    if (!window.confirm(`Permanently delete ${picked.size} ${picked.size === 1 ? "activity" : "activities"} and their files? This can't be undone.`)) return;
    setBusy(true);
    setMessage(null);
    const { ok, data } = await call("/api/admin/templates", "DELETE", { ids: Array.from(picked) });
    setBusy(false);
    if (!ok) return setMessage({ ok: false, text: data.error ?? "That didn't work." });
    setMessage({ ok: true, text: `${data.deleted} deleted.` });
    loadList();
    loadCats();
  }

  const live = (cats ?? []).filter((c) => !c.removed);
  const removed = (cats ?? []).filter((c) => c.removed);
  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-6 mt-6">
      {message && <p className={`text-sm ${message.ok ? "text-sageDeep" : "text-red-600"}`}>{message.text}</p>}

      <section className={box}>
        <h2 className="font-serif text-lg mb-1">Make a new category</h2>
        <p className="text-[13px] text-inkSoft mb-3">It appears in the menu, on the dashboard and on the home page. Everyone on either plan can use it.</p>
        <form onSubmit={createCategory} className="space-y-2.5">
          <input className={field} value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={40} placeholder="Category name, e.g. Poetry" aria-label="Category name" />
          <div className="grid sm:grid-cols-2 gap-2.5">
            <label className="text-xs font-semibold text-inkSoft">
              Icon
              <select className={`${field} mt-1`} value={newIcon} onChange={(e) => setNewIcon(e.target.value)}>
                {icons.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-inkSoft">
              Colour
              <select className={`${field} mt-1`} value={newColour} onChange={(e) => setNewColour(e.target.value)}>
                {colours.map((c) => (
                  <option key={c.name}>{c.name}</option>
                ))}
              </select>
            </label>
          </div>
          <button type="submit" disabled={busy || !newName.trim()} className={`${btn} bg-sage text-white hover:bg-sageDeep`}>
            Make category
          </button>
        </form>
      </section>

      <section className={box}>
        <h2 className="font-serif text-lg mb-1">Categories</h2>
        <p className="text-[13px] text-inkSoft mb-3">Removing a category deletes all its activities for good. Calendar occasion packs are not touched.</p>
        {cats === null && <p className="text-sm text-inkSoft">Loading...</p>}
        <div className="divide-y divide-line">
          {live.map((c) => (
            <div key={c.name} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span>
                <b>{c.name}</b> <span className="text-inkSoft">· {c.count} activities{c.builtIn ? "" : " · made by you"}</span>
              </span>
              <button type="button" disabled={busy} onClick={() => removeCategory(c)} className="text-xs font-semibold text-red-600 underline disabled:opacity-60">
                Remove category
              </button>
            </div>
          ))}
        </div>
        {removed.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-inkSoft mb-1">Removed</p>
            {removed.map((c) => (
              <div key={c.name} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                <span className="text-inkSoft">{c.name}</span>
                <button type="button" onClick={() => restoreCategory(c)} className="text-xs font-semibold text-sageDeep underline">
                  Bring back (empty)
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={box}>
        <h2 className="font-serif text-lg mb-1">Remove activities</h2>
        <p className="text-[13px] text-inkSoft mb-3">Pick a category, search if you like, tick the ones to remove, then delete. 100 are shown at a time.</p>
        <div className="grid sm:grid-cols-2 gap-2.5 mb-3">
          <select
            className={field}
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
              setQuery("");
            }}
            aria-label="Category"
          >
            {live.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>
          <input
            className={field}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title or file name"
            aria-label="Search"
          />
        </div>

        {list && (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-2 text-xs">
              <button type="button" onClick={() => setPicked(new Set(list.items.map((i) => i.id)))} className="font-semibold text-sageDeep underline">
                Tick all on this page
              </button>
              <button type="button" onClick={() => setPicked(new Set())} className="font-semibold text-sageDeep underline">
                Untick all
              </button>
              <span className="text-inkSoft">
                {list.total} found · page {page} of {list.pages}
              </span>
              <button
                type="button"
                onClick={deletePicked}
                disabled={busy || picked.size === 0}
                className="ml-auto rounded-lg bg-red-600 text-white px-3 py-1.5 font-semibold disabled:opacity-50"
              >
                Delete {picked.size || ""} ticked
              </button>
            </div>
            <div className="rounded-lg border border-line bg-white divide-y divide-line">
              {list.items.length === 0 && <p className="p-3 text-sm text-inkSoft">Nothing here.</p>}
              {list.items.map((i) => (
                <label key={i.id} className="flex items-start gap-3 p-2.5 text-sm cursor-pointer hover:bg-cardTint">
                  <input type="checkbox" checked={picked.has(i.id)} onChange={() => toggle(i.id)} className="mt-1" />
                  <span className="min-w-0">
                    <span className="font-semibold block">{i.title}</span>
                    <span className="text-[11px] text-inkSoft break-all block">
                      {i.fileName}
                      {i.hasAnswers ? " · answers" : ""}
                      {i.hasLargePrint ? " · large print" : ""}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            {list.pages > 1 && (
              <div className="flex gap-3 mt-3 text-xs font-semibold">
                <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="text-sageDeep underline disabled:opacity-40">
                  ← Previous 100
                </button>
                <button type="button" disabled={page >= list.pages} onClick={() => setPage(page + 1)} className="text-sageDeep underline disabled:opacity-40">
                  Next 100 →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
