import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { allResults, blendTagline, blendTitle, pairSlug, parsePairSlug, type ArchetypeKey } from "@/lib/quiz";

// Share preview for each result page: the archetype card(s) with the result's name and tagline.
export const alt = "Career archetype result from the Spinach quiz";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return allResults.map((pair) => ({ pair: pairSlug(pair) }));
}

// Each read is scoped to a fixed folder so the bundler only traces those files, not all of public/.
// The image renderer detects WebP but draws it blank, so the WebP assets are decoded back to PNG here (sharp ships with Next).
const dataUrl = async (buf: Buffer) => `data:image/png;base64,${(await sharp(buf).png().toBuffer()).toString("base64")}`;
const font = (name: string) => readFile(join(process.cwd(), "src", "fonts", "og", name));
const cardImage = async (key: ArchetypeKey) => dataUrl(await readFile(join(process.cwd(), "public", "images", "archetypes", "cards", `${key}.webp`)));
const brandImage = async (name: string) => dataUrl(await readFile(join(process.cwd(), "public", "images", name)));

export default async function Image({ params }: { params: Promise<{ pair: string }> }) {
  // Unknown slugs never reach here (the page 404s first); fall back to a fixed pair just in case.
  const pair = parsePairSlug((await params).pair) ?? allResults[0];
  // The image renderer reads .woff/.ttf, not .woff2, hence the separate copies in src/fonts/og.
  const [bold, semibold, regular, background, logo, cardA, cardB] = await Promise.all([
    font("Montserrat-Bold.woff"),
    font("Montserrat-SemiBold.woff"),
    font("PTSans-Regular.woff"),
    brandImage("backgrounds/app-background.webp"),
    brandImage("brand/spinach-logo.webp"),
    cardImage(pair[0]),
    pair[1] ? cardImage(pair[1]) : null,
  ]);

  const card = (src: string, style: Record<string, string | number>) => (
    // eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img>
    <img
      src={src}
      width={190}
      height={448}
      style={{ position: "absolute", borderRadius: 26, boxShadow: "0 24px 48px rgba(46,52,64,0.28)", objectFit: "cover", ...style }}
      alt=""
    />
  );

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#edf0ed", fontFamily: "PT Sans" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> */}
        <img src={background} width={1200} height={630} style={{ position: "absolute", inset: 0, objectFit: "cover" }} alt="" />
        <div style={{ position: "absolute", left: 72, top: 0, bottom: 0, width: 620, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> */}
          <img src={logo} width={167} height={34} alt="" />
          <div
            style={{
              marginTop: 40,
              display: "flex",
              alignSelf: "flex-start",
              padding: "10px 20px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(255,255,255,0.95)",
              fontFamily: "Montserrat",
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: 2,
              color: "#2f6f6a",
            }}
          >
            MY CAREER ARCHETYPE
          </div>
          <div style={{ marginTop: 22, fontFamily: "Montserrat", fontWeight: 700, fontSize: 58, lineHeight: 1.15, color: "#2e3440" }}>{blendTitle(pair)}</div>
          <div style={{ marginTop: 20, fontFamily: "Montserrat", fontWeight: 600, fontSize: 28, lineHeight: 1.35, color: "#2f6f6a" }}>{blendTagline(pair)}</div>
          <div style={{ marginTop: 34, fontSize: 24, color: "#3c3f45" }}>Find yours: 1 short scenario, under a minute.</div>
        </div>
        {cardB ? card(cardA, { left: 742, top: 104, transform: "rotate(-6deg)" }) : card(cardA, { left: 832, top: 91 })}
        {cardB && card(cardB, { left: 922, top: 78, transform: "rotate(5deg)" })}
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Montserrat", data: bold, weight: 700, style: "normal" },
        { name: "Montserrat", data: semibold, weight: 600, style: "normal" },
        { name: "PT Sans", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
