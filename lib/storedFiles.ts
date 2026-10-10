import { del } from "@vercel/blob";

const BLOB_HOST = ".blob.vercel-storage.com";

// Deletes the stored files for activities that are being removed (best effort: a file
// that can't be deleted just stays in storage, the activity is gone either way).
export async function deleteStoredFiles(rows: { fileUrl: string; answerFileUrl: string | null; largePrintFileUrl: string | null }[]) {
  const urls = rows
    .flatMap((r) => [r.fileUrl, r.answerFileUrl, r.largePrintFileUrl])
    .filter((u): u is string => !!u && u.includes(BLOB_HOST));
  for (let i = 0; i < urls.length; i += 100) {
    await del(urls.slice(i, i + 100)).catch(() => {});
  }
}
