"use client";

import { useEffect } from "react";
import Link from "next/link";

// Shown when a page fails to load. The visitor sees a calm message and a way forward, never a blank screen.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Page error", error.digest ?? "", error.message);
  }, [error]);
  return (
    <div className="max-w-xl mx-auto px-5 py-20 text-center">
      <h1 className="font-serif text-3xl mb-3">That did not load</h1>
      <p className="text-inkSoft mb-8">Something went wrong on our side. It is not your fault. Please try again, and if it keeps happening, tell us at support@activitycentral.co.uk.</p>
      <div className="flex flex-wrap gap-3 justify-center">
        <button onClick={() => reset()} className="rounded-xl bg-sage text-white px-6 py-3 font-semibold hover:bg-sageDeep transition-colors">
          Try again
        </button>
        <Link href="/" className="rounded-xl bg-cardTint px-6 py-3 font-semibold">
          Go to the home page
        </Link>
      </div>
      {error.digest && <p className="text-xs text-inkSoft mt-8">Reference: {error.digest}</p>}
    </div>
  );
}
