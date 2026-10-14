import { createHmac, timingSafeEqual } from "crypto";

// Signed tokens, so the training needs no database and keeps nothing about staff. A token is
// base64url(JSON) + "." + a signature made with the site's secret, so it cannot be forged or edited.
function secret() {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is not set");
  return s;
}

const sign = (body: string) => createHmac("sha256", secret()).update(body).digest("base64url");

export function makeToken(payload: Record<string, unknown>) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

// Returns the payload if the signature is right and it has not expired (payload.x is an expiry in ms).
export function readToken<T extends Record<string, unknown>>(token: unknown, kind: string): (T & { x: number }) | null {
  if (typeof token !== "string") return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.k !== kind || typeof payload.x !== "number" || payload.x < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// A readable certificate number made from the details on the certificate (not stored anywhere).
export function certificateNumber(name: string, courseKey: string, day: string) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const h = createHmac("sha256", secret()).update(`${name}|${courseKey}|${day}`).digest();
  let out = "";
  for (let i = 0; i < 10; i++) out += alphabet[h[i] % alphabet.length];
  return `AC-${out}`;
}
