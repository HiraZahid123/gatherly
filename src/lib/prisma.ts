import { PrismaClient } from "../generated/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) {
    // Hot-reload guard: if new schema models like eventTemplate are missing on stale global client
    if (!(globalForPrisma.prisma as any).eventTemplate) {
      globalForPrisma.prisma = new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      });
    }
    return globalForPrisma.prisma;
  }

  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

