"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Camera, Sparkles, Music, Grid3x3, MessageCircle, Briefcase, Flower2,
} from "lucide-react";
import { CATEGORIES } from "@/lib/data";

const ICONS: Record<string, any> = {
  Reminiscence: Camera,
  Sensory: Sparkles,
  "Music & Movement": Music,
  "Arts & Crafts": Grid3x3,
  "Conversation & Games": MessageCircle,
};

function NavItem({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
        active ? "bg-cardTint font-semibold text-ink" : "text-ink font-medium hover:bg-cardTint/60"
      }`}
    >
      <Icon size={17} className={active ? "text-sageDeep" : "text-inkSoft"} />
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 px-4 py-5 border-r border-line min-h-screen">
      <Link href="/dashboard" className="flex items-center gap-2 mb-6 px-1">
        <Flower2 size={20} className="text-sageDeep" />
        <span className="font-serif text-lg">Memory-Line</span>
      </Link>

      <div className="space-y-0.5">
        <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" active={pathname === "/dashboard"} />
        {CATEGORIES.map((c) => (
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
