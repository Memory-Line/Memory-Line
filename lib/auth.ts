import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auditAs } from "@/lib/audit";

// The last subscription details read for each account, kept briefly on each copy of the site.
const STATUS_CACHE_MS = 30_000;
const STATUS_CACHE = new Map<string, { status: string; renews: string | null; at: number }>();

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
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user) {
          await auditAs(null, "auth.login.failed", { req, target: credentials.email.toLowerCase().slice(0, 200), detail: "no account with that email" });
          return null;
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) {
          await auditAs({ id: user.id, email: user.email }, "auth.login.failed", { req, target: user.email, detail: "wrong password" });
          return null;
        }
        if (process.env.ADMIN_EMAIL && user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()) {
          await auditAs({ id: user.id, email: user.email }, "auth.admin.login", { req });
        }

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
          return token;
        }
        const dbUser = await prisma.user.findUnique({
          where: { id },
          select: { subscriptionStatus: true, subscriptionRenewsAt: true },
        });
        token.subscriptionStatus = dbUser?.subscriptionStatus ?? "inactive";
        token.subscriptionRenewsAt = dbUser?.subscriptionRenewsAt?.toISOString() ?? null;
        if (STATUS_CACHE.size > 500) STATUS_CACHE.clear();
        STATUS_CACHE.set(id, { status: token.subscriptionStatus as string, renews: token.subscriptionRenewsAt as string | null, at: Date.now() });
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId;
        (session.user as any).subscriptionStatus = token.subscriptionStatus;
        (session.user as any).subscriptionRenewsAt = token.subscriptionRenewsAt;
      }
      return session;
    },
  },
};
