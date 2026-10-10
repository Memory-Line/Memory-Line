"use client";

import { useCallback, useEffect, useState } from "react";

type S = {
  key: string;
  label: string;
  defaultBanner: string;
  icons: string[];
  palette: { sage: string; clay: string; topbar: string; bg: string };
  suggested: { start: string; end: string; yearly: boolean } | null;
  enabled: boolean;
  bannerText: string;
  startDate: string;
  endDate: string;
  yearly: boolean;
  forceNow: boolean;
};

const field = "w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sage bg-white";

export default function SeasonAdmin() {
  const [data, setData] = useState<{ today: string; activeKey: string | null; preview: string | null; seasons: S[] } | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/season");
    if (res.ok) setData(await res.json());
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const change = (key: string, patch: Partial<S>) =>
    setData((d) => (d ? { ...d, seasons: d.seasons.map((s) => (s.key === key ? { ...s, ...patch } : s)) } : d));

  async function save(s: S, patch: Partial<S> = {}) {
    const next = { ...s, ...patch };
    setBusy(s.key);
    setNote(null);
    const res = await fetch("/api/admin/season", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return setNote({ ok: false, text: body.error ?? "That didn't save." });
    setNote({ ok: true, text: `${s.label} saved.` });
    await load();
  }

  async function preview(key: string | null) {
    await fetch("/api/admin/season", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) });
    await load();
    setNote({ ok: true, text: key ? "Previewing on your browser only. Open the home page to see it. Customers don't see it." : "Preview off." });
  }

  if (!data) return <p className="text-sm text-inkSoft mt-6">Loading...</p>;
  const active = data.seasons.find((s) => s.key === data.activeKey);

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-xl border border-line bg-card p-4 text-sm">
        <p>
          <b>On the site right now:</b> {active ? active.label : "the normal look"}
        </p>
        {data.preview && (
          <p className="mt-1 text-sageDeep">
            You are previewing <b>{data.seasons.find((s) => s.key === data.preview)?.label}</b> (only you see this).{" "}
            <button type="button" onClick={() => preview(null)} className="underline font-semibold">
              Stop previewing
            </button>
          </p>
        )}
        <p className="text-xs text-inkSoft mt-1">Today is {data.today}. The home page can take up to five minutes to follow a change.</p>
      </div>
      {note && <p className={`text-sm ${note.ok ? "text-sageDeep" : "text-red-600"}`}>{note.text}</p>}

      {data.seasons.map((s) => (
        <section key={s.key} className="rounded-xl border border-line bg-card p-4">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h2 className="font-serif text-lg mr-auto">{s.label}</h2>
            <span className="flex gap-1" aria-hidden="true">
              {[s.palette.topbar, s.palette.sage, s.palette.clay].map((c, i) => (
                <span key={i} className="inline-block w-5 h-5 rounded-full border border-line" style={{ background: c }} />
              ))}
            </span>
            <span className="flex gap-1">
              {s.icons.slice(0, 5).map((n, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={`/season/${n}.svg`} alt="" width={26} height={26} />
              ))}
            </span>
          </div>

          <label className="block text-xs font-semibold text-inkSoft mb-1">Banner message</label>
          <input className={field} value={s.bannerText} onChange={(e) => change(s.key, { bannerText: e.target.value })} maxLength={160} placeholder={s.defaultBanner} />
          <p className="text-[11px] text-inkSoft mt-1">Leave blank to use the message shown in grey.</p>

          <div className="grid sm:grid-cols-2 gap-2.5 mt-3">
            <label className="text-xs font-semibold text-inkSoft">
              Starts ({s.yearly ? "month-day, e.g. 12-01" : "date, e.g. 2026-12-01"})
              <input className={`${field} mt-1`} value={s.startDate} onChange={(e) => change(s.key, { startDate: e.target.value })} placeholder={s.yearly ? "MM-DD" : "YYYY-MM-DD"} />
            </label>
            <label className="text-xs font-semibold text-inkSoft">
              Ends ({s.yearly ? "month-day, e.g. 12-31" : "date, e.g. 2026-12-31"})
              <input className={`${field} mt-1`} value={s.endDate} onChange={(e) => change(s.key, { endDate: e.target.value })} placeholder={s.yearly ? "MM-DD" : "YYYY-MM-DD"} />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm mt-2 cursor-pointer">
            <input type="checkbox" checked={s.yearly} onChange={(e) => change(s.key, { yearly: e.target.checked, startDate: "", endDate: "" })} />
            Repeat every year (untick for one-off dates, like Easter)
          </label>
          <label className="flex items-center gap-2 text-sm mt-1.5 cursor-pointer">
            <input type="checkbox" checked={s.enabled} onChange={(e) => change(s.key, { enabled: e.target.checked })} />
            Switch on and off by itself between these dates
          </label>

          <div className="flex flex-wrap gap-2 mt-3">
            <button type="button" disabled={busy === s.key} onClick={() => save(s)} className="rounded-lg bg-sage text-white px-4 py-2 text-sm font-semibold hover:bg-sageDeep disabled:opacity-60">
              Save
            </button>
            <button type="button" onClick={() => preview(s.key)} className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-sageDeep hover:bg-cardTint">
              Preview (only me)
            </button>
            {s.forceNow ? (
              <button type="button" disabled={busy === s.key} onClick={() => save(s, { forceNow: false })} className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-cardTint">
                Switch off now
              </button>
            ) : (
              <button
                type="button"
                disabled={busy === s.key}
                onClick={() => window.confirm(`Show the ${s.label} look to everyone right now?`) && save(s, { forceNow: true })}
                className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-sageDeep hover:bg-cardTint"
              >
                Show to everyone now
              </button>
            )}
          </div>
          {s.forceNow && <p className="text-xs text-sageDeep mt-2">This look is being shown to everyone now, whatever the dates.</p>}
        </section>
      ))}
    </div>
  );
}
