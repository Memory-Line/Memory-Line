"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function TopBar({
  userName,
  isAdmin,
  previewPlan,
}: {
  userName: string;
  isAdmin?: boolean;
  previewPlan?: "standard" | "premium" | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setPreview(plan: "standard" | "premium" | null) {
    setLoading(true);
    await fetch("/api/admin/preview-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <>
      {isAdmin && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-clay text-white text-[11px]">
          <span className="font-semibold">Admin preview:</span>
          <select
            value={previewPlan ?? "real"}
            disabled={loading}
            onChange={(e) => setPreview(e.target.value === "real" ? null : (e.target.value as "standard" | "premium"))}
            className="rounded px-2 py-0.5 text-ink text-[11px]"
          >
            <option value="real">Your real access (everything)</option>
            <option value="standard">See as Standard</option>
            <option value="premium">See as Premium</option>
          </select>
          {previewPlan && <span className="opacity-90">— previewing, doesn't change your real account</span>}
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-1.5 bg-topbar">
        <span className="text-[11px] text-[#D8D3C4] truncate mr-3">Signed in as {userName}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-1 text-[11px] text-[#D8D3C4] hover:text-white"
        >
          <LogOut size={12} /> Log out
        </button>
      </div>
      <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 bg-card border border-line">
          <Search size={15} className="text-inkSoft" />
          <input
            placeholder="Search across all activities"
            className="flex-1 outline-none bg-transparent text-sm"
          />
        </div>
        <button className="rounded-full p-2 bg-card border border-line">
          <Bell size={15} className="text-inkSoft" />
        </button>
      </div>
    </>
  );
}
