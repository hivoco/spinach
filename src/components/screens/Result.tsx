"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { archetypes, blendDescription, blendTagline, blendTitle, type Blend } from "@/lib/quiz";
import { resultPanel, resultPanelMobile } from "@/lib/shapes";
import { PANEL, STICKERS, pairLayout } from "@/lib/stickers";
import { Asset, BackButton, Button, GlassShape, MobileBar, Tag, TopBar } from "@/components/ui";
import { Reveal } from "@/components/Reveal";

type Props = {
  /** Two archetypes, or one for a single-character result. */
  pair: Blend;
  /** Opened from someone else's shared link: talk about "a" blend, and offer the quiz instead of the report. */
  shared?: boolean;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
};

const vars = (v: Record<string, string>) => v as CSSProperties;

export function Result({ pair, shared = false, onNext, onBack, onClose }: Props) {
  const description = blendDescription(pair);
  const tagline = blendTagline(pair);
  const title = blendTitle(pair);
  const single = pair.length === 1;
  const tag = single ? (shared ? "Career archetype" : "You are") : shared ? "A blend of" : "You are a blend of";
  // Per-pair placement (see pairLayout): full-height figures, full-size icon, even gaps, nothing overlapping.
  // A single character stands alone, its visual centre in the middle of the panel, with its pill under it and no icon.
  // Lower-case vars are the phone panel, upper-case the desktop one.
  const solo = { figures: [0.5], scale: 1, pills: [0.5], icon: 0.5, iconY: 0 };
  const phone = pair.length === 2 ? pairLayout(pair, PANEL.phone) : solo;
  const desk = pair.length === 2 ? pairLayout(pair, PANEL.desktop) : solo;
  const pct = (n: number) => `${n * 100}%`;

  return (
    <>
      <TopBar onBack={onBack} onClose={onClose} />
      <MobileBar left={<BackButton onClick={onBack} />} center={<p className="font-display text-[15px] font-semibold text-ink">{shared ? "Career Archetype" : "Your Career Archetype"}</p>} />
      <section className="grid w-full flex-1 content-start px-7 pt-3.5 lg:grid-cols-[620px_minmax(0,560px)] lg:mx-auto lg:max-w-page lg:content-stretch lg:justify-center lg:gap-20 lg:pt-0 lg:pr-20 lg:pl-[120px]">
        <Reveal direction="right" delay={0.15} className="lg:order-2 lg:pt-[67px]">
          <Tag>{tag}</Tag>
          {/* Figma keeps the title on one line: long pairs shrink (~0.53em per character fits the 500px+ column) instead of wrapping. */}
          <h1 style={vars({ "--n": String(title.length) })} className="sr-only lg:not-sr-only lg:mt-5 lg:block lg:font-display lg:text-[length:clamp(30px,calc(940px/var(--n)),50px)] lg:leading-[74px] lg:font-bold lg:text-ink">
            {title}
          </h1>
          <p className="hidden max-w-[500px] text-xl leading-[31px] text-ink/78 lg:mt-6 lg:block lg:min-h-[124px]">{description}</p>
          <p className="mt-[62px] hidden max-w-[520px] font-display text-[26px] leading-9 font-bold text-ink lg:block">{tagline}</p>
          <div className="mt-[38px] hidden lg:block">
            <Button onClick={onNext} className="w-60">
              {shared ? "Take the Quiz" : "Next"}
              <ArrowRight className="size-[22px]" />
            </Button>
          </div>
        </Reveal>

        <Reveal direction="left" className="mt-28 lg:order-1 lg:mt-0 lg:pt-[77px]">
          <GlassShape shape={resultPanel} mobile={resultPanelMobile} className="mx-auto aspect-[334/360] w-full max-w-[374px] lg:aspect-[620/500] lg:max-w-none">
            {pair.map((key, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.15, type: "spring", stiffness: 110, damping: 15 }}
                style={vars({ "--x": pct(phone.figures[i]), "--X": pct(desk.figures[i]), "--h": pct(phone.scale), "--H": pct(desk.scale) })}
                className="absolute inset-x-0 top-[-31.1%] h-[83.3%] lg:top-[-28%] lg:h-[91.4%]"
              >
                {/* Box the exact size of the sticker image (shrunk from the feet only in the tightest phone pairs). Shifting it left by its own
                    width × centre puts the drawing's visual centre on --x, whatever the image width. */}
                <div style={{ translate: `${-STICKERS[key].centre * 100}% 0` }} className="absolute bottom-0 left-(--x) h-(--h) lg:left-(--X) lg:h-(--H)">
                  <Asset
                    src={`/images/archetypes/stickers/${key}.webp`}
                    alt={archetypes[key].name}
                    // Sized by height, not fitted to the slot width, so every sticker stands as tall as the others; wide ones spill past the slot sides.
                    className="block h-full w-auto max-w-none"
                    fallback={
                      // Shows the archetype's card if its sticker file is missing.
                      <Asset src={archetypes[key].image} alt={archetypes[key].name} className="mx-auto mt-[22%] h-[78%] w-auto rounded-2xl object-cover shadow-lg" />
                    }
                  />
                </div>
              </motion.div>
            ))}
            {/* Name pills, separate from the stickers: positioned on the panel itself, mirrored (--p) so the label row is even.
                Same entrance as their figure. Same width for every name (fits the longest, "Indomitable Spirit"). */}
            {pair.map((key, i) => (
              <motion.span
                key={key}
                aria-hidden
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.15, type: "spring", stiffness: 110, damping: 15 }}
                style={vars({ "--p": pct(phone.pills[i]), "--P": pct(desk.pills[i]) })}
                className="absolute top-[53.9%] left-(--p) flex h-[26px] w-[140px] -translate-x-1/2 items-center justify-center rounded-full border border-white/95 bg-white/25 px-2 font-display text-[10px] font-bold tracking-[0.5px] whitespace-nowrap text-ink uppercase lg:top-[70%] lg:left-(--P) lg:h-[34px] lg:w-[196px] lg:bg-white/78 lg:px-4 lg:text-xs lg:tracking-[1.2px]"
              >
                {archetypes[key].name}
              </motion.span>
            ))}
            {/* Blend icon, always full size: dead centre, or moved sideways (--ix) in a tight pair; height from pairLayout (--iy). */}
            {!single && <span
              aria-hidden
              style={vars({ "--ix": pct(phone.icon), "--IX": pct(desk.icon), "--iy": pct(phone.iconY), "--IY": pct(desk.iconY) })}
              className="absolute top-(--iy) left-(--ix) aspect-square w-[21.6%] -translate-1/2 bg-teal [mask:url('/images/ui/result/blend-icon-mask.webp')_center/contain_no-repeat] lg:top-(--IY) lg:left-(--IX) lg:w-[20.3%]"
            />}
            <p className="absolute top-[67.8%] left-1/2 line-clamp-5 w-[85.6%] -translate-x-1/2 text-center text-[14px] leading-[20px] text-ink lg:hidden">{description}</p>
          </GlassShape>
          <p className="mt-5 font-display text-xl leading-7 font-bold text-ink lg:hidden">{tagline}</p>
        </Reveal>
      </section>

      <div className="absolute inset-x-7 bottom-9 lg:hidden">
        <Button onClick={onNext} className="w-full">
          {shared ? "Take the Quiz" : "Get Your Report"}
          <ArrowRight className="size-5" />
        </Button>
      </div>
    </>
  );
}
