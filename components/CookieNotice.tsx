"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "ac-cookie-notice-dismissed";

export default function CookieNotice() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // localStorage unavailable (e.g. blocked) — just show the notice.
      setDismissed(false);
    }
  }, []);

  if (dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Ignore — the notice will just reappear next visit.
    }
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-line bg-card px-4 sm:px-6 py-3.5">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-sm text-inkSoft">
        <p className="flex-1 text-center sm:text-left">
          We use a couple of essential cookies to keep you signed in and take payments securely.
          No advertising or tracking cookies.{" "}
          <Link href="/cookies" className="text-sageDeep underline">
            Learn more
          </Link>
        </p>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-lg bg-sage text-white px-5 py-2 text-sm font-semibold hover:bg-sageDeep transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
}
