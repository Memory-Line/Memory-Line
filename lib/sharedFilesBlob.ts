import { head, del } from "@vercel/blob";
import { MAX_SHARED_FILE_BYTES, blobPrefixFor, detectKind, type SharedFileKind } from "@/lib/sharedFiles";

const UNFINISHED = "The upload did not finish. Please try again.";

// Files are uploaded by the browser straight to storage, so before one is attached
// to a link we check it is really ours (in this account's folder), small enough, and
// really a PDF, JPG or PNG by its first bytes. Anything else is deleted.
export async function verifyUploadedBlob(
  url: unknown,
  userId: string
): Promise<{ url: string; size: number; kind: SharedFileKind } | { error: string }> {
  if (typeof url !== "string") return { error: UNFINISHED };
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { error: UNFINISHED };
  }
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".public.blob.vercel-storage.com")) {
    return { error: UNFINISHED };
  }
  if (!decodeURIComponent(parsed.pathname).replace(/^\//, "").startsWith(blobPrefixFor(userId))) {
    return { error: UNFINISHED };
  }
  try {
    const info = await head(url);
    if (info.size > MAX_SHARED_FILE_BYTES) {
      await del(url).catch(() => {});
      return { error: "That file is too big." };
    }
    const res = await fetch(url, { headers: { Range: "bytes=0-15" } });
    const kind = detectKind(new Uint8Array(await res.arrayBuffer()).slice(0, 16));
    if (!kind) {
      await del(url).catch(() => {});
      return { error: "Only PDF, JPG and PNG files can be shared." };
    }
    return { url, size: info.size, kind };
  } catch {
    return { error: UNFINISHED };
  }
}
