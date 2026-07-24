import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

/** Bump when `schema.prisma` changes so dev HMR does not keep a stale client. */
const PRISMA_CLIENT_BUILD_ID = "2026-07-24-sidebar-sectionKey";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaBuildId: string | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrismaClient(): PrismaClient {
  if (
    process.env.NODE_ENV !== "production" &&
    globalForPrisma.prismaBuildId !== PRISMA_CLIENT_BUILD_ID
  ) {
    void globalForPrisma.prisma?.$disconnect().catch(() => {});
    globalForPrisma.prisma = undefined;
    globalForPrisma.prismaBuildId = PRISMA_CLIENT_BUILD_ID;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();
