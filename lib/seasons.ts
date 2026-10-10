// Seasonal looks for the whole site. Each has a palette (which recolours buttons, tints and
// the top bar), a sky strip with a message and drawn artwork, a scene along the bottom of
// the page, and gentle falling items. The artwork is in /public/season (icons) and
// /public/season/scenes. Which look is on is set on the admin page (lib/seasonDb.ts).

export type SeasonKey = "christmas" | "autumn" | "ve-day" | "remembrance" | "easter" | "dementia";

export type Season = {
  key: SeasonKey;
  label: string;
  art: string; // file prefix in /public/season/scenes
  palette: { bg: string; cardTint: string; line: string; sage: string; sageDeep: string; clay: string; topbar: string };
  sky: { top: string; mid: string; text: string }; // the strip across the top and its message colour
  bunting?: boolean; // a tile of bunting along the very top
  mover: { seconds: number; height: number; top: number }; // the drifting artwork (sleigh, bats, planes...)
  falling: { src?: string; kind?: "confetti"; count: number; min: number; max: number };
  icons: string[]; // shown on the admin page
  defaultBanner: string;
};

export const SEASONS: Season[] = [
  {
    key: "christmas",
    label: "Christmas",
    art: "christmas",
    palette: { bg: "#EAF2F8", cardTint: "#DDE9F2", line: "#CBDCE8", sage: "#B3272D", sageDeep: "#8E1D22", clay: "#2F6B4A", topbar: "#14472D" },
    sky: { top: "#CFE2F1", mid: "#E4EFF7", text: "#B3272D" },
    mover: { seconds: 75, height: 92, top: 26 },
    falling: { src: "/season/snowflake.svg", count: 26, min: 14, max: 30 },
    icons: ["holly", "bauble", "star", "bell", "pine", "snowflake"],
    defaultBanner: "Merry Christmas from Activity Central",
  },
  {
    key: "autumn",
    label: "Halloween",
    art: "halloween",
    palette: { bg: "#F6EADB", cardTint: "#F0DCC4", line: "#E4C9A8", sage: "#D9670F", sageDeep: "#8A3F0A", clay: "#4B3570", topbar: "#1B1410" },
    sky: { top: "#171115", mid: "#3A1E12", text: "#F59E2E" },
    mover: { seconds: 60, height: 80, top: 30 },
    falling: { src: "/season/maple.svg", count: 22, min: 16, max: 30 },
    icons: ["bat", "pumpkin", "moon", "maple", "candle"],
    defaultBanner: "Happy Halloween from Activity Central",
  },
  {
    key: "ve-day",
    label: "VE Day (England)",
    art: "ve-day",
    palette: { bg: "#EAF2FB", cardTint: "#DCE8F5", line: "#C5D6EA", sage: "#012169", sageDeep: "#0B1F4A", clay: "#B3262E", topbar: "#012169" },
    sky: { top: "#4E9BE6", mid: "#9CCBF2", text: "#012169" },
    bunting: true,
    mover: { seconds: 45, height: 92, top: 36 },
    falling: { kind: "confetti", count: 28, min: 8, max: 16 },
    icons: ["poppy", "star", "poppy"],
    defaultBanner: "Remembering VE Day, 8 May 1945",
  },
  {
    key: "remembrance",
    label: "Remembrance",
    art: "remembrance",
    palette: { bg: "#EDF1F5", cardTint: "#E2E8EE", line: "#CFD8E1", sage: "#9E1F27", sageDeep: "#7A1219", clay: "#3C4A5E", topbar: "#1F2B3D" },
    sky: { top: "#BFD7EE", mid: "#E3ECF4", text: "#7A1A20" },
    mover: { seconds: 90, height: 70, top: 28 },
    falling: { src: "/season/petal.svg", count: 18, min: 12, max: 22 },
    icons: ["poppy", "candle", "poppy"],
    defaultBanner: "We will remember them",
  },
  {
    key: "easter",
    label: "Easter and spring",
    art: "easter",
    palette: { bg: "#FBF8E6", cardTint: "#F3EDC8", line: "#E5DDAF", sage: "#5E9A2E", sageDeep: "#3F6A1E", clay: "#C9871C", topbar: "#4F6B26" },
    sky: { top: "#8FCBF0", mid: "#CFEAF8", text: "#3F6A1E" },
    bunting: true,
    mover: { seconds: 80, height: 80, top: 44 },
    falling: { src: "/season/blossom.svg", count: 20, min: 18, max: 34 },
    icons: ["egg", "daffodil", "blossom", "egg"],
    defaultBanner: "Happy Easter from Activity Central",
  },
  {
    key: "dementia",
    label: "Dementia Awareness (September)",
    art: "dementia",
    palette: { bg: "#EEEDFA", cardTint: "#E2E0F5", line: "#D0CCEE", sage: "#5B4FC0", sageDeep: "#3B2F8F", clay: "#6B5FB0", topbar: "#3B2F8F" },
    sky: { top: "#A9B8F0", mid: "#CBD6F6", text: "#3B2F8F" },
    mover: { seconds: 85, height: 80, top: 40 },
    falling: { src: "/season/forgetmenot.svg", count: 24, min: 14, max: 26 },
    icons: ["blossom", "daffodil", "egg"],
    defaultBanner: "World Alzheimer's Month: September. Remember me.",
  },
];

export const seasonByKey = (key: string | null | undefined) => SEASONS.find((s) => s.key === key);

// "#RRGGBB" -> "R G B" (the form the site's colour variables use).
export function rgbTriplet(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

// The CSS variables that recolour the site for a season.
export function seasonVars(s: Season): Record<string, string> {
  return {
    "--c-bg": rgbTriplet(s.palette.bg),
    "--c-cardTint": rgbTriplet(s.palette.cardTint),
    "--c-line": rgbTriplet(s.palette.line),
    "--c-sage": rgbTriplet(s.palette.sage),
    "--c-sageDeep": rgbTriplet(s.palette.sageDeep),
    "--c-clay": rgbTriplet(s.palette.clay),
    "--c-topbar": rgbTriplet(s.palette.topbar),
  };
}
