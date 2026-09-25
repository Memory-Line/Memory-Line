import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LEGACY_OCCASIONS, OCCASIONS } from "@/lib/occasions";

export const dynamic = "force-dynamic";

export default async function OccasionsPage() {
  // Old occasions the calendar no longer shows are listed only if they
  // have uploads.
  const withUploads = new Set(
    (
      await prisma.template.findMany({
        where: { occasion: { in: LEGACY_OCCASIONS.map((o) => o.slug) } },
        select: { occasion: true },
        distinct: ["occasion"],
      })
    ).map((t) => t.occasion)
  );
  const occasions = [...OCCASIONS, ...LEGACY_OCCASIONS.filter((o) => withUploads.has(o.slug))];

  return (
    <div>
      <h1 className="font-serif text-2xl mb-1">Occasions</h1>
      <p className="text-sm text-inkSoft mb-6 max-w-[560px]">
        Themed activities for each date on the calendar. These are kept separate from the
        regular activity library.
      </p>

      <div className="rounded-xl p-4 bg-card border border-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {occasions.map((o) => (
            <Link
              key={o.slug}
              href={`/dashboard/occasions/${o.slug}`}
              className="rounded-lg p-3 text-sm font-semibold bg-cardTint"
            >
              {o.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
