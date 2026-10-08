import type { NextConfig } from "next";

const securityHeaders = [
  // Clickjacking: the admin login/dashboard has no business being framed.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  // HSTS only bites once served over HTTPS, harmless in local dev over HTTP.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

/**
 * Cloudflare rejects a Worker over 64 MiB uncompressed. Tracing pulls in the
 * Prisma command line tools (an embedded database, the schema engine, and query
 * compilers for other databases) because a file pattern in the WebAssembly
 * loader matches most of node_modules. None of it runs on the live site, so it
 * stays out of the bundle.
 */
const NOT_NEEDED_AT_RUNTIME = [
  "node_modules/prisma/**",
  "node_modules/@prisma/dev/**",
  "node_modules/@prisma/studio-core/**",
  "node_modules/@prisma/engines/**",
  "node_modules/@prisma/fetch-engine/**",
  "node_modules/@prisma/get-platform/**",
  "node_modules/@prisma/config/**",
  "node_modules/@electric-sql/**",
  "node_modules/typescript/**",
  "node_modules/esbuild/**",
  "node_modules/@esbuild/**",
  "node_modules/wrangler/**",
  "node_modules/miniflare/**",
  "node_modules/workerd/**",
  "node_modules/@cloudflare/workerd-*/**",
  // Query compilers for databases we don't use (only PostgreSQL is needed).
  "node_modules/@prisma/client/runtime/*mysql*",
  "node_modules/@prisma/client/runtime/*sqlite*",
  "node_modules/@prisma/client/runtime/*sqlserver*",
  "node_modules/@prisma/client/runtime/*cockroachdb*",
  // The Cloudflare build imports the query compiler as a WebAssembly module
  // (see scripts/generate-prisma.mjs), so the base64 copy is dead weight there.
  // Everywhere else (Netlify, `next start`) Prisma loads exactly that copy, and
  // leaving it out breaks every database query.
  ...(process.env.PRISMA_TARGET === "workers"
    ? ["node_modules/@prisma/client/runtime/*wasm-base64*"]
    : []),
];

const nextConfig: NextConfig = {
  outputFileTracingExcludes: { "*": NOT_NEEDED_AT_RUNTIME },
  // On Cloudflare there is no image optimiser behind /_next/image, so every
  // image went through the Worker and came back full size, slowly. The images
  // in public/ are sized for the web already, so they're served as-is
  // straight from the CDN, with long-lived caching for the hashed imports.
  images: { unoptimized: true },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
