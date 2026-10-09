"use client";

import { useState } from "react";

// Sends an idea to the support inbox, marked as a suggestion. Name and email
// come from the logged-in account so nobody has to retype them.
export default function SuggestionForm({ defaultName, defaultEmail }: { defaultName: string; defaultEmail: string }) {
  const [message, setMessage] = useState("");
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
      body: JSON.stringify({ name: defaultName || defaultEmail, email: defaultEmail, message, kind: "suggestion" }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please email support@activitycentral.co.uk instead.");
      return;
    }
    setSent(true);
    setMessage("");
  }

  if (sent) {
    return (
      <div className="rounded-xl p-4 bg-card border border-line text-sm">
        <p className="font-semibold">Thank you, we've got your suggestion.</p>
        <button onClick={() => setSent(false)} className="text-xs text-sageDeep font-semibold mt-2">
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl p-4 bg-card border border-line space-y-3">
      <textarea
        required
        rows={4}
        minLength={10}
        maxLength={3000}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="My suggestion is..."
        className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sage bg-white"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-sage text-white px-4 py-2 font-semibold text-sm hover:bg-sageDeep transition-colors disabled:opacity-60"
      >
        {loading ? "Sending..." : "Send suggestion"}
      </button>
    </form>
  );
}
