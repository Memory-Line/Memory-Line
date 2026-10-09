"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Campaign = { id: string; subject: string; createdAt: string; sent: number };

const DRAFT = {
  subject: "New on Activity Central: Newsletters",
  message:
    "Hello,\n\nWe have added a new category to Activity Central: Newsletters. You will find it in the menu on the left once you are logged in.\n\nIt is there for you to use with your residents, families and team, and we will keep adding to it.\n\nThank you for being part of Activity Central.",
  buttonLabel: "Open Newsletters",
  buttonUrl: "https://activitycentral.co.uk/dashboard/newsletters",
};

// Writing and sending an email to the mailing list. Nothing is sent until a
// button here is pressed: "Send me a test" goes only to the admin's own address,
// and "Send to the list" asks for a final confirmation first.
export default function SendEmailForm({ subscribed, campaigns }: { subscribed: number; campaigns: Campaign[] }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [buttonLabel, setButtonLabel] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [tested, setTested] = useState<string | null>(null); // the exact email that was test-sent

  const signature = JSON.stringify([subject, message, buttonLabel, buttonUrl]);

  async function call(payload: Record<string, unknown>) {
    const res = await fetch("/api/admin/mailing-list/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    return { ok: !!res?.ok, data: data ?? {} };
  }

  async function test() {
    setBusy("test");
    setNote(null);
    const { ok, data } = await call({ action: "test", subject, message, buttonLabel, buttonUrl });
    setBusy(null);
    if (!ok) return setNote({ ok: false, text: data.error ?? "That didn't work." });
    setTested(signature);
    setNote({ ok: true, text: `A test copy was sent to ${data.sentTo}. Check how it looks, then you can send it to the list.` });
  }

  async function start() {
    if (tested !== signature) return setNote({ ok: false, text: "Send yourself a test of this exact email first." });
    if (!window.confirm(`Send "${subject}" to the people on the mailing list now? Up to 90 people get it each time you press send. This can't be undone.`)) return;
    setBusy("start");
    setNote(null);
    const { ok, data } = await call({ action: "start", subject, message, buttonLabel, buttonUrl });
    setBusy(null);
    if (!ok) return setNote({ ok: false, text: data.error ?? "That didn't work." });
    setNote({ ok: true, text: `Sent to ${data.sent} people${data.failed ? `, ${data.failed} failed` : ""}. ${data.remaining} still waiting.` });
    router.refresh();
  }

  async function next(c: Campaign) {
    if (!window.confirm(`Send the next batch of "${c.subject}" now? Up to 90 more people get it.`)) return;
    setBusy(c.id);
    setNote(null);
    const { ok, data } = await call({ action: "next", campaignId: c.id });
    setBusy(null);
    if (!ok) return setNote({ ok: false, text: data.error ?? "That didn't work." });
    setNote({ ok: true, text: `Sent to ${data.sent} more people${data.failed ? `, ${data.failed} failed` : ""}. ${data.remaining} still waiting.` });
    router.refresh();
  }

  const field = "w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sage bg-white";

  return (
    <div className="mt-6 rounded-xl border border-line bg-card p-4">
      <p className="text-sm font-semibold">Email the list</p>
      <p className="text-[13px] text-inkSoft mb-3">
        Write an email, send yourself a test, then send it to everyone who is subscribed ({subscribed} people). Nothing is
        sent until you press a button. Each email carries an unsubscribe link, and nobody gets the same email twice.
      </p>
      <button
        type="button"
        onClick={() => {
          setSubject(DRAFT.subject);
          setMessage(DRAFT.message);
          setButtonLabel(DRAFT.buttonLabel);
          setButtonUrl(DRAFT.buttonUrl);
          setNote(null);
          setTested(null);
        }}
        className="text-xs font-semibold text-sageDeep underline mb-3"
      >
        Fill in the Newsletters announcement (a draft you can change)
      </button>
      <div className="space-y-2.5">
        <input className={field} value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} placeholder="Subject" aria-label="Subject" />
        <textarea
          className={field}
          rows={8}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={5000}
          placeholder="Your message. Leave a blank line between paragraphs."
          aria-label="Message"
        />
        <div className="grid sm:grid-cols-2 gap-2">
          <input className={field} value={buttonLabel} onChange={(e) => setButtonLabel(e.target.value)} maxLength={60} placeholder="Button words (optional)" aria-label="Button words" />
          <input className={field} value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} maxLength={300} placeholder="Button web address, starting https://" aria-label="Button address" />
        </div>
      </div>
      {note && <p className={`text-xs mt-2 ${note.ok ? "text-sageDeep" : "text-red-600"}`}>{note.text}</p>}
      <div className="flex flex-wrap gap-2 mt-3">
        <button
          type="button"
          onClick={test}
          disabled={!!busy || !subject.trim() || !message.trim()}
          className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-sageDeep hover:bg-cardTint disabled:opacity-60"
        >
          {busy === "test" ? "Sending test..." : "Send me a test"}
        </button>
        <button
          type="button"
          onClick={start}
          disabled={!!busy || tested !== signature}
          className="rounded-lg bg-sage text-white px-4 py-2 text-sm font-semibold hover:bg-sageDeep transition-colors disabled:opacity-60"
        >
          {busy === "start" ? "Sending..." : "Send to the list"}
        </button>
      </div>
      {tested !== signature && subject.trim() && message.trim() && (
        <p className="text-[12px] text-inkSoft mt-1.5">"Send to the list" switches on after you send yourself a test of this exact email.</p>
      )}

      {campaigns.length > 0 && (
        <div className="mt-5 border-t border-line pt-3">
          <p className="text-xs font-semibold text-inkSoft mb-2">Emails already sent</p>
          <div className="space-y-2">
            {campaigns.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-semibold">{c.subject}</span>
                <span className="text-inkSoft text-xs">
                  {new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · sent to {c.sent} of {subscribed}
                </span>
                {c.sent < subscribed && (
                  <button
                    type="button"
                    onClick={() => next(c)}
                    disabled={!!busy}
                    className="text-xs font-semibold text-sageDeep underline disabled:opacity-60"
                  >
                    {busy === c.id ? "Sending..." : "Send next batch"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
