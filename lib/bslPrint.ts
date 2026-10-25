import { PDFDocument, PDFFont, PDFImage, PDFPage, StandardFonts, LineCapStyle, rgb } from "pdf-lib";
import cardData from "@/lib/data/bslCardData.json";

// The printable BSL cards, drawn on demand. A person picks any signs; they are laid out four to a page
// (two across, two down). A last page holding fewer than four gets a bigger layout so nothing looks lost:
//   1 left over  -> one big card filling the page
//   2 left over  -> two wide cards, one above the other, each half the page
//   3 left over  -> one wide card on top and two smaller cards below
// Every card carries the group colour, a picture, the words, answer boxes for yes/no questions and a QR code
// that opens the sign's video on SignBSL.com.

export type PrintSign = { slug: string; title: string; label: string; color: string };

type CardData = { n: number; title: string; group: string; yn: boolean; icon: string[]; qr: string[] };
const DATA = cardData as unknown as Record<string, CardData>;

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 28;
const GAP = 14;

type Fonts = { serif: PDFFont; sans: PDFFont; sansBold: PDFFont };
type Ctx = { page: PDFPage; fonts: Fonts; logo: PDFImage | null };

function hex(h: string): [number, number, number] {
  const v = h.replace("#", "");
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}
function col(c: [number, number, number]) {
  return rgb(c[0] / 255, c[1] / 255, c[2] / 255);
}
function tint(c: [number, number, number], t: number): [number, number, number] {
  return [Math.round(255 - (255 - c[0]) * t), Math.round(255 - (255 - c[1]) * t), Math.round(255 - (255 - c[2]) * t)];
}

// A rounded rectangle as SVG path text (design pixels). r1 rounds the top corners, r2 the bottom ones.
function rr(x: number, y: number, w: number, h: number, r1: number, r2 = r1) {
  return (
    `M${x + r1} ${y}H${x + w - r1}Q${x + w} ${y} ${x + w} ${y + r1}V${y + h - r2}Q${x + w} ${y + h} ${x + w - r2} ${y + h}` +
    `H${x + r2}Q${x} ${y + h} ${x} ${y + h - r2}V${y + r1}Q${x} ${y} ${x + r1} ${y}Z`
  );
}

function wrap(font: PDFFont, text: string, size: number, width: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(t, size) <= width) cur = t;
    else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// Fits the title: one line if it can be, else up to maxLines, shrinking the type as needed.
function fitTitle(font: PDFFont, text: string, width: number, start: number, min: number, maxLines: number) {
  let size = start;
  while (size > min) {
    const lines = wrap(font, text, size, width);
    if (lines.length === 1 || (lines.length <= maxLines && size <= start * 0.8)) return { size, lines };
    size -= 4;
  }
  return { size: min, lines: wrap(font, text, min, width) };
}

// Draws one card. (left, top) is the card's top-left corner in PDF points, w × h its size. Everything inside is laid out in
// "design pixels" (the card is 1100 wide) and scaled by k, so a card looks the same at any size.
function drawCard(ctx: Ctx, left: number, top: number, w: number, h: number, sign: PrintSign) {
  const { page, fonts, logo } = ctx;
  const d = DATA[sign.slug];
  if (!d) return;
  const k = w / 1100;
  const H = h / k; // card height in design pixels
  const c = hex(sign.color);
  const wide = w / h > 1.2;
  const X = (dx: number) => left + dx * k;
  const Y = (dy: number) => top - dy * k;
  const path = (p: string, o: Parameters<PDFPage["drawSvgPath"]>[1]) => page.drawSvgPath(p, { x: left, y: top, scale: k, ...o });
  const text = (s: string, dx: number, baseline: number, size: number, font: PDFFont, color: [number, number, number], anchor: "l" | "c" | "r" = "l") => {
    const tw = font.widthOfTextAtSize(s, size);
    const x = anchor === "l" ? dx : anchor === "c" ? dx - tw / 2 : dx - tw;
    page.drawText(s, { x: X(x), y: Y(baseline), size: size * k, font, color: col(color) });
  };

  // card body
  path(rr(4, 4, 1092, H - 8, 60), { color: rgb(1, 1, 1), borderColor: col(tint(c, 0.5)), borderWidth: 8 });
  // coloured strip with logo, brand and group
  const SH = wide ? 150 : 170;
  path(rr(4, 4, 1092, SH, 60, 0), { color: col(c) });
  if (logo) {
    const lh = SH - 50;
    const lw = (logo.width * lh) / logo.height;
    path(rr(34, 25, lw + 24, lh + 10, 28), { color: rgb(0.984, 0.973, 0.941) });
    page.drawImage(logo, { x: X(46), y: Y(25 + 5 + lh), width: lw * k, height: lh * k });
    const tx = 34 + lw + 24 + 30;
    text("Activity Central", tx, SH * 0.5 + 12, 56, fonts.serif, [255, 255, 255]);
    text(sign.label.toUpperCase(), tx, SH * 0.5 + 12 + 56, 36, fonts.sansBold, tint(c, 0.3));
  }
  text(String(d.n).padStart(3, "0"), 1060, SH * 0.5 + 12, 44, fonts.sansBold, tint(c, 0.45), "r");

  const iconAt = (cx: number, cy: number, big: number) => {
    page.drawCircle({ x: X(cx), y: Y(cy), size: ((big / 2 + 40) * k), color: col(tint(c, 0.16)) });
    const isz = big * 0.8;
    const s = (isz / 24) * k;
    for (const p of d.icon) {
      page.drawSvgPath(p, {
        x: X(cx - isz / 2),
        y: Y(cy - isz / 2),
        scale: s,
        borderColor: col(c),
        borderWidth: 1.6,
        borderLineCap: LineCapStyle.Round,
      });
    }
  };
  const qrAt = (qx: number, qy: number, size: number) => {
    const n = d.qr.length;
    const m = size / n;
    page.drawRectangle({ x: X(qx - 8), y: Y(qy + size + 8), width: (size + 16) * k, height: (size + 16) * k, color: rgb(1, 1, 1) });
    for (let r = 0; r < n; r++) {
      for (let q = 0; q < n; q++) {
        if (d.qr[r][q] === "1") page.drawRectangle({ x: X(qx + q * m), y: Y(qy + (r + 1) * m), width: m * k + 0.15, height: m * k + 0.15, color: rgb(0, 0, 0) });
      }
    }
  };
  const boxes = (bx: number, by: number, bw: number, bh: number, gap: number, fs: number) => {
    const items: [string, [number, number, number]][] = [
      ["Yes", [79, 122, 69]],
      ["No", [181, 69, 61]],
      ["Not sure", [120, 116, 104]],
    ];
    const each = (bw - 2 * gap) / 3;
    items.forEach(([t, tc], i) => {
      const x0 = bx + i * (each + gap);
      path(rr(x0, by, each, bh, 34), { color: col(tint(tc, 0.14)), borderColor: col(tc), borderWidth: 6 });
      text(t, x0 + each / 2, by + bh / 2 + fs * 0.33, fs, fonts.sansBold, tc, "c");
    });
  };

  if (!wide) {
    const qs = 290;
    const bottom = H - 40 - qs - 40;
    const boxesH = 160;
    const areaBottom = bottom - (d.yn ? boxesH + 30 : 0);
    const { size, lines } = fitTitle(fonts.serif, sign.title, 1000, 112, 70, 2);
    const th = size * 1.15 * lines.length;
    const topY = SH + 70;
    const big = Math.max(180, Math.min(700, areaBottom - topY - th - 60));
    iconAt(550, topY + big / 2, big);
    let ty = topY + big + 60;
    for (const l of lines) {
      text(l, 550, ty + size * 0.8, size, fonts.serif, [43, 43, 38], "c");
      ty += size * 1.15;
    }
    if (d.yn) boxes(50, bottom - boxesH, 1000, boxesH - 10, 20, 54);
    qrAt(1050 - qs, H - 40 - qs, qs);
    text("Scan to watch", 50, H - 40 - qs / 2 - 8, 56, fonts.sansBold, c);
    text("this sign in BSL", 50, H - 40 - qs / 2 + 50, 50, fonts.sans, [110, 106, 94]);
  } else {
    // wide card: picture on the left, words and answer boxes on the right, QR bottom right
    const bodyTop = SH;
    const bodyH = H - SH;
    const big = Math.min(420, bodyH - 120);
    iconAt(270, bodyTop + bodyH / 2, big);
    const x0 = 520;
    const colW = 540;
    const qs = 190;
    const qrTop = H - 40 - qs;
    const { size, lines } = fitTitle(fonts.serif, sign.title, colW, 100, 56, 2);
    const titleH = size * 1.12 * lines.length;
    const boxH = d.yn ? 100 : 0;
    // title and answer boxes sit together in the space above the QR row
    const free = qrTop - 30 - bodyTop;
    let ty = bodyTop + Math.max(20, (free - titleH - (d.yn ? boxH + 24 : 0)) / 2);
    for (const l of lines) {
      text(l, x0, ty + size * 0.8, size, fonts.serif, [43, 43, 38]);
      ty += size * 1.12;
    }
    if (d.yn) boxes(x0, ty + 24, colW, boxH, 14, 34);
    qrAt(1050 - qs, qrTop, qs);
    text("Scan to watch", x0, qrTop + qs / 2 - 4, 44, fonts.sansBold, c);
    text("this sign in BSL", x0, qrTop + qs / 2 + 42, 40, fonts.sans, [110, 106, 94]);
  }
}

// Page layouts for a run of cards: returns [left, top, w, h] boxes (PDF points, top-left corner) in reading order.
function layout(count: number): [number, number, number, number][] {
  const cw = (PAGE_W - 2 * MARGIN - GAP) / 2;
  const ch = (PAGE_H - 2 * MARGIN - GAP) / 2;
  const fullW = PAGE_W - 2 * MARGIN;
  const quarter = (i: number): [number, number, number, number] => [MARGIN + (i % 2) * (cw + GAP), PAGE_H - MARGIN - Math.floor(i / 2) * (ch + GAP), cw, ch];
  if (count >= 4) return [0, 1, 2, 3].map(quarter);
  if (count === 1) return [[MARGIN, PAGE_H - MARGIN, fullW, PAGE_H - 2 * MARGIN]];
  if (count === 2)
    return [
      [MARGIN, PAGE_H - MARGIN, fullW, ch],
      [MARGIN, PAGE_H - MARGIN - ch - GAP, fullW, ch],
    ];
  return [[MARGIN, PAGE_H - MARGIN, fullW, ch], quarter(2), quarter(3)];
}

export async function buildBslPdf(signs: PrintSign[], logoPng: Uint8Array | null, whoFor: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const fonts: Fonts = {
    serif: await pdf.embedFont(StandardFonts.TimesRomanBold),
    sans: await pdf.embedFont(StandardFonts.Helvetica),
    sansBold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };
  const logo = logoPng ? await pdf.embedPng(logoPng) : null;
  const stamp = `${whoFor ? `Downloaded for ${whoFor} · ` : ""}${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · activitycentral.co.uk`;
  for (let i = 0; i < signs.length; i += 4) {
    const chunk = signs.slice(i, i + 4);
    const page = pdf.addPage([PAGE_W, PAGE_H]);
    const ctx: Ctx = { page, fonts, logo };
    layout(chunk.length).forEach((box, j) => {
      if (chunk[j]) drawCard(ctx, box[0], box[1], box[2], box[3], chunk[j]);
    });
    const tw = fonts.sans.widthOfTextAtSize(stamp, 6.5);
    page.drawText(stamp, { x: (PAGE_W - tw) / 2, y: 12, size: 6.5, font: fonts.sans, color: rgb(0.5, 0.47, 0.43) });
  }
  pdf.setTitle("BSL cards");
  pdf.setSubject(stamp);
  return pdf.save();
}
