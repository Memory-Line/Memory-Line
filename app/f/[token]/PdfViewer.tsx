"use client";

import { useEffect, useRef, useState } from "react";

// pdf.js is loaded from a CDN, the same way the on-screen games load it.
const PDFJS_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs";
const PDFJS_WORKER_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs";
const importFromCdn = new Function("url", "return import(url)") as (url: string) => Promise<any>;
const MAX_PAGES = 30;

// Draws every page of the PDF down the page, the same on phones and computers
// (a PDF in a plain frame often shows only its first page on a phone).
export default function PdfViewer({ url }: { url: string }) {
  const holder = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const pdfjs = await importFromCdn(PDFJS_URL);
        pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
        const doc = await pdfjs.getDocument(url).promise;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const pages = Math.min(doc.numPages, MAX_PAGES);
        for (let n = 1; n <= pages; n++) {
          if (cancelled) return;
          const page = await doc.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const width = Math.min(holder.current?.clientWidth ?? 900, 900);
          const viewport = page.getViewport({ scale: (width * dpr) / base.width });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.style.display = "block";
          canvas.style.margin = "0 auto 12px";
          canvas.style.border = "1px solid #EAE4D6";
          canvas.style.borderRadius = "6px";
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
          if (cancelled) return;
          holder.current?.appendChild(canvas);
          if (n === 1) setState("ready");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div>
      {state === "loading" && <p style={{ textAlign: "center", fontSize: 14, color: "#8A7A6B", padding: "30px 0" }}>Loading…</p>}
      {state === "error" && (
        <p style={{ textAlign: "center", fontSize: 14, color: "#8A7A6B", padding: "30px 0" }}>
          Sorry, this file couldn't be shown.
        </p>
      )}
      <div ref={holder} />
    </div>
  );
}
