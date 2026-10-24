"use client";

import { useEffect } from "react";
import Link from "next/link";

// Failure inside the dashboard: the menu stays on screen and only the page area shows this message.
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Dashboard error", error.digest ?? "", error.message);
  }, [error]);
  return (
    <div className="max-w-xl py-12">
      <h1 className="font-serif text-2xl mb-2">That page did not load</h1>
      <p className="text-inkSoft mb-6">Something went wrong on our side. Please try again. If it keeps happening, tell us at support@activitycentral.co.uk.</p>
      <div className="flex flex-wrap gap-3">
        <button onClick={() => reset()} className="rounded-xl bg-sage text-white px-5 py-2.5 font-semibold hover:bg-sageDeep transition-colors">
          Try again
        </button>
        <Link href="/dashboard" className="rounded-xl bg-cardTint px-5 py-2.5 font-semibold">
          Back to dashboard
        </Link>
      </div>
      {error.digest && <p className="text-xs text-inkSoft mt-6">Reference: {error.digest}</p>}
    </div>
  );
}
