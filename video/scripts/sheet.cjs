// Tiles frame grabs side by side: node scripts/sheet.cjs out.png a.png b.png …
const sharp = require("../../node_modules/sharp");
const [out, ...files] = process.argv.slice(2);
(async () => {
  const metas = await Promise.all(files.map((f) => sharp(f).metadata()));
  const w = metas[0].width, h = Math.max(...metas.map((m) => m.height));
  await sharp({ create: { width: w * files.length + 8 * (files.length - 1), height: h, channels: 3, background: "#444" } })
    .composite(files.map((f, i) => ({ input: f, left: i * (w + 8), top: 0 })))
    .png().toFile(out);
})();
