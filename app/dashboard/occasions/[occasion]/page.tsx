import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Grid3x3, Search, HelpCircle, Brain, Hash, Dices, Heart,
  Palette, MessageCircle, Copy, Eye,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { occasionBySlug, THEMEABLE_CATEGORIES } from "@/lib/occasions";

const ICONS: Record<string, any> = {
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
};

export const dynamic = "force-dynamic";

export default async function OccasionPage({ params }: { params: { occasion: string } }) {
  const occasion = occasionBySlug(params.occasion);
  if (!occasion) notFound();

  const counts = await prisma.template.groupBy({
    by: ["category"],
    where: { occasion: occasion.slug },
    _count: { _all: true },
  });
  const countFor = (key: string) => counts.find((c) => c.category === key)?._count._all ?? 0;

  return (
    <div>
      <Link href="/dashboard/occasions" className="text-xs text-inkSoft">
        ← All occasions
      </Link>
      <h1 className="font-serif text-2xl mt-1 mb-1">{occasion.label}</h1>
      <p className="text-sm text-inkSoft mb-6 max-w-[560px]">
        Activities made for {occasion.label}. These are separate from the regular activity
        library. Pick a category to see what's there.
      </p>

      <div className="rounded-xl p-4 bg-card border border-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {THEMEABLE_CATEGORIES.map((c) => {
            const Icon = ICONS[c.key];
            const count = countFor(c.key);
            return (
              <Link
                key={c.slug}
                href={`/dashboard/occasions/${occasion.slug}/${c.slug}`}
                className="flex items-center gap-2 rounded-lg p-3"
                style={{ background: c.tint }}
              >
                {Icon && <Icon size={16} color={c.color} />}
                <span className="text-sm font-semibold">{c.key}</span>
                <span className="ml-auto text-xs text-inkSoft">{count}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
