import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Admin only: reads a short sample with any Azure voice, so the admin can compare voices and choose.
// Nothing is saved. The voice name must look like an Azure voice name.
const SAMPLE =
  "Hello, I'm Penny. Over the next few minutes, I'll show you how small moments can make a big difference to someone's day. Meet Margaret. She was a seamstress for forty years. So when someone puts a bingo card in front of her, it doesn't mean much. But give her a bag of buttons to sort, and her face lights up.";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const u = new URL(req.url);
  const voice = u.searchParams.get("voice") ?? "";
  const style = u.searchParams.get("style") ?? "";
  const rate = Number(u.searchParams.get("rate") ?? "-4");
  if (!/^[A-Za-z]{2,3}-[A-Za-z]{2,4}-[A-Za-z0-9:]+$/.test(voice) || voice.length > 60) return NextResponse.json({ error: "Bad voice" }, { status: 400 });
  if (style && !/^[a-z-]{3,30}$/.test(style)) return NextResponse.json({ error: "Bad style" }, { status: 400 });
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) return NextResponse.json({ error: "Speech is not set up" }, { status: 503 });

  const lang = voice.split("-").slice(0, 2).join("-");
  const r = Math.max(-20, Math.min(10, Number.isFinite(rate) ? rate : -4));
  const body = `<prosody rate="${r}%">${esc(SAMPLE)}</prosody>`;
  const inner = style ? `<mstts:express-as style="${style}">${body}</mstts:express-as>` : body;
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${lang}"><voice name="${voice}">${inner}</voice></speak>`;
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
    if (!res.ok) return NextResponse.json({ error: `Not available on this account (${res.status})` }, { status: 502 });
    return new NextResponse(Buffer.from(await res.arrayBuffer()), { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Speech failed" }, { status: 502 });
  }
}
