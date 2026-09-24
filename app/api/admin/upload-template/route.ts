import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { occasionBySlug } from "@/lib/occasions";
import { videoUrlFor } from "@/lib/videoLinksByFile";
import { LANGUAGE_CATEGORY, languageBySlug } from "@/lib/languages";

// Only the account whose email matches ADMIN_EMAIL can use this route.
// Everyone else (including paying customers) gets a 403.
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (!session?.user?.email || !adminEmail || session.user.email.toLowerCase() !== adminEmail) {
    return null;
  }
  return session;
}

// Strips the leading number, then strips an "Answers" / "Answer Key" /
// "Large Print" marker if present, so a variant file's name reduces to
// the same base title as the worksheet it belongs to. The marker can fall
// anywhere in the name — most people don't prefix it the way the original
// version of this function required: "001-Daisy-Bell.pdf", "Daisy Bell
// Answers.pdf", "Daisy Bell (Large Print).pdf" and "Large-Print-Daisy-Bell.pdf"
// all reduce to the same "Daisy Bell", so whichever way round someone names
// the file, it still matches the standard worksheet.
function baseTitleFromFilename(name: string): string {
  const withoutExt = name.replace(/\.[^/.]+$/, "");
  const withoutLeadingNumber = withoutExt.replace(/^\d+[-_.\s]*/, "");
  const withoutMarker = withoutLeadingNumber
    .replace(/[[(]?\s*(answers?(?:\s*(?:key|sheet))?|large[-_\s]?print)\s*[\])]?/gi, " ")
    .replace(/^[-_.\s]+|[-_.\s]+$/g, "");
  const spaced = withoutMarker.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  return spaced
    .split(" ")
    .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

const LARGE_PRINT_MARKER = /large[-_\s]?print/i;

// When a whole folder is uploaded, Chrome sends each file's path inside
// that folder as its name ("Pack/A3 Large Print/001-tea.pdf"). Only the
// last part is the file's real name.
function baseName(name: string): string {
  return name.split(/[\\/]/).pop() || name;
}

// Matches a stored file name with or without a folder path in front
// (entries saved before folder paths were stripped still have one).
function sameFile(fileName: string) {
  return { OR: [{ fileName }, { fileName: { endsWith: `/${fileName}` } }] };
}

// Like baseTitleFromFilename, but keeps the leading number, so numbered
// series like "001-Bingo-Card.pdf" … "200-Bingo-Card.pdf" (which all share
// the title "Bingo Card") still pair each variant with its own worksheet:
// "137-Bingo-Card-Large-Print.pdf" → "137|bingo card" matches only
// "137-Bingo-Card.pdf". Leading zeros are ignored ("7" = "007"), and so
// are paper size / orientation words, since large print versions are often
// named for their format ("001-garden-bench-colouring-page-a3-landscape.pdf"
// is the large print of "001-garden-bench-colouring-page.pdf").
function matchKey(name: string): { number: string | null; key: string } {
  const withoutExt = name.replace(/\.[^/.]+$/, "");
  const num = withoutExt.match(/^(\d+)[-_.\s]*/);
  const number = num ? String(parseInt(num[1], 10)) : null;
  const words = baseTitleFromFilename(name)
    .toLowerCase()
    .split(" ")
    .filter((w) => !/^(a[0-9]|landscape|portrait)$/.test(w))
    .join(" ");
  return { number, key: `${number ?? ""}|${words}` };
}

export async function POST(req: Request) {
  // Wrap the whole handler: an uncaught exception here (a Blob store
  // limit, a dropped DB connection, anything unexpected) would otherwise
  // bubble up as a bare platform error page with no JSON body. The admin
  // upload page can only show "Upload failed" when that happens, with no
  // way to tell what actually went wrong. Catching it and always
  // returning JSON means the real reason makes it to the screen.
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = formData.get("category") as string | null;
    const title = formData.get("title") as string | null;
    const isAnswer = formData.get("isAnswer") === "true";
    let isLargePrint = formData.get("isLargePrint") === "true";
    // Empty means the regular library; otherwise a calendar occasion slug.
    const occasion = (formData.get("occasion") as string | null) || null;
    // Communication Cards come in several languages; nothing else does.
    const language =
      category === LANGUAGE_CATEGORY ? (formData.get("language") as string | null) || null : null;

    if (!file || !category || !title) {
      return NextResponse.json({ error: "Missing file, category, or title" }, { status: 400 });
    }
    if (occasion && !occasionBySlug(occasion)) {
      return NextResponse.json({ error: `Unknown occasion "${occasion}"` }, { status: 400 });
    }
    if (category === LANGUAGE_CATEGORY && !(language && languageBySlug(language))) {
      return NextResponse.json(
        { error: `Pick a language for ${LANGUAGE_CATEGORY} (got "${language ?? ""}")` },
        { status: 400 }
      );
    }
    const scope = { category, occasion, language };
    const fileName = baseName(file.name);
    // A "Large Print" file uploaded without the checkbox ticked would
    // otherwise become a separate activity instead of attaching to its
    // worksheet. The marker is unambiguous, so treat it as large print.
    if (!isAnswer && LARGE_PRINT_MARKER.test(file.name)) {
      isLargePrint = true;
    }

    const folder = occasion
      ? `occasions/${occasion}/${category}`
      : language
      ? `${category}/${language}`
      : category;
    const blob = await put(`activities/${folder}/${fileName}`, file, {
      access: "public",
      addRandomSuffix: true,
    });

    // Answer sheets and large print files attach to an existing base
    // template rather than creating a new one.
    if (isAnswer || isLargePrint) {
      const baseTitle = baseTitleFromFilename(fileName);
      const variant = matchKey(fileName);
      // Match on the worksheet's file name, number included, so each
      // numbered variant goes to its own worksheet (case-insensitive, and
      // skipping stray variant files that were uploaded as worksheets).
      // If the rest of the name differs, fall back to the one worksheet with
      // that number (only when exactly one has it). Only when one side has
      // no number to compare, fall back to the newest worksheet with the
      // same title. Entries with this exact file name are only used as a
      // last resort: usually they're a stray copy of this variant uploaded
      // as a worksheet, but some packs (Communication Cards) name the large
      // print file exactly like its worksheet.
      const all = (
        await prisma.template.findMany({
          where: scope,
          orderBy: { createdAt: "desc" },
        })
      ).filter((t) => !LARGE_PRINT_MARKER.test(t.fileName));
      const candidates = all.filter((t) => baseName(t.fileName) !== fileName);
      const sameNumber = variant.number
        ? candidates.filter((t) => matchKey(baseName(t.fileName)).number === variant.number)
        : [];
      const existing =
        candidates.find((t) => matchKey(baseName(t.fileName)).key === variant.key) ??
        (sameNumber.length === 1 ? sameNumber[0] : undefined) ??
        candidates.find(
          (t) =>
            (variant.number === null || matchKey(baseName(t.fileName)).number === null) &&
            t.title.toLowerCase() === baseTitle.toLowerCase()
        ) ??
        all.find((t) => baseName(t.fileName) === fileName);

      if (!existing) {
        return NextResponse.json(
          {
            error: `No matching worksheet found for "${fileName}" in category "${category}"${occasion ? ` for occasion "${occasion}"` : ""}${language ? ` (${language})` : ""} (looked for "${variant.number ? `${variant.number} ` : ""}${baseTitle}"). Upload the standard worksheet first.`,
          },
          { status: 400 }
        );
      }

      const updated = await prisma.template.update({
        where: { id: existing.id },
        data: {
          ...(isAnswer ? { answerFileUrl: blob.url } : { largePrintFileUrl: blob.url }),
          // Tidy a worksheet saved with a folder path in its name.
          fileName: baseName(existing.fileName),
        },
      });

      // If this same file was previously uploaded by mistake as its own
      // worksheet (checkbox left unticked), remove that stray entry now
      // that it's attached where it belongs.
      await prisma.template.deleteMany({
        where: { ...scope, ...sameFile(fileName), id: { not: existing.id } },
      });

      return NextResponse.json({ ok: true, template: updated, matched: true });
    }

    // Re-uploading a worksheet (e.g. retrying a folder upload that stopped
    // part way) replaces its file rather than adding a duplicate.
    const previous = await prisma.template.findFirst({
      where: { ...scope, ...sameFile(fileName) },
      orderBy: { createdAt: "desc" },
    });
    if (previous) {
      const replaced = await prisma.template.update({
        where: { id: previous.id },
        data: { fileUrl: blob.url, fileName, videoUrl: videoUrlFor(category, fileName) ?? previous.videoUrl },
      });
      return NextResponse.json({ ok: true, template: replaced, matched: false, replaced: true });
    }

    const template = await prisma.template.create({
      data: {
        title,
        category,
        fileUrl: blob.url,
        fileName,
        occasion,
        language,
        videoUrl: videoUrlFor(category, fileName),
      },
    });

    return NextResponse.json({ ok: true, template, matched: false });
  } catch (err: any) {
    console.error("upload-template failed:", err);
    const message = typeof err?.message === "string" ? err.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
