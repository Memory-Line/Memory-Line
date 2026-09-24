import Link from "next/link";
import { OCCASIONS } from "@/lib/occasions";

export default function OccasionsPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl mb-1">Occasions</h1>
      <p className="text-sm text-inkSoft mb-6 max-w-[560px]">
        Themed activities for each date on the calendar. These are kept separate from the
        regular activity library.
      </p>

      <div className="rounded-xl p-4 bg-card border border-line">
        <div className="grid grid-cols-3 gap-3">
          {OCCASIONS.map((o) => (
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
