// Builds the Cloudflare Worker: workerd-flavoured Prisma client in, OpenNext
// build, then the normal Node client back so local dev keeps working.
import { execSync } from "node:child_process";

const run = (command, env = {}) =>
  execSync(command, { stdio: "inherit", env: { ...process.env, ...env } });

try {
  run("npx opennextjs-cloudflare build", { PRISMA_TARGET: "workers" });
} finally {
  run("node scripts/generate-prisma.mjs", { PRISMA_TARGET: "" });
}
