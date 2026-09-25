"use client";

import { useState } from "react";
import { Check } from "lucide-react";

// "Mark as completed" / "✓ Completed" toggle for accounts with completion
// tracking. Refreshes nothing else on the page; the progress count updates
// on the next visit.
export default function CompleteButton({
  templateId,
  initiallyCompleted,
}: {
  templateId: string;
  initiallyCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const next = !completed;
    try {
      const res = await fetch("/api/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, completed: next }),
      });
      if (res.ok) setCompleted(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={completed ? "Click to mark as not completed" : "Mark this activity as completed"}
      className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
      style={
        completed
          ? { background: "#2F7A63", color: "#fff" }
          : { background: "#fff", color: "#2F7A63", border: "1px solid #2F7A63" }
      }
    >
      {completed ? <><Check size={14} /> Completed</> : "Mark as completed"}
    </button>
  );
}
