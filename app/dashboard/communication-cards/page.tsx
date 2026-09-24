import Link from "next/link";
import { Languages } from "lucide-react";
import { categoryBySlug } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { LANGUAGE_CATEGORY, LANGUAGES } from "@/lib/languages";

export const dynamic = "force-dynamic";

// Communication Cards are split by language: pick one first, then see its
// cards. (This static route takes over from /dashboard/[category] here.)
export default async function CommunicationCardsPage() {
  const category = categoryBySlug("communication-cards")!;

  const counts = await prisma.template.groupBy({
    by: ["language"],
    where: { category: LANGUAGE_CATEGORY, occasion: null },
    _count: { _all: true },
  });
  const countFor = (slug: string) => counts.find((c) => c.language === slug)?._count._all ?? 0;

  return (
    <div>
      <h1 className="font-serif text-[26px]">{LANGUAGE_CATEGORY}</h1>
      <p className="text-clay text-[13px] mt-0.5 mb-5">
        Choose a language. Each edition prints English beside the translation.
      </p>

      <div className="rounded-xl p-4 bg-card border border-line">
        <div className="grid grid-cols-3 gap-3">
          {LANGUAGES.map((l) => (
            <Link
              key={l.slug}
              href={`/dashboard/communication-cards/${l.slug}`}
              className="flex items-center gap-2 rounded-lg p-3"
              style={{ background: category.tint }}
            >
              <Languages size={16} color={category.color} />
              <span className="text-sm font-semibold">{l.label}</span>
              <span className="ml-auto text-xs text-inkSoft">{countFor(l.slug)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
