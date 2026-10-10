import type { ActiveSeason } from "@/lib/seasonDb";

const icon = (name: string, size: number) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={`/season/${name}.svg`} alt="" width={size} height={size} style={{ display: "block", width: size, height: size }} />
);

// Coloured string lights along the top (Christmas).
function Lights() {
  const cols = ["#E8383D", "#F5C84B", "#FFFFFF", "#5BC0EB"];
  const bulbs = Array.from({ length: 28 }, (_, i) => (
    <g key={i}>
      <rect x={i * 36 + 8} y={3} width={6} height={6} fill="#2A2A2A" />
      <circle cx={i * 36 + 11} cy={15 + (i % 2 ? 4 : 0)} r={6} fill={cols[i % cols.length]} />
    </g>
  ));
  return (
    <svg width="100%" height="30" viewBox="0 0 1008 30" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ display: "block" }}>
      <path d="M0 4 Q 72 12 144 4 T 288 4 T 432 4 T 576 4 T 720 4 T 864 4 T 1008 4" fill="none" stroke="#2A2A2A" strokeWidth="2" />
      {bulbs}
    </svg>
  );
}

// Red, white and blue bunting (VE Day).
function Bunting() {
  const cols = ["#B3262E", "#FFFFFF", "#1F3A5F"];
  return (
    <svg width="100%" height="34" viewBox="0 0 1008 34" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ display: "block" }}>
      <line x1="0" y1="1" x2="1008" y2="1" stroke="#6B6558" strokeWidth="1.5" />
      {Array.from({ length: 24 }, (_, i) => (
        <polygon key={i} points={`${i * 42},1 ${i * 42 + 42},1 ${i * 42 + 21},32`} fill={cols[i % cols.length]} stroke="#00000022" />
      ))}
    </svg>
  );
}

// The dressed-up strip at the very top of every page while a seasonal look is on:
// a message, and a row of the season's drawn icons (or lights, or bunting).
export default function SeasonBanner({ active }: { active: ActiveSeason }) {
  const { season, banner } = active;
  const lead = season.icons[0];
  const trail = season.icons[season.icons.length - 1];
  const row = Array.from({ length: 16 }, (_, i) => season.icons[i % season.icons.length]);
  return (
    <div className="cal-no-print" role="note" aria-label={`${season.label} message`}>
      <div style={{ color: season.palette.topbar }} className="px-3 pt-2 pb-1 flex items-center justify-center gap-3 text-[14px] font-semibold text-center">
        <span className="hidden sm:block shrink-0">{icon(lead, 22)}</span>
        <span>{banner}</span>
        <span className="hidden sm:block shrink-0">{icon(trail, 22)}</span>
      </div>
      {season.decoration === "lights" && <Lights />}
      {season.decoration === "bunting" && <Bunting />}
      {season.decoration === "icons" && (
        <div className="flex items-center justify-between px-4 py-1 overflow-hidden">
          {row.map((n, i) => (
            <span key={i} className={i >= 8 ? "hidden md:block" : ""}>
              {icon(n, 26)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
