import Link from "next/link";
import type { ActiveSeason } from "@/lib/seasonDb";

// The big dressed-up band at the top of the home page (and a slim one on the
// dashboard) while a seasonal look is on.
export default function SeasonHero({ active, cta, compact = false }: { active: ActiveSeason; cta?: { href: string; label: string }; compact?: boolean }) {
  const { season } = active;
  const icons = season.icons.slice(0, 5);
  return (
    <section
      className={`cal-no-print rounded-2xl text-center ${compact ? "px-5 py-5 mt-4" : "px-5 py-10 sm:py-14 mx-auto max-w-5xl mt-4"}`}
      style={{ background: season.band.bg, color: season.band.text }}
    >
      <div className="flex items-center justify-center gap-3 sm:gap-5 mb-3">
        {icons.map((n, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={`/season/${n}.svg`} alt="" width={compact ? 34 : 46} height={compact ? 34 : 46} />
        ))}
      </div>
      <h2 className={`font-serif ${compact ? "text-xl" : "text-3xl sm:text-4xl"} leading-tight`} style={{ color: season.band.heading }}>
        {season.heroTitle}
      </h2>
      <p className={`${compact ? "text-sm mt-1" : "text-base sm:text-lg mt-3"} max-w-xl mx-auto`}>{season.heroText}</p>
      {cta && (
        <Link
          href={cta.href}
          className="inline-block mt-5 rounded-xl px-6 py-3 font-semibold text-white"
          style={{ background: season.band.accent, border: `2px solid ${season.band.heading}` }}
        >
          {cta.label}
        </Link>
      )}
    </section>
  );
}
