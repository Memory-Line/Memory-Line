import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// TEMPORARY, admin only: reads a script in the Bella voice and returns the MP3. Nothing is saved.
// Used to make the voiceover for the "Holding Minds Steady" video; to be removed afterwards.
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const { text } = await req.json().catch(() => ({}));
  if (typeof text !== "string" || !text.trim() || text.length > 4000) return NextResponse.json({ error: "Bad text" }, { status: 400 });
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) return NextResponse.json({ error: "Speech is not set up" }, { status: 503 });

  // No extra pauses: Bella already pauses naturally at full stops, so it flows like a person talking.
  const body = esc(text.trim());
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB"><voice name="en-GB-BellaNeural"><prosody rate="0%">${body}</prosody></voice></speak>`;
  try {
    const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3",
        "User-Agent": "ActivityCentral",
      },
      body: ssml,
    });
    if (!res.ok) return NextResponse.json({ error: `Speech failed (${res.status})` }, { status: 502 });
    return new NextResponse(Buffer.from(await res.arrayBuffer()), { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Speech failed" }, { status: 502 });
  }
}
