import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type PDFImage } from "pdf-lib";
import type { FormItem } from "@/lib/forms";

// Makes the PDF of one completed questionnaire: the home's logo and name at the
// top, the questionnaire title, every question with its answer grouped by
// section, and at the bottom who completed it and the date. Page numbers and the
// home's contact details run along the foot of each page.

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 44;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOT = 46; // space kept clear at the bottom of each page

const INK = rgb(0.25, 0.2, 0.22);
const MUTED = rgb(0.5, 0.47, 0.44);
const ACCENT = rgb(0.17, 0.27, 0.62); // the blue of the Westcliff Lodge logo text
const BAND = rgb(0.93, 0.95, 0.99);
const RULE = rgb(0.85, 0.87, 0.93);

// The built-in PDF fonts only cover Western European letters; anything else
// (emoji and so on) becomes "?" so a stray character can't stop the PDF.
function safe(text: string) {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/\r/g, "")
    .replace(/[^\n\x20-\x7E\xA0-\xFF]/g, "?");
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of safe(text).split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) <= width) {
        line = test;
      } else {
        if (line) lines.push(line);
        // A single very long word is broken up so it can't run off the page.
        let rest = word;
        while (font.widthOfTextAtSize(rest, size) > width) {
          let cut = rest.length - 1;
          while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > width) cut--;
          lines.push(rest.slice(0, cut));
          rest = rest.slice(cut);
        }
        line = rest;
      }
    }
    lines.push(line);
  }
  return lines;
}

export function todayInLondon() {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });
}

export async function makeFormPdf(input: {
  title: string;
  homeName: string | null;
  brandLines: string | null;
  logo: { bytes: Uint8Array; type: "png" | "jpg" } | null;
  items: FormItem[];
  answers: Record<string, string>;
  date: string; // already formatted, e.g. "7 October 2026"
}): Promise<Uint8Array> {
  const { title, homeName, brandLines, logo, items, answers, date } = input;
  const doc = await PDFDocument.create();
  doc.setTitle(`${title}${homeName ? ` - ${homeName}` : ""}`);
  doc.setSubject(`Submitted online on ${date}`);
  doc.setCreator("Activity Central");
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

  let image: PDFImage | null = null;
  if (logo) {
    try {
      image = logo.type === "png" ? await doc.embedPng(logo.bytes) : await doc.embedJpg(logo.bytes);
    } catch {
      image = null;
    }
  }

  let page: PDFPage = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const newPage = () => {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
    // A small running header on later pages.
    page.drawText(safe(`${homeName ? homeName + " - " : ""}${title}`), { x: MARGIN, y: y - 8, size: 8.5, font: regular, color: MUTED });
    page.drawLine({ start: { x: MARGIN, y: y - 14 }, end: { x: PAGE_W - MARGIN, y: y - 14 }, thickness: 0.5, color: RULE });
    y -= 30;
  };
  const ensure = (height: number) => {
    if (y - height < MARGIN + FOOT) newPage();
  };

  // ---- First page: logo, home name, title ----
  let headerBottom = y;
  if (image) {
    const logoH = 64;
    const logoW = (image.width / image.height) * logoH;
    page.drawImage(image, { x: MARGIN, y: y - logoH, width: logoW, height: logoH });
    headerBottom = y - logoH;
    const textX = MARGIN + logoW + 16;
    let ty = y - 20;
    if (homeName) {
      page.drawText(safe(homeName), { x: textX, y: ty, size: 17, font: bold, color: ACCENT });
      ty -= 20;
    }
    for (const line of wrap(title, bold, 12.5, PAGE_W - MARGIN - textX)) {
      page.drawText(line, { x: textX, y: ty, size: 12.5, font: bold, color: INK });
      ty -= 16;
    }
    headerBottom = Math.min(headerBottom, ty);
  } else {
    let ty = y - 14;
    if (homeName) {
      page.drawText(safe(homeName), { x: MARGIN, y: ty, size: 19, font: bold, color: ACCENT });
      ty -= 24;
    }
    for (const line of wrap(title, bold, 14, CONTENT_W)) {
      page.drawText(line, { x: MARGIN, y: ty, size: 14, font: bold, color: INK });
      ty -= 18;
    }
    headerBottom = ty;
  }
  y = headerBottom - 10;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1.2, color: ACCENT });
  y -= 22;

  // ---- Sections and answers ----
  // The name, contact details and the anonymous question are shown together at
  // the bottom (with the date), so they're left out of the list.
  const bottomIds = new Set(["name", "contact", "anonymous"]);
  let pendingSection: { title: string } | null = null;

  const drawSection = (heading: string) => {
    ensure(40);
    y -= 6;
    page.drawRectangle({ x: MARGIN, y: y - 17, width: CONTENT_W, height: 21, color: BAND });
    page.drawText(safe(heading), { x: MARGIN + 8, y: y - 11, size: 11.5, font: bold, color: ACCENT });
    y -= 30;
  };

  for (const item of items) {
    if (item.type === "section") {
      pendingSection = { title: item.title };
      continue;
    }
    if (bottomIds.has(item.id)) continue;

    const answer = answers[item.id];
    const comment = item.type === "choice" ? answers[`${item.id}:comment`] : undefined;
    const qLines = wrap(item.text, bold, 10, CONTENT_W);
    const aLines = answer ? wrap(answer, regular, 10.5, CONTENT_W - 12) : [];
    const cLines = comment ? wrap(`Comment: ${comment}`, italic, 9.5, CONTENT_W - 12) : [];
    const need = qLines.length * 13 + Math.max(aLines.length, 1) * 14 + cLines.length * 12.5 + 14 + (pendingSection ? 40 : 0);
    ensure(Math.min(need, 140));
    if (pendingSection) {
      drawSection(pendingSection.title);
      pendingSection = null;
    }
    for (const line of qLines) {
      ensure(14);
      page.drawText(line, { x: MARGIN, y: y - 10, size: 10, font: bold, color: INK });
      y -= 13;
    }
    if (aLines.length === 0) {
      ensure(14);
      page.drawText("No answer", { x: MARGIN + 12, y: y - 10, size: 10, font: italic, color: MUTED });
      y -= 14;
    } else {
      for (const line of aLines) {
        ensure(14);
        page.drawText(line, { x: MARGIN + 12, y: y - 10, size: 10.5, font: regular, color: ACCENT });
        y -= 14;
      }
    }
    for (const line of cLines) {
      ensure(13);
      page.drawText(line, { x: MARGIN + 12, y: y - 9, size: 9.5, font: italic, color: MUTED });
      y -= 12.5;
    }
    y -= 8;
  }

  // ---- Bottom: who completed it, and the date ----
  const anonymous = answers["anonymous"] === "Yes";
  const name = !anonymous && answers["name"] ? answers["name"] : "Anonymous";
  const contact = !anonymous ? answers["contact"] : undefined;
  ensure(contact ? 78 : 60);
  y -= 8;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.8, color: RULE });
  y -= 22;
  const nameLines = wrap(name, bold, 11, CONTENT_W - 190);
  page.drawText("Completed by:", { x: MARGIN, y, size: 9.5, font: regular, color: MUTED });
  nameLines.forEach((line, i) => page.drawText(line, { x: MARGIN + 74, y: y - i * 14, size: 11, font: bold, color: INK }));
  page.drawText("Date:", { x: PAGE_W - MARGIN - 160, y, size: 9.5, font: regular, color: MUTED });
  page.drawText(safe(date), { x: PAGE_W - MARGIN - 128, y, size: 11, font: bold, color: INK });
  y -= Math.max(nameLines.length, 1) * 14;
  if (contact) {
    page.drawText("Contact:", { x: MARGIN, y: y - 2, size: 9.5, font: regular, color: MUTED });
    wrap(contact, regular, 10.5, CONTENT_W - 74).forEach((line, i) =>
      page.drawText(line, { x: MARGIN + 74, y: y - 2 - i * 13, size: 10.5, font: regular, color: INK })
    );
  }

  // ---- Footer on every page: the home's details and page numbers ----
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: MARGIN, y: MARGIN + 18 }, end: { x: PAGE_W - MARGIN, y: MARGIN + 18 }, thickness: 0.5, color: RULE });
    if (brandLines) {
      const small = wrap(brandLines, regular, 7.5, CONTENT_W - 70);
      small.slice(0, 2).forEach((line, k) => p.drawText(line, { x: MARGIN, y: MARGIN + 6 - k * 9, size: 7.5, font: regular, color: MUTED }));
    }
    const label = `Page ${i + 1} of ${pages.length}`;
    p.drawText(label, { x: PAGE_W - MARGIN - regular.widthOfTextAtSize(label, 8), y: MARGIN + 6, size: 8, font: regular, color: MUTED });
  });

  return doc.save();
}

// The home's logo is a file in /public, fetched from the site itself. If it can't
// be fetched the PDF is simply made without it.
export async function loadLogo(baseUrl: string, path: string | null) {
  if (!path) return null;
  try {
    const res = await fetch(`${baseUrl}${path}`);
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    return { bytes, type: /\.jpe?g$/i.test(path) ? ("jpg" as const) : ("png" as const) };
  } catch {
    return null;
  }
}
