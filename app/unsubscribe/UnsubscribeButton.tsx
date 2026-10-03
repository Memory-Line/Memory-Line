"use client";

import { useState } from "react";

export default function UnsubscribeButton({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please write to support@activitycentral.co.uk and we'll remove you.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <>
        <h1 className="font-serif text-2xl mb-2">You're unsubscribed</h1>
        <p className="text-inkSoft text-sm">
          We won't send you any more updates. You'll still get emails about your account, such as password resets and
          payment confirmations.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="font-serif text-2xl mb-2">Unsubscribe from updates?</h1>
      <p className="text-inkSoft text-sm mb-5">
        You'll stop getting news and offers from Activity Central. Emails about your account will carry on.
      </p>
      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full rounded-lg bg-sage text-white py-2.5 font-semibold text-sm hover:bg-sageDeep transition-colors disabled:opacity-60"
      >
        {loading ? "Unsubscribing..." : "Yes, unsubscribe me"}
      </button>
    </>
  );
}
