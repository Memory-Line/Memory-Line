"use client";

import { useCallback, useEffect, useState } from "react";

type S = {
  key: string;
  label: string;
  defaultBanner: string;
  icons: string[];
  palette: { sage: string; clay: string; topbar: string };
  bannerText: string;
  on: boolean;
};

const field = "w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sage bg-white";

export default function SeasonAdmin() {
  const [data, setData] = useState<{ activeKey: string | null; preview: string | null; seasons: S[] } | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/season");
    if (res.ok) setData(await res.json());
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const edit = (key: string, bannerText: string) =>
    setData((d) => (d ? { ...d, seasons: d.seasons.map((s) => (s.key === key ? { ...s, bannerText } : s)) } : d));

  async function save(s: S, patch: { on?: boolean }) {
    setBusy(s.key);
    setNote(null);
    const res = await fetch("/api/admin/season", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: s.key, bannerText: s.bannerText, ...patch }),
    });
    setBusy(null);
    if (!res.ok) return setNote({ ok: false, text: "That didn't save. Please try again." });
    setNote({
      ok: true,
      text: patch.on === true ? `${s.label} is ON for everyone.` : patch.on === false ? `${s.label} is OFF.` : `${s.label} message saved.`,
    });
    await load();
  }

  async function preview(key: string | null) {
    await fetch("/api/admin/season", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) });
    await load();
    setNote({ ok: true, text: key ? "Previewing on your browser only. Open the home page to see it." : "Preview off." });
  }

  if (!data) return <p className="text-sm text-inkSoft mt-6">Loading...</p>;
  const on = data.seasons.find((s) => s.on);

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-xl border border-line bg-card p-4 text-sm">
        <p>
          <b>On the site right now:</b> {on ? on.label : "the normal look"}
        </p>
        {data.preview && (
          <p className="mt-1 text-sageDeep">
            You are previewing <b>{data.seasons.find((s) => s.key === data.preview)?.label}</b> (only you see this).{" "}
            <button type="button" onClick={() => preview(null)} className="underline font-semibold">
              Stop previewing
            </button>
          </p>
        )}
        <p className="text-xs text-inkSoft mt-1">Only one look can be on at a time. A change can take up to five minutes to show on the home page.</p>
      </div>
      {note && <p className={`text-sm ${note.ok ? "text-sageDeep" : "text-red-600"}`}>{note.text}</p>}

      {data.seasons.map((s) => (
        <section key={s.key} className={`rounded-xl border bg-card p-4 ${s.on ? "border-sage" : "border-line"}`}>
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

          <label className="block text-xs font-semibold text-inkSoft mb-1" htmlFor={`msg-${s.key}`}>Banner message</label>
          <input id={`msg-${s.key}`} className={field} value={s.bannerText} onChange={(e) => edit(s.key, e.target.value)} maxLength={160} placeholder={s.defaultBanner} />
          <p className="text-[11px] text-inkSoft mt-1">Leave blank to use the message shown in grey.</p>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {s.on ? (
              <button type="button" disabled={busy === s.key} onClick={() => save(s, { on: false })} className="rounded-lg bg-red-600 text-white px-5 py-2 text-sm font-semibold disabled:opacity-60">
                Turn OFF
              </button>
            ) : (
              <button
                type="button"
                disabled={busy === s.key}
                onClick={() => window.confirm(`Turn on the ${s.label} look for everyone now?`) && save(s, { on: true })}
                className="rounded-lg bg-sage text-white px-5 py-2 text-sm font-semibold hover:bg-sageDeep disabled:opacity-60"
              >
                Turn ON
              </button>
            )}
            <button type="button" disabled={busy === s.key} onClick={() => save(s, {})} className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-sageDeep hover:bg-cardTint disabled:opacity-60">
              Save message
            </button>
            <button type="button" onClick={() => preview(s.key)} className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-sageDeep hover:bg-cardTint">
              Preview (only me)
            </button>
            <span className={`text-xs font-bold ${s.on ? "text-sageDeep" : "text-inkSoft"}`}>{s.on ? "ON" : "off"}</span>
          </div>
        </section>
      ))}
    </div>
  );
}
