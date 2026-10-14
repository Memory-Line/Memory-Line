import { requireAdmin } from "@/lib/admin";
import { getViewer } from "@/lib/viewer";

// Languages whose talking boards are open to every Premium account. Dominik has had them checked and
// opens each language as it is built; add a language's slug and code here when it is finished.
export const PUBLIC_BOARD_LANGS = ["portuguese", "polish", "urdu", "romanian", "spanish", "french", "hindi", "punjabi", "bengali", "gujarati", "arabic", "farsi-persian", "turkish", "mandarin-chinese", "cantonese-chinese", "tagalog-filipino", "tamil", "malayalam"];
export const PUBLIC_BOARD_CODES = ["pt", "pl", "ur", "ro", "es", "fr", "hi", "pa", "bn", "gu", "ar", "fa", "tr", "zh", "yue", "tl", "ta", "ml"];

// Can this visitor open the talking boards for this language (by page slug)?
export async function canSeeBoards(languageSlug: string) {
  if (await requireAdmin()) return true;
  if (!PUBLIC_BOARD_LANGS.includes(languageSlug)) return false;
  const v = await getViewer();
  return !!v.userId && v.isPremium;
}

// Same check for a language code, used by the board player page and the voice route.
export async function canUseBoardCode(code: string) {
  if (await requireAdmin()) return true;
  if (code !== "en" && !PUBLIC_BOARD_CODES.includes(code)) return false;
  const v = await getViewer();
  return !!v.userId && v.isPremium;
}
