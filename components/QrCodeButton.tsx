"use client";

import { useState, type CSSProperties } from "react";

// The QR code is drawn in the browser with a small open-source library loaded
// from a CDN (the same way the games load pdf.js), so nothing is stored or sent
// anywhere: the code simply holds the link's address.
const QR_URL = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm";
const importFromCdn = new Function("url", "return import(url)") as (url: string) => Promise<any>;

async function makeQrPng(text: string, size = 720): Promise<string> {
  const mod = await importFromCdn(QR_URL);
  const qrcode = mod.default ?? mod;
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const modules = qr.getModuleCount();
  const quiet = 4; // the blank border a scanner needs
  const total = modules + quiet * 2;
  const cell = Math.max(1, Math.floor(size / total));
  const px = cell * total;
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, px, px);
  ctx.fillStyle = "#000000";
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (qr.isDark(r, c)) ctx.fillRect((c + quiet) * cell, (r + quiet) * cell, cell, cell);
    }
  }
  return canvas.toDataURL("image/png");
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

const linkStyle: CSSProperties = { cursor: "pointer", color: "#B5714A", textDecoration: "underline", background: "none", border: "none", padding: 0, font: "inherit", fontWeight: 700 };

// "QR code" for a link: shows it, lets the person download it as a picture or
// print a sheet with the QR code and the title, to put on a noticeboard.
export default function QrCodeButton({ url, title, className }: { url: string; title: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [png, setPng] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function show() {
    setOpen(true);
    setError(false);
    if (png) return;
    try {
      setPng(await makeQrPng(url));
    } catch {
      setError(true);
    }
  }

  function printSheet() {
    if (!png) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title>
<style>
  @page { margin: 15mm; }
  body { font-family: Georgia, serif; text-align: center; color: #3F3237; margin: 0; padding: 20px; }
  h1 { font-size: 34px; font-weight: 400; margin: 10px 0 4px; }
  p { margin: 4px 0; font-size: 18px; }
  img { width: 100%; max-width: 420px; height: auto; margin: 18px auto; display: block; }
  .small { font-size: 12px; color: #8A7A6B; margin-top: 24px; }
</style></head><body>
<h1>${escapeHtml(title)}</h1>
<p>Scan with your phone's camera to see it</p>
<img src="${png}" alt="QR code for ${escapeHtml(title)}">
<p class="small">Made with Activity Central · activitycentral.co.uk</p>
<script>window.onload = function () { setTimeout(function () { window.print(); }, 250); };</script>
</body></html>`);
    w.document.close();
  }

  const fileName = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "link"}-qr.png`;

  return (
    <>
      <button type="button" onClick={show} className={className} style={className ? undefined : linkStyle}>
        QR code
      </button>

      {open && (
        <div
          className="cal-no-print"
          style={{ position: "fixed", inset: 0, background: "rgba(63,50,55,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 20 }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 360, maxWidth: "100%", background: "#fff", borderRadius: 16, border: "1px solid #EAE4D6", boxShadow: "0 12px 30px rgba(63,50,55,0.18)", padding: "20px 20px 18px", color: "#3F3237", textAlign: "center" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, margin: 0, textAlign: "left" }}>QR code</h2>
              <button onClick={() => setOpen(false)} style={{ border: "none", background: "none", color: "#8A7A6B", fontSize: 18, cursor: "pointer" }} aria-label="Close">×</button>
            </div>
            <p style={{ fontSize: 13, color: "#8A7A6B", margin: "6px 0 12px", textAlign: "left" }}>
              Scanning it with a phone camera opens the link: <b>{title}</b>.
            </p>
            {png ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={png} alt={`QR code for ${title}`} style={{ width: "100%", maxWidth: 280, height: "auto", display: "block", margin: "0 auto 14px", border: "1px solid #EAE4D6" }} />
            ) : (
              <p style={{ fontSize: 13, color: "#8A7A6B", padding: "40px 0" }}>{error ? "Sorry, the QR code couldn't be made. Please try again." : "Making your QR code…"}</p>
            )}
            {png && (
              <div style={{ display: "flex", gap: 10 }}>
                <a
                  href={png}
                  download={fileName}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #B5714A", background: "#B5714A", color: "#fff", fontWeight: 700, fontSize: 13.5, textDecoration: "none" }}
                >
                  Download picture
                </a>
                <button
                  onClick={printSheet}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #B5714A", background: "#fff", color: "#B5714A", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}
                >
                  Print a sheet
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
