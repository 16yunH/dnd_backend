import { logger } from "../lib/logger.js";

let prisma: import("../generated/prisma/client.js").PrismaClient | null = null;

export async function getPrismaClient(): Promise<import("../generated/prisma/client.js").PrismaClient> {
  if (prisma) return prisma;

  try {
    const { PrismaClient } = await import("../generated/prisma/client.js");
    const { PrismaPg } = await import("@prisma/adapter-pg");

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set");

    const adapter = new PrismaPg({ connectionString });
    prisma = new PrismaClient({ adapter });
    await prisma.$connect();
    logger.info("prisma: connected to postgresql");
    return prisma;
  } catch (err) {
    prisma = null;
    throw err;
  }
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
