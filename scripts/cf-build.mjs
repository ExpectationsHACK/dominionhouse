// Builds the Cloudflare Worker: workerd-flavoured Prisma client in, OpenNext
// build, then the normal Node client back so local dev keeps working.
import { execSync } from "node:child_process";
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const run = (command, env = {}) =>
  execSync(command, { stdio: "inherit", env: { ...process.env, ...env } });

// Cloudflare refuses the whole deploy if any static asset is over 25 MiB.
const ASSETS = ".open-next/assets";
const MAX_ASSET_BYTES = 25 * 1024 * 1024;

function filesUnder(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

/** Leave oversized files in public/ out of the upload, loudly, instead of failing. */
function skipOversizedAssets() {
  const oversized = filesUnder(ASSETS).filter((path) => statSync(path).size > MAX_ASSET_BYTES);
  if (!oversized.length) return;
  const paths = oversized.map((path) => `/${relative(ASSETS, path).replaceAll("\\", "/")}`);
  writeFileSync(join(ASSETS, ".assetsignore"), `${paths.join("\n")}\n`);
  console.warn(
    `\n⚠ Not deploying ${paths.length} file(s) over 25 MiB (Cloudflare's limit); they will 404 in production:\n` +
      paths.map((path) => `  ${path}`).join("\n") +
      "\n  Compress them (or host them elsewhere) if the site needs them.\n",
  );
}

try {
  run("npx opennextjs-cloudflare build", { PRISMA_TARGET: "workers" });
  skipOversizedAssets();
} finally {
  run("node scripts/generate-prisma.mjs", { PRISMA_TARGET: "" });
}
