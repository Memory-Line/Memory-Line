import { requireAdmin } from "@/lib/admin";
import { getViewer } from "@/lib/viewer";

// Languages whose talking boards are open to every Premium account. All the other
// languages are still only for the admin until they are checked and added here.
export const PUBLIC_BOARD_LANGS = ["portuguese"];
export const PUBLIC_BOARD_CODES = ["pt"];

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
