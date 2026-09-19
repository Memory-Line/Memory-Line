"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Camera, Music, Footprints, Grid3x3, Type, HelpCircle,
  Gamepad2, MessageCircle, Gift, Leaf, Briefcase, Calendar,
} from "lucide-react";
import { CATEGORIES } from "@/lib/data";

const ICONS: Record<string, any> = {
  Reminiscence: Camera,
  "Sing-Along": Music,
  "Physical & Exercise": Footprints,
  "Arts & Crafts": Grid3x3,
  "Word Games": Type,
  "Trivia & Quizzes": HelpCircle,
  "Card & Board Games": Gamepad2,
  "Conversation Starters": MessageCircle,
  Christmas: Gift,
  "Four Seasons": Leaf,
};

// One colour per nav item, used only on hover
const HOVER_COLORS: Record<string, string> = {
  Dashboard: "#6E8F73",
  Calendar: "#3E6E96",
  Reminiscence: "#3E6E96",
  "Sing-Along": "#2F7A63",
  "Physical & Exercise": "#B5714A",
  "Arts & Crafts": "#6E56A0",
  "Word Games": "#A6822C",
  "Trivia & Quizzes": "#3E7CAA",
  "Card & Board Games": "#B05F6C",
  "Conversation Starters": "#5A8A44",
  Christmas: "#A23B3B",
  "Four Seasons": "#5A8A44",
  Services: "#8A6E52",
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

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 px-4 py-5 border-r border-line min-h-screen">
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
    </aside>
  );
}
