import { BOARD_DATA, ALWAYS_DATA, UI_TEXT, AUDIO_FILES } from "@/lib/boardsData";

export type LangCode = "en" | "pl" | "ur";
export type Text3 = Record<LangCode, string>;
export type BoardAnswer = { id: string; label: Text3; say: Text3; colour?: string };
export type Board = { id: string; code: string; area: string; topic: string; question: Text3; answers: BoardAnswer[] };

// Which sub-topic each board sits under inside its area.
const TOPIC: Record<string, string> = { "nut-01": "Drinks", "nut-02": "Drinks", "nut-03": "Drinks", "nut-04": "Meals", "nut-05": "Meals" };
export const BOARDS: Board[] = (BOARD_DATA as unknown as Omit<Board, "topic">[]).map((b) => ({ ...b, topic: TOPIC[b.id] ?? "Other" }));

// Languages that have boards so far. The page language chosen sets the other language.
export const BOARD_LANGS: Record<string, LangCode> = { english: "en", polish: "pl", urdu: "ur" };

export function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
export const ALWAYS = ALWAYS_DATA as unknown as BoardAnswer[];
export const UI = UI_TEXT as unknown as Record<"readChoices" | "playAgain" | "always", Text3>;
export const AUDIO = AUDIO_FILES;

export const OTHER_LANGS: { code: LangCode; name: string; rtl: boolean }[] = [
  { code: "pl", name: "Polski", rtl: false },
  { code: "ur", name: "اردو", rtl: true },
];

export function getBoard(id: string) {
  return BOARDS.find((b) => b.id === id) ?? null;
}
