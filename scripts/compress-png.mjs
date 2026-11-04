// Losslessly recompresses PNGs in place: `npm run compress:png` (all of public/) or `npm run compress:png -- <dir or file>...`.
// A file is replaced only when the new one is smaller AND decodes to exactly the same pixels, so quality never changes.
import { readdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const targets = process.argv.slice(2);
const roots = targets.length ? targets : ["public"];

async function* pngs(path) {
  if ((await stat(path)).isFile()) {
    if (/\.png$/i.test(path)) yield path;
    return;
  }
  for (const entry of await readdir(path, { withFileTypes: true })) yield* pngs(join(path, entry.name));
}

const pixels = (input) => sharp(input).raw().toBuffer({ resolveWithObject: true });
const samePixels = (a, b) =>
  a.info.width === b.info.width && a.info.height === b.info.height && a.info.channels === b.info.channels && a.data.equals(b.data);

let before = 0;
let after = 0;
for (const root of roots) {
  for await (const file of pngs(root)) {
    const original = await readFile(file);
    before += original.length;
    const meta = await sharp(original).metadata();
    // 16-bit PNGs would come out as 8-bit, which is a quality loss: leave them alone.
    if (meta.depth !== "uchar") {
      console.log(`skip  ${file} (${meta.depth} bit depth)`);
      after += original.length;
      continue;
    }
    // Lossless settings only: palette/quality/effort would quantise colours. Keep the colour profile so colours don't shift.
    const candidates = await Promise.all(
      [true, false].map((adaptiveFiltering) => sharp(original).keepIccProfile().png({ compressionLevel: 9, adaptiveFiltering }).toBuffer()),
    );
    const best = candidates.reduce((a, b) => (b.length < a.length ? b : a));
    if (best.length >= original.length || !samePixels(await pixels(original), await pixels(best))) {
      console.log(`keep  ${file} (already as small as it gets losslessly)`);
      after += original.length;
      continue;
    }
    // Write next to the file, then swap, so an interrupted run never leaves a half-written PNG.
    await writeFile(`${file}.tmp`, best);
    await rename(`${file}.tmp`, file);
    after += best.length;
    console.log(`saved ${file}: ${kb(original.length)} -> ${kb(best.length)}`);
  }
}
console.log(`\nTotal: ${kb(before)} -> ${kb(after)} (${before ? Math.round((1 - after / before) * 100) : 0}% smaller), pixels unchanged.`);

function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}
