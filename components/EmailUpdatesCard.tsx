"use client";

import { useState } from "react";

// The account's own tick box for news and offers by email. Off unless the
// person turns it on; turning it off removes them straight away.
export default function EmailUpdatesCard({ initiallySubscribed }: { initiallySubscribed: boolean }) {
  const [subscribed, setSubscribed] = useState(initiallySubscribed);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle(next: boolean) {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/mailing-preference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscribe: next }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Couldn't save that. Please try again.");
      return;
    }
    setSubscribed(next);
  }

  return (
    <div className="rounded-xl p-4 bg-card border border-line">
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={subscribed}
          disabled={saving}
          onChange={(e) => toggle(e.target.checked)}
          className="mt-1"
        />
        <span>
          <span className="block text-sm font-semibold">Email me news, new activities and offers</span>
          <span className="block text-[13px] text-inkSoft">
            Only occasional updates. You can untick this at any time. Emails about your account and payments are
            sent either way.
          </span>
        </span>
      </label>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
