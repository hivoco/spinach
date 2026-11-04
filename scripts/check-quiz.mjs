// Run with `npm run check` (Node 23.6+ strips the TS types). Covers the code that reads visitor-controlled input
// (the URL and saved browser data) and the scoring.
import assert from "node:assert/strict";
import { topTwo, allPairs, allResults, pairSlug, parsePairSlug } from "../src/lib/quiz.ts";
import { parseProgress, redirectFor, screenFromParams } from "../src/lib/progress.ts";
import { PANEL, pairLayout, reach, visualReach } from "../src/lib/stickers.ts";

// Scoring: most picks win, ties follow archetypeOrder.
assert.deepEqual(topTwo(["artist", "artist", "ruler"]), ["artist", "ruler"]);
assert.deepEqual(topTwo(["ruler", "explorer"]), ["explorer", "ruler"]);
// A pick's secondary archetype (half a point) fills the second slot: "Write your own brief" → maverick + visionary.
assert.deepEqual(topTwo(["maverick"]), ["maverick", "visionary"]);
assert.deepEqual(topTwo([undefined]), ["explorer", "strategist"]);

// Result URLs: every pair round-trips, junk is rejected.
assert.equal(allPairs.length, 90);
for (const pair of allPairs) assert.deepEqual(parsePairSlug(pairSlug(pair)), pair);
for (const bad of ["", "wizard", "sage-and-sage", "sage-and-wizard", "sage-and-ruler-and-artist"]) assert.equal(parsePairSlug(bad), null, bad);
// Single-character results: /result/<archetype>.
assert.equal(allResults.length, 100);
for (const result of allResults) assert.deepEqual(parsePairSlug(pairSlug(result)), result);
assert.deepEqual(parsePairSlug("sage"), ["sage"]);

// Saved progress: good data round-trips, anything tampered or broken is rejected.
const good = { answers: ["sage"], name: "A", email: "a@b.co" };
assert.deepEqual(parseProgress(JSON.stringify(good))?.answers, ["sage"]);
assert.deepEqual(parseProgress(JSON.stringify({ ...good, answers: [null] }))?.answers, [undefined]);
for (const bad of [null, "{not json", JSON.stringify({ ...good, answers: ["wizard"] }), JSON.stringify({ ...good, answers: ["sage", "ruler"] }), JSON.stringify({ ...good, name: 5 })]) {
  assert.equal(parseProgress(bad), null, String(bad));
}

// URL → screen, and where direct visits are sent: no skipping ahead, results need every answer.
const sp = (s) => new URLSearchParams(s);
assert.deepEqual(screenFromParams(sp("q=1")), { step: "quiz", q: 1 });
assert.deepEqual(screenFromParams(sp("q=2")), { step: "intro" });
assert.deepEqual(screenFromParams(sp("step=hacked")), { step: "intro" });
assert.equal(redirectFor({ step: "quiz", q: 1 }, []), null);
assert.deepEqual(redirectFor({ step: "done" }, []), { step: "quiz", q: 1 });
assert.equal(redirectFor({ step: "done" }, ["sage"]), null);

// Result panel, every pair on both layouts: full-size icon; figures the same height (full height except the tightest
// phone pairs); equal edge gaps; icon centred with edge = average of the icon gaps, or moved with all four gaps equal;
// every gap at least `gap`; figures never touch; pills mirrored and fitting.
for (const [name, p] of Object.entries(PANEL)) {
  const px = 1 / (name === "phone" ? 334 : 620);
  for (const pair of allPairs) {
    const [a, b] = pair;
    const { figures: [l, r], scale, icon, iconY, pills: [pl, pr] } = pairLayout(pair, p);
    const at = `${name} ${pair}`;
    const k = p.stickerHeight;
    const half = p.iconHalf;
    const rise = (p.feet - iconY) * p.aspect;
    const look = [(rise - half * p.iconLook) / (scale * k), (rise + half * p.iconLook) / (scale * k)];
    const exact = [(rise - half) / (scale * k), (rise + half) / (scale * k)];
    const gapsAt = (rows) => [l - scale * k * visualReach(a, 0), icon - half - (l + scale * k * reach(a, 1, ...rows)), r - scale * k * reach(b, 0, ...rows) - (icon + half), 1 - r - scale * k * visualReach(b, 1)];
    const [e1, g1, g2, e2] = gapsAt(look);
    const show = [e1, g1, g2, e2].map((g) => Math.round(g / px));
    const real = gapsAt(exact);
    assert.ok(scale >= (name === "phone" ? 0.88 : 1) && scale <= 1, `${at}: scale ${scale}`);
    assert.ok(Math.abs(e1 - e2) <= px && e1 >= p.minEdge - px && e1 <= Math.max(p.edge, p.minEdge) + 20 * px, `${at}: edge gaps ${show}`);
    assert.ok(Math.min(real[1], real[2]) >= p.gap - px, `${at}: touches the icon ${real.map((g) => Math.round(g / px))}`);
    if (icon !== 0.5) assert.ok(Math.abs(g1 - g2) <= px || Math.min(real[1], real[2]) <= p.gap + px, `${at}: moved icon not between the drawings ${show}`); // equal, unless nudged off an outline
    const top = p.feet / ((scale * k) / p.aspect); // panel top, as a fraction of the sticker height
    assert.ok(Math.min(l - scale * k * reach(a, 0, 0, top), 1 - r - scale * k * reach(b, 1, 0, top)) >= p.floor - 1e-9, `${at}: a thin part is too close to the panel edge`);
    for (let h = 0; h < 1; h += 0.01) {
      const y = h * k; // height above the shared feet line
      const ra = reach(a, 1, y / (scale * k), (y + 0.01 * k) / (scale * k)) * scale * k;
      const lb = reach(b, 0, y / (scale * k), (y + 0.01 * k) / (scale * k)) * scale * k;
      assert.ok(r - lb - (l + ra) >= 10 * px, `${at}: figures touch at height ${h.toFixed(2)}`);
    }
    assert.ok(Math.abs(pl - (1 - pr)) < 1e-9 && pl - p.pillHalf >= p.gap - 1e-9 && pr - pl >= 2 * p.pillHalf + p.pillGap - 1e-9, `${at}: pills`);
  }
}

console.log("quiz checks passed");
