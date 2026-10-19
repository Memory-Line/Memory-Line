import { PDFDocument } from "pdf-lib";

export type PrintFile = "standard" | "large-print" | "answers";

// Gets the chosen sheets (each one through /api/download, so each is recorded, watermarked and held to the
// same Premium rules as a normal download), joins them into one PDF in the order given, and opens the
// browser's print window for it. One sheet is just a pack of one. Runs in the browser, so there is no size limit
// on the joined file.
export async function printPack(
  ids: string[],
  file: PrintFile,
  onProgress?: (done: number, total: number) => void
): Promise<{ ok: boolean; message: string; url?: string }> {
  const results: (Uint8Array | null)[] = new Array(ids.length).fill(null);
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < ids.length) {
      const i = next++;
      try {
        const res = await fetch(`/api/download/${ids[i]}?file=${file}`);
        const type = res.headers.get("content-type") ?? "";
        if (res.ok && type.includes("pdf")) results[i] = new Uint8Array(await res.arrayBuffer());
      } catch {
        // leave it null: counted as skipped below
      }
      onProgress?.(++done, ids.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, ids.length) }, worker));

  const merged = await PDFDocument.create();
  let used = 0;
  for (const bytes of results) {
    if (!bytes) continue;
    try {
      const doc = await PDFDocument.load(bytes);
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
      used++;
    } catch {
      // a file that will not open is skipped
    }
  }
  if (used === 0) {
    return { ok: false, message: "None of those sheets could be fetched. Large print needs a Premium plan." };
  }

  const blob = new Blob([await merged.save()], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0";
  frame.src = url;
  frame.onload = () => {
    setTimeout(() => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } catch {
        window.open(url, "_blank");
      }
    }, 400);
  };
  document.body.appendChild(frame);
  setTimeout(() => frame.remove(), 10 * 60 * 1000);

  const skipped = ids.length - used;
  return {
    ok: true,
    url,
    message: skipped > 0 ? `Opened the print window for ${used} sheets. ${skipped} could not be added.` : `Opened the print window for ${used} ${used === 1 ? "sheet" : "sheets"}.`,
  };
}
