import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function createClient(options: { max: number }) {
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
      max: options.max,
      keepAlive: true,
    }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

/**
 * Cloudflare Workers can't share a database connection between requests: a
 * socket opened while serving one request belongs to that request, and reusing
 * it from the next one hangs until the runtime cancels it. So on Workers each
 * request gets its own client (one connection), kept for that request only.
 * OpenNext publishes the current request's context under this global symbol.
 */
const CLOUDFLARE_CONTEXT = Symbol.for("__cloudflare-context__");

function requestKey(): object | null {
  const context = (globalThis as Record<symbol, { ctx?: object } | undefined>)[CLOUDFLARE_CONTEXT];
  return context?.ctx ?? null;
}

const perRequest = new WeakMap<object, PrismaClient>();

function clientForThisRequest(): PrismaClient {
  const key = requestKey();
  if (!key) return createClient({ max: 1 });

  let client = perRequest.get(key);
  if (!client) {
    client = createClient({ max: 1 });
    perRequest.set(key, client);
  }
  return client;
}

const onWorkers =
  typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db: PrismaClient = onWorkers
  ? new Proxy({} as PrismaClient, {
      get(_target, property) {
        const client = clientForThisRequest();
        const value = Reflect.get(client, property);
        return typeof value === "function" ? value.bind(client) : value;
      },
    })
  : (globalForPrisma.prisma ?? createClient({ max: 5 }));

if (!onWorkers && process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
