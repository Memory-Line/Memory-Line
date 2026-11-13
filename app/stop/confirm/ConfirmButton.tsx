"use client";

import { useState } from "react";

export default function ConfirmButton({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/stop/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
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
          Your address is on our do-not-contact list. Sorry to have bothered you. If you ever change your mind, you can find us at
          activitycentral.co.uk.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="font-serif text-2xl mb-2">Stop emails from Activity Central?</h1>
      <p className="text-inkSoft text-sm mb-5">Press the button to confirm. We&apos;ll add your address to our do-not-contact list.</p>
      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full rounded-lg bg-sage text-white py-2.5 font-semibold text-sm hover:bg-sageDeep transition-colors disabled:opacity-60"
      >
        {loading ? "Stopping..." : "Yes, stop emailing me"}
      </button>
    </>
  );
}
