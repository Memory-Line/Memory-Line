"use client";

import { useEffect, useState } from "react";

export default function LoadBoards() {
  const [info, setInfo] = useState<{ loaded: number; inFile: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const refresh = () => fetch("/api/admin/boards/load").then((r) => r.json()).then(setInfo).catch(() => {});
  useEffect(() => { refresh(); }, []);

  async function load() {
    if (!confirm("This replaces all boards in the database with the approved set. Continue?")) return;
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/boards/load", { method: "POST" });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(res.ok ? `Loaded ${j.boards} boards.` : j.error || "That did not work.");
    refresh();
  }

  return (
    <div className="rounded-xl p-4 bg-card border border-line">
      <p className="text-sm mb-3">
        Boards in the database: <b>{info ? info.loaded : "…"}</b> · Boards in the approved file: <b>{info ? info.inFile : "…"}</b>
      </p>
      <button type="button" onClick={load} disabled={busy} className="rounded-lg bg-sage text-white px-4 py-2 text-sm font-semibold disabled:opacity-60">
        {busy ? "Loading…" : "Load the approved boards"}
      </button>
      {msg && <p className="text-sm mt-3">{msg}</p>}
    </div>
  );
}
