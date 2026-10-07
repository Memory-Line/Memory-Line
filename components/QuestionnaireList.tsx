"use client";

import { useState } from "react";
import QrCodeButton from "@/components/QrCodeButton";

type Row = { id: string; token: string; title: string; notifyEmail: string };

// The account's questionnaires: copy the link, make a QR code, or open the form.
export default function QuestionnaireList({ forms }: { forms: Row[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  const urlFor = (token: string) => `${window.location.origin}/q/${token}`;

  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(urlFor(token));
      setCopied(token);
    } catch {
      setCopied(null);
    }
  }

  if (forms.length === 0) {
    return <p className="mt-6 text-sm text-inkSoft">No questionnaires have been set up for your account yet.</p>;
  }

  return (
    <div className="space-y-3 mt-6">
      {forms.map((f) => (
        <div key={f.id} className="rounded-xl p-4 bg-card border border-line">
          <p className="text-sm font-semibold">{f.title}</p>
          <p className="text-xs text-inkSoft mt-0.5">Answers are emailed to {f.notifyEmail}.</p>
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
            <QrCodeButton url={urlFor(f.token)} title={f.title} className="text-sageDeep underline" />
            <a href={`/q/${f.token}`} target="_blank" rel="noreferrer" className="text-sageDeep">Open</a>
          </div>
        </div>
      ))}
    </div>
  );
}
