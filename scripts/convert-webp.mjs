// Converts PNGs to WebP next to them: `npm run convert:webp` (all of public/images) or `npm run convert:webp -- <dir or file>...`.
// Each image gets lossless WebP (identical pixels), unless lossy q90 is smaller AND visually identical (PSNR >= 48 dB,
// e.g. soft gradient backgrounds). Line art (stickers, cards) fails that bar on its edges, so it stays lossless.
// The PNG is then moved to png-originals/ (same sub-path), so nothing is lost and public/ ships only the WebP.
import { mkdir, readdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import sharp from "sharp";

const targets = process.argv.slice(2);
const roots = targets.length ? targets : ["public/images"];
const MIN_PSNR = 48;

async function* pngs(path) {
  if ((await stat(path)).isFile()) {
    if (/\.png$/i.test(path)) yield path;
    return;
  }
  for (const entry of await readdir(path, { withFileTypes: true })) yield* pngs(join(path, entry.name));
}

const rgba = (input) => sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

// PSNR with colour errors weighted by the original alpha, so differences in fully transparent pixels don't count.
function psnr(a, b) {
  if (a.info.width !== b.info.width || a.info.height !== b.info.height) return -Infinity;
  let se = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const alpha = a.data[i + 3] / 255;
    for (let c = 0; c < 4; c++) {
      const d = (c === 3 ? 1 : alpha) * (a.data[i + c] - b.data[i + c]);
      se += d * d;
    }
  }
  return se === 0 ? Infinity : 10 * Math.log10((255 * 255) / (se / a.data.length));
}

let before = 0;
let after = 0;
for (const root of roots) {
  for await (const file of pngs(root)) {
    const original = await readFile(file);
    const source = await rgba(original);
    const lossless = await sharp(original).keepIccProfile().webp({ lossless: true, effort: 6 }).toBuffer();
    // Lossless WebP drops the colour of fully transparent pixels; every visible pixel must still match exactly.
    if (psnr(source, await rgba(lossless)) !== Infinity) throw new Error(`${file}: lossless WebP changed visible pixels`);
    const lossy = await sharp(original).keepIccProfile().webp({ quality: 90, alphaQuality: 100, smartSubsample: true, effort: 6 }).toBuffer();
    const score = psnr(source, await rgba(lossy));
    const useLossy = lossy.length < lossless.length && score >= MIN_PSNR;
    const best = useLossy ? lossy : lossless;

    const out = file.replace(/\.png$/i, ".webp");
    await writeFile(`${out}.tmp`, best);
    await rename(`${out}.tmp`, out);
    const backup = join("png-originals", relative("public", file));
    await mkdir(dirname(backup), { recursive: true });
    await rename(file, backup);

    before += original.length;
    after += best.length;
    console.log(`${useLossy ? "lossy   " : "lossless"} ${out}: ${kb(original.length)} -> ${kb(best.length)}${useLossy ? ` (PSNR ${score.toFixed(1)} dB)` : ""}`);
  }
}
console.log(`\nTotal: ${kb(before)} -> ${kb(after)} (${before ? Math.round((1 - after / before) * 100) : 0}% smaller). PNGs moved to png-originals/.`);

function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}
