import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

// The certificate of completion (A4 landscape). It is a certificate that the person finished the course
// and passed the quiz. It is not a regulated qualification, and the footer says so.
const W = 841.89;
const H = 595.28;
const NAVY = rgb(0.114, 0.169, 0.227);
const GOLD = rgb(0.71, 0.44, 0.29);
const MUTED = rgb(0.42, 0.47, 0.52);

function safe(text: string) {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

function centred(page: ReturnType<PDFDocument["addPage"]>, text: string, font: PDFFont, size: number, y: number, colour = NAVY) {
  const t = safe(text);
  let s = size;
  while (font.widthOfTextAtSize(t, s) > W - 120 && s > 10) s -= 1;
  page.drawText(t, { x: (W - font.widthOfTextAtSize(t, s)) / 2, y, size: s, font, color: colour });
}

export async function makeCertificate(input: {
  name: string;
  courseTitle: string;
  minutes: number;
  score: number;
  total: number;
  completedOn: string;
  homeName: string | null;
  certNo: string;
  logoUrl: string;
}) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([W, H]);
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  page.drawRectangle({ x: 22, y: 22, width: W - 44, height: H - 44, borderColor: NAVY, borderWidth: 3 });
  page.drawRectangle({ x: 32, y: 32, width: W - 64, height: H - 64, borderColor: GOLD, borderWidth: 1 });

  try {
    const res = await fetch(input.logoUrl);
    if (res.ok) {
      const img = await pdf.embedPng(new Uint8Array(await res.arrayBuffer()));
      const d = 62;
      page.drawImage(img, { x: (W - d) / 2, y: H - 62 - d, width: d, height: d });
    }
  } catch {}

  centred(page, "CERTIFICATE OF COMPLETION", serifBold, 34, H - 175);
  centred(page, "This is to certify that", serif, 16, H - 215, MUTED);
  centred(page, input.name, serifBold, 38, H - 268, GOLD);
  centred(page, "has successfully completed the course", serif, 16, H - 305, MUTED);
  centred(page, input.courseTitle, serifBold, 26, H - 345);
  centred(page, `Quiz score: ${input.score} out of ${input.total}   |   Learning time: about ${input.minutes} minutes`, sans, 12, H - 380, MUTED);
  centred(page, `Completed on ${input.completedOn}`, sansBold, 14, H - 410);
  if (input.homeName) centred(page, `Training arranged by ${input.homeName}`, sans, 12, H - 432, MUTED);

  centred(page, "Course provided by Activity Central (activitycentral.co.uk)", sans, 10, 98, MUTED);
  centred(page, `Certificate number ${input.certNo}`, sans, 9.5, 80, MUTED);
  centred(
    page,
    "This certificate shows completion of an online course by Activity Central. It is not a regulated qualification.",
    sans,
    8.5,
    62,
    MUTED
  );
  return Buffer.from(await pdf.save());
}
