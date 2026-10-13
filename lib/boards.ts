import { ALWAYS_DATA, UI_TEXT, AUDIO_FILES } from "@/lib/boardsData";

export type LangCode = "en" | "pl" | "ur" | "ro" | "pt" | "es" | "fr" | "hi" | "pa";
export type Text3 = Partial<Record<LangCode, string>> & { en: string };
export type BoardAnswer = { id: string; label: Text3; say: Text3; colour?: string; icon?: string; staff?: string; escalate?: boolean };
export type Board = {
  id: string; code: string; area: string; areaSlug: string; priority: number; signOff: boolean;
  question: Text3; answers: BoardAnswer[];
};

export const ALWAYS = ALWAYS_DATA as unknown as BoardAnswer[];
export const UI = UI_TEXT as unknown as Record<"readChoices" | "playAgain" | "always", Text3>;
export const AUDIO = AUDIO_FILES;

export const OTHER_LANGS: { code: LangCode; name: string; rtl: boolean }[] = [
  { code: "pl", name: "Polski", rtl: false },
  { code: "ur", name: "اردو", rtl: true },
  { code: "ro", name: "Română", rtl: false },
  { code: "pt", name: "Português", rtl: false },
  { code: "es", name: "Español", rtl: false },
  { code: "fr", name: "Français", rtl: false },
  { code: "hi", name: "हिन्दी", rtl: false },
  { code: "pa", name: "ਪੰਜਾਬੀ", rtl: false },
];

// Languages that have boards so far. The page language chosen sets the other language.
export const BOARD_LANGS: Record<string, LangCode> = { english: "en", polish: "pl", urdu: "ur", romanian: "ro", portuguese: "pt", spanish: "es", french: "fr", hindi: "hi", punjabi: "pa" };

export function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Text in a language, falling back to English if that translation is missing.
export function t(x: Text3, lang: LangCode) {
  return x[lang] || x.en;
}
