// Seasonal looks for the whole site (Christmas, autumn/Halloween, Remembrance and VE
// Day, Easter). Each has a palette (which recolours the site's buttons, backgrounds and
// top bar), a banner message, a row of drawn icons and text for the home page band.
// Which one shows, and when, is set on the admin page (lib/seasonDb.ts).

export type SeasonKey = "christmas" | "autumn" | "remembrance" | "ve-day" | "easter";

export type Season = {
  key: SeasonKey;
  label: string;
  // Palette: used for the site's colour variables while the season is on.
  palette: { bg: string; cardTint: string; line: string; sage: string; sageDeep: string; clay: string; topbar: string };
  band: { bg: string; text: string; accent: string; heading: string }; // the dressed-up band on the home page
  icons: string[]; // file names in /public/season
  decoration: "lights" | "bunting" | "icons";
  defaultBanner: string;
  heroTitle: string;
  heroText: string;
  // Suggested dates (month-day), repeated every year. Easter moves, so it has none.
  suggested?: { start: string; end: string; yearly: boolean };
};

export const SEASONS: Season[] = [
  {
    key: "christmas",
    label: "Christmas",
    palette: { bg: "#EFF3EA", cardTint: "#E1ECDC", line: "#D2E0CB", sage: "#2F7A4B", sageDeep: "#14472D", clay: "#B3272D", topbar: "#14472D" },
    band: { bg: "#14472D", text: "#DDEBE0", accent: "#B3272D", heading: "#FFE9A8" },
    icons: ["holly", "bauble", "star", "bell", "pine", "snowflake"],
    decoration: "lights",
    defaultBanner: "Merry Christmas from Activity Central. Festive activities are ready to print.",
    heroTitle: "Merry Christmas from Activity Central",
    heroText: "Carols, memories, crafts and festive favourites for your residents, ready to print.",
    suggested: { start: "12-01", end: "12-31", yearly: true },
  },
  {
    key: "autumn",
    label: "Autumn and Halloween",
    palette: { bg: "#F8EBDD", cardTint: "#F3DDC6", line: "#E8CDB1", sage: "#B85A18", sageDeep: "#7A3A0E", clay: "#4B3570", topbar: "#2B1F40" },
    band: { bg: "#2B1F40", text: "#E2D8EE", accent: "#E8791D", heading: "#F8B15A" },
    icons: ["bat", "pumpkin", "moon", "maple", "candle"],
    decoration: "icons",
    defaultBanner: "Autumn is here. Harvest, memories and Halloween fun for your residents.",
    heroTitle: "Autumn and Halloween at Activity Central",
    heroText: "Harvest memories, autumn crafts and gentle Halloween fun, ready to print.",
    suggested: { start: "10-15", end: "11-01", yearly: true },
  },
  {
    key: "remembrance",
    label: "Remembrance",
    palette: { bg: "#F1EEE8", cardTint: "#E8E3DA", line: "#D9D3C8", sage: "#1F3A5F", sageDeep: "#14284A", clay: "#A8232B", topbar: "#1F2B3D" },
    band: { bg: "#1F2B3D", text: "#D5DBE5", accent: "#A8232B", heading: "#F2E6C9" },
    icons: ["poppy", "candle", "poppy"],
    decoration: "icons",
    defaultBanner: "We will remember them. Remembrance activities are ready to print.",
    heroTitle: "We will remember them",
    heroText: "Gentle, respectful activities for Remembrance, ready to print.",
    suggested: { start: "11-02", end: "11-12", yearly: true },
  },
  {
    key: "ve-day",
    label: "VE Day",
    palette: { bg: "#F2EEE6", cardTint: "#E6E3DE", line: "#D8D3CA", sage: "#1F3A5F", sageDeep: "#14284A", clay: "#B3262E", topbar: "#1F3A5F" },
    band: { bg: "#1F3A5F", text: "#DCE3EE", accent: "#B3262E", heading: "#FFFFFF" },
    icons: ["poppy", "star", "poppy"],
    decoration: "bunting",
    defaultBanner: "Remembering VE Day. Thank you to everyone who served.",
    heroTitle: "Remembering VE Day",
    heroText: "Memories, music and conversation from 1945, ready to print.",
    suggested: { start: "05-04", end: "05-09", yearly: true },
  },
  {
    key: "easter",
    label: "Easter and spring",
    palette: { bg: "#FBF6E3", cardTint: "#F4EAC0", line: "#E8DDAD", sage: "#6E8F32", sageDeep: "#4A6420", clay: "#C9871C", topbar: "#4F6B26" },
    band: { bg: "#4F6B26", text: "#EEF3DD", accent: "#C9871C", heading: "#FFF3B8" },
    icons: ["egg", "daffodil", "blossom", "egg"],
    decoration: "icons",
    defaultBanner: "Happy Easter from Activity Central. Spring activities are ready to print.",
    heroTitle: "Happy Easter from Activity Central",
    heroText: "Spring flowers, crafts and memories, ready to print.",
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
