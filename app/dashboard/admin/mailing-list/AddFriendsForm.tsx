"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Person = { email: string; name: string | null };

// Free-access accounts that aren't on the list yet. The owner ticks the ones
// who have said yes in person, and they're added with that noted as the source.
export default function AddFriendsForm({ people }: { people: Person[] }) {
  const router = useRouter();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function toggle(email: string) {
    const next = new Set(picked);
    if (next.has(email)) next.delete(email);
    else next.add(email);
    setPicked(next);
  }

  async function add() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/admin/mailing-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails: Array.from(picked) }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ?? "Something went wrong.");
      return;
    }
    setPicked(new Set());
    router.refresh();
  }

  return (
    <div className="mt-6 rounded-xl border border-line bg-card p-4">
      <p className="text-sm font-semibold">Friends with free access</p>
      <p className="text-[13px] text-inkSoft mb-3">
        Tick the people who have told you they're happy to get emails from you, then add them. Only tick people who
        have really said yes, and keep a message from them as proof.
      </p>
      <div className="space-y-1.5">
        {people.map((p) => (
          <label key={p.email} className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={picked.has(p.email)} onChange={() => toggle(p.email)} />
            <span>
              {p.name ? `${p.name} ` : ""}
              <span className="text-inkSoft">{p.email}</span>
            </span>
          </label>
        ))}
      </div>
      {message && <p className="text-xs text-red-600 mt-2">{message}</p>}
      <button
        onClick={add}
        disabled={saving || picked.size === 0}
        className="mt-3 rounded-lg bg-sage text-white px-4 py-2 text-sm font-semibold hover:bg-sageDeep transition-colors disabled:opacity-50"
      >
        {saving ? "Adding..." : `Add ${picked.size || ""} to the list`.replace("  ", " ")}
      </button>
    </div>
  );
}
