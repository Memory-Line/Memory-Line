"use client";

import { useEffect, useState } from "react";
import QrCodeButton from "@/components/QrCodeButton";

type FormRow = { id: string; token: string; title: string; notifyEmail: string; user: { email: string; name: string | null } };

const TEMPLATES = [
  { key: "resident", label: "Resident feedback questionnaire" },
  { key: "relatives", label: "Relatives and friends feedback questionnaire" },
  { key: "employee", label: "Employee / staff feedback questionnaire" },
];

export default function AdminForms() {
  const [forms, setForms] = useState<FormRow[] | null>(null);
  const [accountEmail, setAccountEmail] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [picked, setPicked] = useState<string[]>(["resident", "relatives", "employee"]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/forms").catch(() => null);
    setForms(res?.ok ? (await res.json()).forms : []);
  }
  useEffect(() => {
    load();
  }, []);

  const urlFor = (token: string) => `${window.location.origin}/q/${token}`;

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    const res = await fetch("/api/admin/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountEmail, notifyEmail, templates: picked }),
    }).catch(() => null);
    setBusy(false);
    const data = await res?.json().catch(() => ({}));
    if (!res || !res.ok) return setMessage({ ok: false, text: data?.error ?? "That didn't work." });
    setMessage({ ok: true, text: `Made ${data.made.length} questionnaire${data.made.length === 1 ? "" : "s"}.` });
    load();
  }

  async function remove(f: FormRow) {
    if (!window.confirm(`Delete "${f.title}" for ${f.user.email}? Its link will stop working.`)) return;
    const res = await fetch(`/api/admin/forms?id=${f.id}`, { method: "DELETE" });
    if (res.ok) setForms((prev) => (prev ?? []).filter((x) => x.id !== f.id));
  }

  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(urlFor(token));
      setCopied(token);
    } catch {
      setCopied(null);
    }
  }

  const field = "w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sage bg-white";

  return (
    <div>
      <form onSubmit={create} className="rounded-xl p-4 mt-6 bg-card border border-line space-y-3">
        <p className="text-sm font-semibold">Make questionnaires for an account</p>
        <p className="text-xs text-inkSoft">The account needs the Questionnaires feature switched on first (Accounts section of the admin page).</p>
        <div>
          <label className="block text-xs font-semibold text-inkSoft mb-1" htmlFor="qa-account">Account email (who sees the links)</label>
          <input id="qa-account" className={field} value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} placeholder="nicky@westclifflodge.co.uk" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-inkSoft mb-1" htmlFor="qa-notify">Send the answers to this email</label>
          <input id="qa-notify" className={field} value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} placeholder="westclifflodge@gmail.com" />
        </div>
        <div className="space-y-1.5">
          {TEMPLATES.map((t) => (
            <label key={t.key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={picked.includes(t.key)}
                onChange={(e) => setPicked((prev) => (e.target.checked ? [...prev, t.key] : prev.filter((k) => k !== t.key)))}
              />
              {t.label}
            </label>
          ))}
        </div>
        {message && <p className={`text-xs ${message.ok ? "text-sageDeep" : "text-red-600"}`}>{message.text}</p>}
        <button type="submit" disabled={busy} className="rounded-lg bg-sage text-white px-4 py-2 font-semibold text-sm hover:bg-sageDeep transition-colors disabled:opacity-60">
          {busy ? "Making..." : "Make the questionnaires"}
        </button>
      </form>

      <div className="rounded-xl p-4 mt-6 bg-card border border-line">
        <p className="text-sm font-semibold">See what the PDF looks like</p>
        <p className="text-xs text-inkSoft mt-0.5 mb-2">Opens a PDF made by the real code, so you can check the layout before anyone sends a response.</p>
        <div className="space-y-1.5">
          {TEMPLATES.map((t) => (
            <p key={t.key} className="text-sm">
              {t.label}:{" "}
              <a href={`/api/admin/forms/preview?template=${t.key}`} target="_blank" rel="noreferrer" className="text-sageDeep font-semibold underline">
                blank
              </a>{" "}
              ·{" "}
              <a href={`/api/admin/forms/preview?template=${t.key}&sample=1`} target="_blank" rel="noreferrer" className="text-sageDeep font-semibold underline">
                with example answers
              </a>
            </p>
          ))}
        </div>
      </div>

      <h2 className="font-serif text-xl mt-8 mb-3">Existing questionnaires</h2>
      {forms === null && <p className="text-sm text-inkSoft">Loading...</p>}
      {forms?.length === 0 && <p className="text-sm text-inkSoft">None yet.</p>}
      <div className="space-y-3">
        {forms?.map((f) => (
          <div key={f.id} className="rounded-xl p-4 bg-card border border-line">
            <p className="text-sm font-semibold">{f.title}</p>
            <p className="text-xs text-inkSoft mt-0.5">
              Account: {f.user.email} · answers go to {f.notifyEmail}
            </p>
            <input readOnly value={urlFor(f.token)} onFocus={(e) => e.currentTarget.select()} className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs bg-white mt-2" aria-label="Link" />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs font-semibold">
              <button type="button" onClick={() => copy(f.token)} className="text-sageDeep underline">
                {copied === f.token ? "Copied" : "Copy link"}
              </button>
              <QrCodeButton url={urlFor(f.token)} title={f.title} className="text-sageDeep underline" />
              <a href={`/q/${f.token}`} target="_blank" rel="noreferrer" className="text-sageDeep">Open</a>
              <button type="button" onClick={() => remove(f)} className="text-red-600 underline ml-auto">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
