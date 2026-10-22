import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// On Vercel, every running copy of the site opens its own database
// connections. With Prisma's default pool (several per copy), a burst of
// requests, like a big folder upload, used up the database's connection
// limit and took the whole site down (September 2026). Capping each copy's
// pool keeps well inside it; requests wait briefly for a free connection
// instead of failing. Raised from 1 to 3 (October 2026) — a single
// connection forced every query on a page to run strictly one after
// another, even ones that could run together, which was making ordinary
// page loads (not just big uploads) feel slow. Uploads are separately
// throttled elsewhere (2 at a time), so this isn't relying on this cap
// alone to prevent another overload.
function datasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url || !/^postgres(ql)?:\/\//.test(url) || /[?&]connection_limit=/.test(url)) return undefined;
  // Prisma Postgres has two addresses that differ only in the host: db.prisma.io (direct: very few connections in all)
  // and pooled.db.prisma.io (shares a few real connections between every copy of the site). The site's DATABASE_URL is
  // the direct one (it is also what the build uses to update the database's structure), so the running site switches to
  // the pooled host here, with PgBouncer's pgbouncer=true. Set DB_FORCE_DIRECT=1 in Vercel to turn this off at once.
  // Any other kind of address is used as it is, one connection per copy.
  const pooledUrl = process.env.DB_FORCE_DIRECT ? null : url.replace(/@db\.prisma\.io(?=[:/])/, "@pooled.db.prisma.io");
  const pooled = !!pooledUrl && pooledUrl !== url;
  const base = pooled ? pooledUrl! : url;
  const extra = pooled ? "pgbouncer=true&connection_limit=3&pool_timeout=30" : "connection_limit=1&pool_timeout=30";
  return `${base}${base.includes("?") ? "&" : "?"}${extra}`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: datasourceUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
