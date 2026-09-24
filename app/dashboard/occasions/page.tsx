import Link from "next/link";
import { CATEGORIES } from "@/lib/data";
import {
  Grid3x3, Search, HelpCircle, Brain, Hash, Dices, Heart,
  Palette, MessageCircle, Copy, Eye,
} from "lucide-react";

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

// Categories that don't get themed/seasonal variants — routine or
// reference-style content rather than one-off occasion packs — so they're
// left out of the calendar's "browse by occasion" link, even though they
// still show up everywhere else (sidebar, dashboard home, etc).
const EXCLUDED_CATEGORIES = new Set([
  "Physical & Exercise",
  "Sing-Alongs",
  "Communication Cards",
  "BSL Tools",
]);

const THEMEABLE_CATEGORIES = CATEGORIES.filter((c) => !EXCLUDED_CATEGORIES.has(c.key));

export default function OccasionsPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl mb-1">Browse by category</h1>
      <p className="text-sm text-inkSoft mb-6 max-w-[560px]">
        Reached from an event on the calendar. Pick a category below to see what's
        there already, or to upload an occasion-themed pack for that date.
      </p>

      <div className="rounded-xl p-4 bg-card border border-line">
        <div className="grid grid-cols-3 gap-3">
          {THEMEABLE_CATEGORIES.map((c) => {
            const Icon = ICONS[c.key];
            return (
              <Link
                key={c.slug}
                href={`/dashboard/${c.slug}`}
                className="flex items-center gap-2 rounded-lg p-3"
                style={{ background: c.tint }}
              >
                {Icon && <Icon size={16} color={c.color} />}
                <span className="text-sm font-semibold">{c.key}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
