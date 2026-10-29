import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/log";

// The audit trail: one line for each sensitive thing that happens (an admin deleting or loading activities, free access
// or a plan being changed, sign-ups, password resets, subscription changes, failed logins). Shown on the admin page
// "Audit trail". Writing a line must never get in the way of what is being done, so a problem here is logged and ignored.

type Who = { id?: string | null; email?: string | null };
type Options = { req?: { headers?: unknown } | null; target?: string; detail?: string };

// Where the request came from, from either a standard Request or the plain object NextAuth hands over.
function ipOf(req: Options["req"]): string | null {
  const h = req?.headers as { get?: (k: string) => string | null } & Record<string, unknown> | undefined;
  if (!h) return null;
  const raw = typeof h.get === "function" ? h.get("x-forwarded-for") : (h["x-forwarded-for"] as string | undefined);
  return raw ? String(raw).split(",")[0].trim().slice(0, 64) : null;
}

const cut = (v: string | undefined | null, n: number) => (v ? v.slice(0, n) : null);

// Records something done by a named person (or by nobody in particular, e.g. a failed login).
export async function auditAs(who: Who | null, action: string, opts: Options = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: who?.id ?? null,
        actorEmail: cut(who?.email?.toLowerCase(), 200),
        action: action.slice(0, 80),
        target: cut(opts.target, 300),
        detail: cut(opts.detail, 1000),
        ip: ipOf(opts.req),
        env: process.env.VERCEL_ENV ?? "local",
      },
    });
  } catch (err) {
    logError(`audit:${action}`, err);
  }
}

// Records something done by the signed-in admin.
export async function auditAdmin(req: Options["req"], action: string, opts: Omit<Options, "req"> = {}) {
  let who: Who | null = null;
  try {
    // Loaded when needed: lib/viewer reads the login settings in lib/auth, which itself records failed logins here.
    const { getSession } = await import("@/lib/viewer");
    const session = await getSession();
    who = session?.user ? { id: (session.user as { id?: string }).id ?? null, email: session.user.email ?? null } : null;
  } catch {
    // no session to read: still record what happened
  }
  await auditAs(who, action, { ...opts, req });
}
