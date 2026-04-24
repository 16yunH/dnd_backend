import { logger } from "../lib/logger.js";

type PrismaClient = object;

let prisma: PrismaClient | null = null;

const PRisma_CLIENT_PATH = "../../generated/prisma/client.js";

export async function getPrismaClient(): Promise<PrismaClient> {
  if (prisma) return prisma;

  try {
    const mod = await import(PRisma_CLIENT_PATH) as any;
    const PrismaClient = mod.PrismaClient;
    const adapterMod = await import("@prisma/adapter-pg");
    const PrismaPg = adapterMod.PrismaPg;

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set");

    const adapter = new PrismaPg({ connectionString });
    const client = new PrismaClient({ adapter }) as PrismaClient;
    await (client as any).$connect();
    prisma = client;
    logger.info("prisma: connected to postgresql");
    return prisma;
  } catch (err) {
    prisma = null;
    throw err;
  }
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await (prisma as any).$disconnect();
    prisma = null;
  }
}
