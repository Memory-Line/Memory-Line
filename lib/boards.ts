import { BOARD_DATA, ALWAYS_DATA, UI_TEXT, AUDIO_FILES } from "@/lib/boardsData";

export type LangCode = "en" | "pl" | "ur";
export type Text3 = Record<LangCode, string>;
export type BoardAnswer = { id: string; label: Text3; say: Text3; colour?: string };
export type Board = { id: string; code: string; area: string; question: Text3; answers: BoardAnswer[] };

export const BOARDS = BOARD_DATA as unknown as Board[];
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
