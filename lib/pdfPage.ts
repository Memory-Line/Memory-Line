// Opens a sheet's PDF for the on-screen games that draw a picture out of it (Matching Pairs, Colouring,
// Snakes and Ladders, Spot the Difference).
//
// Two things keep it quick: the pdf.js library and the PDF file are fetched at the same time instead of one
// after the other, and the file comes straight from the file store's fast network (the page passes its
// address) instead of going through the site's download route, which looks the account up, records a
// download and stamps a name on the sheet first. The library is also started early (warmPdfJs) while
// someone is still browsing the list, so by the time they press Play it is already there.
const PDFJS_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs";
const PDFJS_WORKER_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs";

// A dynamic import that is opaque to the bundler (it loads straight from the CDN at runtime).
const importFromCdn = new Function("url", "return import(url)") as (url: string) => Promise<any>;

let library: Promise<any> | null = null;

export function pdfjs(): Promise<any> {
  if (!library) {
    library = importFromCdn(PDFJS_URL).then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
      return lib;
    });
    library.catch(() => {
      library = null; // try again next time
    });
  }
  return library;
}

export function warmPdfJs() {
  pdfjs().catch(() => {});
}

export async function openPdf(url: string) {
  const [lib, res] = await Promise.all([pdfjs(), fetch(url)]);
  if (!res.ok) throw new Error(`PDF ${res.status}`);
  const data = new Uint8Array(await res.arrayBuffer());
  return lib.getDocument({ data }).promise;
}
