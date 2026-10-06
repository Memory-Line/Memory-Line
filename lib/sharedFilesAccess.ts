import { getViewer } from "@/lib/viewer";

// Shared files is a Premium feature. Making links and adding or replacing their
// files needs Premium; listing, renaming and deleting stay open, so someone who
// moves to Standard can still tidy up (and delete) what they made.
export const SHARED_FILES_PREMIUM_MESSAGE = "Shared files is part of the Premium plan.";

export async function canShareFiles() {
  return (await getViewer()).isPremium;
}
