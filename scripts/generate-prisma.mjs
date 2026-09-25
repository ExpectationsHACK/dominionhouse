// Generates the Prisma client.
//
// Normally that is plain `prisma generate`. For the Cloudflare build
// (PRISMA_TARGET=workers) the client is generated with the `workerd` runtime
// instead: Workers can't compile WebAssembly from bytes at runtime, so the
// query compiler has to be imported as a module. That client can't run under
// Node (dev server, seed script), so scripts/cf-build.mjs puts the normal one
// back once the Cloudflare build is done.
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";

if (process.env.PRISMA_TARGET !== "workers") {
  execSync("npx prisma generate", { stdio: "inherit" });
} else {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  if (!schema.includes('provider = "prisma-client"')) throw new Error("Unexpected generator in schema.prisma");

  // Same folder as the real schema, so the relative `output` path still resolves.
  writeFileSync(
    "prisma/schema.workers.prisma",
    schema.replace('provider = "prisma-client"', 'provider = "prisma-client"\n  runtime  = "workerd"'),
  );
  try {
    execSync("npx prisma generate --schema prisma/schema.workers.prisma", { stdio: "inherit" });
  } finally {
    rmSync("prisma/schema.workers.prisma", { force: true });
  }
}
