import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LANGUAGE_CATEGORY, LANGUAGES, NATIVE_NAMES, RTL_LANGUAGES } from "@/lib/languages";

export const dynamic = "force-dynamic";

// Communication Cards are split by language: pick one first, then see its
// cards. (This static route takes over from /dashboard/[category] here.)
const CARD_COLOURS = ["#2F7A7C", "#A9741F", "#6A5A9A", "#3E6E96", "#4F7A45", "#A0507A"];

export default async function CommunicationCardsPage() {
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {LANGUAGES.map((l, i) => (
          <Link
            key={l.slug}
            href={`/dashboard/communication-cards/${l.slug}`}
            className="block rounded-2xl px-4 py-4 text-white"
            style={{ background: CARD_COLOURS[i % CARD_COLOURS.length] }}
          >
            <div
              className="font-serif text-[28px] leading-tight"
              dir={RTL_LANGUAGES.includes(l.slug) ? "rtl" : "ltr"}
              lang={undefined}
            >
              {NATIVE_NAMES[l.slug] ?? l.label}
            </div>
            <div className="text-sm mt-0.5">{l.label}</div>
            <div className="text-xs mt-3 opacity-90">{countFor(l.slug)} cards &nbsp;›</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
