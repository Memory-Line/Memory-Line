// Rules for files a home shares by link (menus, newsletters, timetables).

export const MAX_SHARED_FILES = 10;
// Files are sent to the server in one request, and Vercel allows about 4.5MB
// per request, so 4MB is the practical limit.
export const MAX_SHARED_FILE_BYTES = 4 * 1024 * 1024;

export type SharedFileKind = { contentType: "application/pdf" | "image/jpeg" | "image/png"; ext: "pdf" | "jpg" | "png" };

// What the file really is, from its first bytes (not just its name), so only
// PDFs and JPG/PNG pictures can be shared whatever someone renames a file to.
export function detectKind(head: Uint8Array): SharedFileKind | null {
  if (head.length >= 5 && head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46 && head[4] === 0x2d) {
    return { contentType: "application/pdf", ext: "pdf" };
  }
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return { contentType: "image/jpeg", ext: "jpg" };
  }
  if (head.length >= 8 && head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47 && head[4] === 0x0d && head[5] === 0x0a && head[6] === 0x1a && head[7] === 0x0a) {
    return { contentType: "image/png", ext: "png" };
  }
  return null;
}

export function cleanTitle(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, 100) : "";
}

export function blobPathFor(userId: string, title: string, ext: string) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "file";
  return `shared-files/${userId}/${slug}.${ext}`;
}
