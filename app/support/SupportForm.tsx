"use client";

import { useState } from "react";

export default function SupportForm({ defaultName, defaultEmail }: { defaultName: string; defaultEmail: string }) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message, website }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please email support@activitycentral.co.uk instead.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-line bg-card p-7">
        <h2 className="font-serif text-xl mb-2">Message sent, thank you</h2>
        <p className="text-inkSoft text-sm">
          We'll reply to <b>{email}</b>, usually within one working day. Please check your junk folder if you don't
          see our answer.
        </p>
      </div>
    );
  }

  const field = "w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sage bg-white";
  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-card p-7 space-y-4">
      <div>
        <label htmlFor="name" className="block text-xs font-semibold text-inkSoft mb-1">Your name</label>
        <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className={field} />
      </div>
      <div>
        <label htmlFor="email" className="block text-xs font-semibold text-inkSoft mb-1">Your email</label>
        <input id="email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
      </div>
      <div>
        <label htmlFor="message" className="block text-xs font-semibold text-inkSoft mb-1">How can we help?</label>
        <textarea
          id="message"
          required
          rows={6}
          minLength={10}
          maxLength={3000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={field}
        />
      </div>
      {/* Hidden from people; bots fill it in. */}
      <div className="hidden" aria-hidden="true">
        <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-sage text-white py-2.5 font-semibold text-sm hover:bg-sageDeep transition-colors disabled:opacity-60"
      >
        {loading ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
