"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Footprints, Grid3x3, Grid2x2, Search, HelpCircle, Brain, Hash,
  Dices, Heart, Palette, MessageCircle, Copy, Eye, Music, Languages, Hand,
  Briefcase, Calendar, CalendarDays, Shield, Menu, X,
} from "lucide-react";
import { CATEGORIES } from "@/lib/data";

const ICONS: Record<string, any> = {
  "Physical & Exercise": Footprints,
  Crosswords: Grid3x3,
  "Word Searches": Search,
  "Guess the Word": HelpCircle,
  Trivia: Brain,
  Bingo: Hash,
  "Snakes and Ladders": Dices,
  "Remembrance Cards": Heart,
  "Colouring Pages": Palette,
  "Conversation Starters": MessageCircle,
  "Matching Pairs": Copy,
  "Spot the Difference": Eye,
  "Sing-Alongs": Music,
  "Communication Cards": Languages,
  "BSL Tools": Hand,
  Sudoku: Grid2x2,
};

// One colour per nav item, used only on hover
const HOVER_COLORS: Record<string, string> = {
  Dashboard: "#6E8F73",
  Calendar: "#3E6E96",
  "Physical & Exercise": "#B5714A",
  Crosswords: "#A6822C",
  "Word Searches": "#3E8A8F",
  "Guess the Word": "#8B6FB0",
  Trivia: "#3E7CAA",
  Bingo: "#B05F6C",
  "Snakes and Ladders": "#5A8A44",
  "Remembrance Cards": "#4A5E7A",
  "Colouring Pages": "#A6741F",
  "Conversation Starters": "#5A8A44",
  "Matching Pairs": "#B5714A",
  "Spot the Difference": "#6E56A0",
  "Sing-Alongs": "#2F7A63",
  "Communication Cards": "#A23B3B",
  "BSL Tools": "#3E6E4A",
  Services: "#8A6E52",
  Admin: "#8A3B3B",
};

function NavItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: any;
  label: string;
  active: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const hoverColor = HOVER_COLORS[label] || "#6E8F73";
  const showColor = active || hovered;

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors"
      style={{
        backgroundColor: showColor ? `${hoverColor}1A` : "transparent",
        color: showColor ? hoverColor : "#3F3237",
        fontWeight: active ? 600 : 500,
      }}
    >
      <Icon size={17} style={{ color: showColor ? hoverColor : "#8A7A6B" }} />
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar({
  isAdmin = false,
  professionalCalendar = false,
}: {
  isAdmin?: boolean;
  // Only for accounts with the professional calendar switched on.
  professionalCalendar?: boolean;
}) {
  const pathname = usePathname();
  // Phones: the menu is hidden behind a Menu button and slides in over the
  // page; it closes again when a page is chosen.
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const contents = (
    <>
      <Link href="/dashboard" className="flex items-center gap-2 mb-6 px-1">
        <Image src="/activity-central-icon.png" alt="Activity Central" width={60} height={60} />
        <span className="font-serif text-lg">Activity Central</span>
      </Link>

      <div className="space-y-0.5">
        <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" active={pathname === "/dashboard"} />
        <NavItem href="/calendar" icon={Calendar} label="Calendar" active={pathname === "/calendar"} />
        {professionalCalendar && (
          <NavItem
            href="/professional-calendar"
            icon={CalendarDays}
            label="Professional Calendar"
            active={pathname === "/professional-calendar"}
          />
        )}
        {CATEGORIES.map((c: any) => (
          <NavItem
            key={c.slug}
            href={`/dashboard/${c.slug}`}
            icon={ICONS[c.key]}
            label={c.key}
            active={pathname === `/dashboard/${c.slug}` || pathname.startsWith(`/dashboard/${c.slug}/`)}
          />
        ))}
        <div className="border-t border-line my-2.5" />
        <NavItem
          href="/dashboard/services"
          icon={Briefcase}
          label="Services"
          active={pathname === "/dashboard/services"}
        />
      </div>

      {isAdmin && (
        <div className="mt-auto pt-2.5">
          <div className="border-t border-line mb-2.5" />
          <NavItem
            href="/dashboard/admin/upload"
            icon={Shield}
            label="Admin"
            active={pathname === "/dashboard/admin/upload"}
          />
        </div>
      )}
    </>
  );

  return (
    <>
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-2 bg-bg border-b border-line">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/activity-central-icon.png" alt="Activity Central" width={36} height={36} />
          <span className="font-serif text-base">Activity Central</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold bg-card border border-line"
          aria-label="Open menu"
        >
          <Menu size={16} /> Menu
        </button>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 max-w-[85%] bg-bg overflow-y-auto px-4 py-5 flex flex-col shadow-xl">
            <button
              onClick={() => setOpen(false)}
              className="self-end rounded-lg p-1.5 text-inkSoft hover:bg-card"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            {contents}
          </aside>
        </div>
      )}

      <aside className="hidden md:flex w-56 shrink-0 px-4 py-5 border-r border-line min-h-screen flex-col">
        {contents}
      </aside>
    </>
  );
}
