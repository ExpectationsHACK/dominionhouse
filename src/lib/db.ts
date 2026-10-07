import { after } from "next/server";
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
    const fresh = createClient({ max: 1 });
    perRequest.set(key, fresh);
    releaseAfterResponse(fresh);
    client = fresh;
  }
  return client;
}

/**
 * Each client starts its own copy of Prisma's WebAssembly query engine and
 * opens a socket. Left to the garbage collector, a busy isolate piled them up
 * until it ran past Cloudflare's memory limit (error 1102), so each one is shut
 * down as soon as its response has gone out.
 */
function releaseAfterResponse(client: PrismaClient) {
  const release = () => client.$disconnect().catch(() => {});
  try {
    after(release);
  } catch {
    // Outside a request scope after() isn't available; give the request's own
    // work a generous head start, then release.
    const context = (globalThis as Record<symbol, { ctx?: { waitUntil?: (p: Promise<unknown>) => void } } | undefined>)[
      CLOUDFLARE_CONTEXT
    ];
    context?.ctx?.waitUntil?.(new Promise((resolve) => setTimeout(resolve, 20_000)).then(release));
  }
}

const onWorkers =
  typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function currentClient(): PrismaClient {
  if (onWorkers) return clientForThisRequest();

  // Node: one shared client (kept across dev reloads).
  globalForPrisma.prisma ??= createClient({ max: 5 });
  return globalForPrisma.prisma;
}

/**
 * The client is created on first use, not when this file is imported, so a
 * build that never touches the database (`next build` collects route config
 * without querying) doesn't need DATABASE_URL to be set.
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = currentClient();
    const value = Reflect.get(client, property);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
