import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      // Prisma Postgres suspends an idle database and wakes it on demand, and
      // that cold start has been measured at over a minute. A short connection
      // timeout turns a slow first request into a hard failure, so allow for it.
      connectionTimeoutMillis: 120_000,
      // The endpoint pools server-side, so hold very little here and recycle
      // before it closes a socket underneath us.
      idleTimeoutMillis: 10_000,
      max: 5,
      keepAlive: true,
    }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
