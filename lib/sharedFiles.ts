// Rules for files a home shares by link (menus, newsletters, timetables).

export const MAX_SHARED_FILES = 30; // links per account
export const MAX_ITEMS_PER_CATEGORY = 10; // files in each section of a link
export const MAX_CATEGORIES = 10; // sections per link
// Files go straight from the browser to storage (not through our server), so they
// can be much bigger than a normal request allows.
export const MAX_SHARED_FILE_MB = 25;
export const MAX_SHARED_FILE_BYTES = MAX_SHARED_FILE_MB * 1024 * 1024;
export const ALLOWED_CONTENT_TYPES = ["application/pdf", "image/jpeg", "image/png"];

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

// Checks an uploaded file's size and real type. Returns the kind, or a message
// to show the person.
export async function checkUpload(file: File): Promise<{ kind: SharedFileKind } | { error: string }> {
  if (file.size > MAX_SHARED_FILE_BYTES) return { error: `That file is over ${MAX_SHARED_FILE_MB}MB. Try a smaller or compressed copy.` };
  const kind = detectKind(new Uint8Array(await file.slice(0, 16).arrayBuffer()));
  if (!kind) return { error: "Only PDF, JPG and PNG files can be shared." };
  return { kind };
}

export function cleanTitle(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, 100) : "";
}

export const blobPrefixFor = (userId: string) => `shared-files/${userId}/`;

export function blobPathFor(userId: string, title: string, ext: string) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "file";
  return `${blobPrefixFor(userId)}${slug}.${ext}`;
}
