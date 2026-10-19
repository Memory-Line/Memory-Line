"use client";

import { useState } from "react";

export default function StopForm({ prefill }: { prefill: string }) {
  const [email, setEmail] = useState(prefill);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please write to support@activitycentral.co.uk and we'll stop the emails.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <>
        <h1 className="font-serif text-2xl mb-2">Done. We won&apos;t email you again</h1>
        <p className="text-inkSoft text-sm">
          We&apos;ve added <b>{email.trim()}</b> to our do-not-contact list. Sorry to have bothered you. If you ever change your mind, you
          can find us at activitycentral.co.uk.
        </p>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="font-serif text-2xl mb-2">Stop emails from Activity Central</h1>
      <p className="text-inkSoft text-sm mb-5">
        Enter your email address and we&apos;ll add it to our do-not-contact list, so we don&apos;t email you again. It only takes a moment.
      </p>
      <label className="block text-xs font-semibold text-inkSoft mb-1" htmlFor="stop-email">Email address</label>
      <input
        id="stop-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="name@yourhome.co.uk"
        className="w-full rounded-lg border border-line px-3 py-2 text-sm mb-4 bg-white"
      />
      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-sage text-white py-2.5 font-semibold text-sm hover:bg-sageDeep transition-colors disabled:opacity-60"
      >
        {loading ? "Adding you..." : "Stop emailing me"}
      </button>
    </form>
  );
}
