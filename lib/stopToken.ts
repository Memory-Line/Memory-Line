import { createHmac, timingSafeEqual } from "crypto";

// The link in the "please confirm" email for the Stop emails page. It carries the address and an expiry,
// signed with the site's secret, so nothing has to be stored and nobody can make a link for someone else's address.
const LIFETIME_MS = 48 * 60 * 60 * 1000;

function sign(payload: string) {
  return createHmac("sha256", process.env.NEXTAUTH_SECRET ?? "").update(`stop:${payload}`).digest("base64url");
}

export function makeStopToken(email: string): string {
  const payload = `${Buffer.from(email, "utf8").toString("base64url")}.${Date.now() + LIFETIME_MS}`;
  return `${payload}.${sign(payload)}`;
}

// Returns the address if the token is genuine and not expired, otherwise null.
export function readStopToken(token: string): string | null {
  if (!process.env.NEXTAUTH_SECRET) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encoded, expiry, signature] = parts;
  const expected = sign(`${encoded}.${expiry}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (!(Number(expiry) > Date.now())) return null;
  try {
    return Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }
}
