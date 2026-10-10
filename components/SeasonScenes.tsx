import type { CSSProperties } from "react";
import type { ActiveSeason } from "@/lib/seasonDb";

const scene = (art: string, part: string) => `/season/scenes/${art}-${part}.svg`;

// Same numbers every time, so the falling items are laid out the same on the server and
// in the browser.
function pseudo(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// The sky strip across the top of every page while a look is on: the message, the drawn
// sky, and artwork that drifts slowly across (a sleigh, bats, planes, doves, butterflies).
export function SeasonSky({ active }: { active: ActiveSeason }) {
  const { season, banner } = active;
  const art = season.art;
  return (
    <div
      className="season-sky cal-no-print relative overflow-hidden"
      role="note"
      aria-label={`${season.label} message`}
      style={{ background: `linear-gradient(${season.sky.top}, ${season.sky.mid} 62%, rgb(var(--c-bg)))` }}
    >
      {season.bunting && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[44px]"
          style={{ backgroundImage: `url(${scene(art, "bunting")})`, backgroundRepeat: "repeat-x", backgroundSize: "auto 44px" }}
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img aria-hidden="true" alt="" src={scene(art, "sky")} className="season-sky-art absolute right-[3%] top-0 h-[130px] w-auto max-w-none" />
      <div
        aria-hidden="true"
        className="season-mover absolute left-0"
        style={{ top: season.mover.top, height: season.mover.height, "--drift": `${season.mover.seconds}s` } as CSSProperties}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src={scene(art, "mover")} style={{ height: "100%", width: "auto", maxWidth: "none" }} />
      </div>
      <p className="relative z-10 px-3 pt-2.5 text-center text-[14px] sm:text-[15px] font-bold" style={{ color: season.sky.text }}>
        {banner}
      </p>
      <div className="h-[104px] sm:h-[124px]" />
    </div>
  );
}

// The scene along the bottom of every page: scenery that repeats across the width, and one
// feature (the snowman, the haunted house, the flags...) in the middle.
export function SeasonGround({ active }: { active: ActiveSeason }) {
  const art = active.season.art;
  return (
    <div className="season-ground cal-no-print relative mt-auto w-full overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{ backgroundImage: `url(${scene(art, "filler")})`, backgroundRepeat: "repeat-x", backgroundPosition: "center bottom", backgroundSize: "auto 100%" }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" src={scene(art, "feature")} className="absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2" />
    </div>
  );
}

// Gentle falling snow, leaves, streamers, petals or blossom over the whole page. They don't
// block clicks, and they stand still (and are hidden) for anyone who has asked their
// device to reduce motion.
export function SeasonFalling({ active }: { active: ActiveSeason }) {
  const { falling } = active.season;
  const items = Array.from({ length: falling.count }, (_, i) => {
    const size = Math.round(falling.min + pseudo(i, 1) * (falling.max - falling.min));
    return {
      left: `${(pseudo(i, 2) * 100).toFixed(1)}%`,
      delay: `${(-pseudo(i, 3) * 26).toFixed(1)}s`,
      duration: `${(16 + pseudo(i, 4) * 16).toFixed(1)}s`,
      sway: `${Math.round((pseudo(i, 5) - 0.5) * 160)}px`,
      rot: `${Math.round((pseudo(i, 6) - 0.5) * 540)}deg`,
      size,
      opacity: (0.55 + pseudo(i, 7) * 0.35).toFixed(2),
      colour: ["#C8102E", "#FFFFFF", "#2F5BD0"][i % 3],
    };
  });
  return (
    <div className="season-fall cal-no-print" aria-hidden="true">
      {items.map((it, i) => {
        const style = {
          left: it.left,
          width: falling.kind === "confetti" ? Math.max(4, Math.round(it.size / 3)) : it.size,
          height: falling.kind === "confetti" ? it.size : it.size,
          opacity: it.opacity,
          animationDelay: it.delay,
          animationDuration: it.duration,
          "--sway": it.sway,
          "--rot": it.rot,
        } as CSSProperties;
        return falling.kind === "confetti" ? (
          <span key={i} style={{ ...style, background: it.colour, borderRadius: 2 }} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} alt="" src={falling.src} style={style} />
        );
      })}
    </div>
  );
}
