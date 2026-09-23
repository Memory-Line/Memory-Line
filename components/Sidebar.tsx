"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Footprints, Grid3x3, Search, HelpCircle, Brain, Hash,
  Dices, Heart, Palette, MessageCircle, Copy, Eye, Music, Languages, Hand,
  Briefcase, Calendar, Shield,
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

export default function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 px-4 py-5 border-r border-line min-h-screen flex flex-col">
      <Link href="/dashboard" className="flex items-center gap-2 mb-6 px-1">
        <Image src="/activity-central-icon.png" alt="Activity Central" width={60} height={60} />
        <span className="font-serif text-lg">Activity Central</span>
      </Link>

      <div className="space-y-0.5">
        <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" active={pathname === "/dashboard"} />
        <NavItem href="/calendar" icon={Calendar} label="Calendar" active={pathname === "/calendar"} />
        {CATEGORIES.map((c: any) => (
          <NavItem
            key={c.slug}
            href={`/dashboard/${c.slug}`}
            icon={ICONS[c.key]}
            label={c.key}
            active={pathname === `/dashboard/${c.slug}`}
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
    </aside>
  );
}
