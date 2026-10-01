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
  return `${url}${url.includes("?") ? "&" : "?"}connection_limit=3&pool_timeout=30`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: datasourceUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
