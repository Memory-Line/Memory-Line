import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// The last subscription details read for each account, kept briefly on each copy of the site.
const STATUS_CACHE_MS = 30_000;
const STATUS_CACHE = new Map<string, { status: string; renews: string | null; changedAt: number | null; at: number }>();

// The account's subscription details and when its password last changed. If the new column isn't in the database
// yet (a test build before the live one has updated it), it is left out rather than breaking every login.
async function readAccount(id: string): Promise<{ subscriptionStatus: string; subscriptionRenewsAt: Date | null; passwordChangedAt: Date | null } | null> {
  try {
    return await prisma.user.findUnique({
      where: { id },
      select: { subscriptionStatus: true, subscriptionRenewsAt: true, passwordChangedAt: true },
    });
  } catch {
    const row = await prisma.user.findUnique({ where: { id }, select: { subscriptionStatus: true, subscriptionRenewsAt: true } });
    return row ? { ...row, passwordChangedAt: null } : null;
  }
}

// True when the password was changed after this login was made (token.iat is in seconds).
function signedInBeforePasswordChange(iat: unknown, changedAt: number | null) {
  return typeof iat === "number" && changedAt !== null && Math.floor(changedAt / 1000) > iat;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionRenewsAt: user.subscriptionRenewsAt?.toISOString() ?? null,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        // Just signed in: the details were read a moment ago, no need to read them again.
        token.subscriptionStatus = (user as any).subscriptionStatus ?? "inactive";
        token.subscriptionRenewsAt = (user as any).subscriptionRenewsAt ?? null;
        token.revoked = false;
        return token;
      }
      // Refresh subscription status so it stays current. It is read from the database at most every 30 seconds per
      // account on each copy of the site (every page, picture and voice request used to cost a database trip).
      if (token.userId) {
        const id = token.userId as string;
        const hit = STATUS_CACHE.get(id);
        if (hit && Date.now() - hit.at < STATUS_CACHE_MS) {
          token.subscriptionStatus = hit.status;
          token.subscriptionRenewsAt = hit.renews;
          token.revoked = signedInBeforePasswordChange(token.iat, hit.changedAt);
          return token;
        }
        const dbUser = await readAccount(id);
        token.subscriptionStatus = dbUser?.subscriptionStatus ?? "inactive";
        token.subscriptionRenewsAt = dbUser?.subscriptionRenewsAt?.toISOString() ?? null;
        const changedAt = dbUser?.passwordChangedAt?.getTime() ?? null;
        token.revoked = signedInBeforePasswordChange(token.iat, changedAt);
        if (STATUS_CACHE.size > 500) STATUS_CACHE.clear();
        STATUS_CACHE.set(id, { status: token.subscriptionStatus as string, renews: token.subscriptionRenewsAt as string | null, changedAt, at: Date.now() });
      }
      return token;
    },
    async session({ session, token }) {
      // The password was changed after this login: treat the device as signed out (pages send it to the login page).
      if (token.revoked) return { ...session, user: undefined } as any;
      if (session.user) {
        (session.user as any).id = token.userId;
        (session.user as any).subscriptionStatus = token.subscriptionStatus;
        (session.user as any).subscriptionRenewsAt = token.subscriptionRenewsAt;
      }
      return session;
    },
  },
};
