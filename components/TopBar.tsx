"use client";

import { Search, Bell, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function TopBar({ userName }: { userName: string }) {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-1.5 bg-topbar">
        <span className="text-[11px] text-[#D8D3C4]">Signed in as {userName}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-1 text-[11px] text-[#D8D3C4] hover:text-white"
        >
          <LogOut size={12} /> Log out
        </button>
      </div>
      <div className="flex items-center gap-4 px-6 py-4">
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 bg-card border border-line">
          <Search size={15} className="text-inkSoft" />
          <input
            placeholder="Search across all templates"
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
