import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { list, put } from "@vercel/blob";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Natural voices for the talking boards. The first time a phrase is needed it is
// made by Azure Speech and saved in Blob storage; after that it is played from storage.
// Pilot: admin only. Before this opens to customers it must only speak text that is on a board.
const VOICES: Record<string, Record<string, string>> = {
  en: { female: "en-GB-SoniaNeural", male: "en-GB-RyanNeural" },
  pl: { female: "pl-PL-ZofiaNeural", male: "pl-PL-MarekNeural" },
  ur: { female: "ur-PK-UzmaNeural", male: "ur-PK-AsadNeural" },
  ro: { female: "ro-RO-AlinaNeural", male: "ro-RO-EmilNeural" },
  pt: { female: "pt-PT-RaquelNeural", male: "pt-PT-DuarteNeural" },
  es: { female: "es-ES-ElviraNeural", male: "es-ES-AlvaroNeural" },
  fr: { female: "fr-FR-DeniseNeural", male: "fr-FR-HenriNeural" },
};
const LOCALE: Record<string, string> = { en: "en-GB", pl: "pl-PL", ur: "ur-PK", ro: "ro-RO", pt: "pt-PT", es: "es-ES", fr: "fr-FR" };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const u = new URL(req.url);
  const lang = u.searchParams.get("lang") ?? "";
  const voice = u.searchParams.get("voice") ?? "";
  const text = (u.searchParams.get("text") ?? "").trim();
  const name = VOICES[lang]?.[voice];
  if (!name || !text || text.length > 300) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  const pathname = `speech/${lang}/${voice}/${createHash("sha1").update(text).digest("hex").slice(0, 24)}.mp3`;

  try {
    // Already made? Send them to the saved recording.
    const found = await list({ prefix: pathname, limit: 1 });
    if (found.blobs[0]) return NextResponse.redirect(found.blobs[0].url, 302);

    if (!key || !region) return NextResponse.json({ error: "Speech is not set up" }, { status: 503 });
    const ssml = `<speak version="1.0" xml:lang="${LOCALE[lang]}"><voice name="${name}"><prosody rate="-6%">${esc(text)}</prosody></voice></speak>`;
    const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "ActivityCentral",
      },
      body: ssml,
    });
    if (!res.ok) return NextResponse.json({ error: "Speech failed" }, { status: 502 });
    const audio = Buffer.from(await res.arrayBuffer());
    const saved = await put(pathname, audio, { access: "public", addRandomSuffix: false, contentType: "audio/mpeg" });
    return NextResponse.redirect(saved.url, 302);
  } catch {
    return NextResponse.json({ error: "Speech failed" }, { status: 502 });
  }
}
