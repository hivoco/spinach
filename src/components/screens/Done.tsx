"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { asset } from "@/lib/assets";
import { Logo, MobileBar, TopBar } from "@/components/ui";

// Card sizes from Figma: 334×316 on phones, 600×640 on desktop.
const PHONE = { w: 334, h: 316 };
const DESK = { w: 600, h: 640 };
type XYS = [number, number, number];

// Sparkles then dots, as [left, top, size] in px inside each card.
const PHONE_BITS: XYS[] = [
  [63, 57, 22], [259, 63, 18], [45, 189, 16], [271, 203, 24], [117, 25, 14], [218, 262, 16],
  [87, 115, 8], [237, 125, 10], [203, 39, 7], [99, 261, 9], [297, 151, 6],
];
const DESK_BITS: XYS[] = [
  [131.7, 146.6, 37.4], [464.9, 156.8, 30.6], [101.1, 371, 27.2], [485.3, 394.8, 40.8], [223.5, 92.2, 23.8], [386.7, 530.8, 27.2],
  [172.5, 245.2, 13.6], [427.5, 262.2, 17], [369.7, 116, 11.9], [192.9, 493.4, 15.3], [529.5, 306.4, 10.2],
];
const SRC = [...Array.from({ length: 6 }, (_, i) => `sparkle-${i}`), ...Array.from({ length: 5 }, (_, i) => `dot-${i}`)];
const pct = (n: number, of: number) => `${(n / of) * 100}%`;

/** Phone (--l/--t/--w) and desktop (--L/--T/--W) placements, read by the classes below. */
const at = (phone: XYS, desk: XYS) =>
  ({
    "--l": pct(phone[0], PHONE.w), "--t": pct(phone[1], PHONE.h), "--w": pct(phone[2], PHONE.w),
    "--L": pct(desk[0], DESK.w), "--T": pct(desk[1], DESK.h), "--W": pct(desk[2], DESK.w),
  }) as CSSProperties;
const PLACE = "absolute left-(--l) top-(--t) w-(--w) lg:left-(--L) lg:top-(--T) lg:w-(--W)";
const CENTRED = `${PLACE} aspect-square -translate-1/2`;

// Centred pieces: [x centre, y centre, width] in each card.
const RING_OUTER = at([162, 159, 262], [300, 320, 445.4]);
const RING_MID = at([162, 159, 196], [300, 320, 333.2]);
const HALO = at([162, 159, 185], [300, 320, 315]);
const DISC = at([162, 168.4, 160], [300, 336, 272]);
const CHECK = at([162, 159, 56], [300, 320, 95.2]);

const EASE = { ease: [0.22, 1, 0.36, 1] } as const; // smooth ease-out, like Figma's Smart Animate "Gentle"
/** Fades in while growing from `from` × its final size. */
const grow = (from: number, delay: number) => ({
  initial: { scale: from, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { ...EASE, duration: 0.7, delay },
});

/** Thank-you screen. On phones the content is centred in the space below the bar (pb offsets the 68px bar). */
export function Done() {
  return (
    <>
      <TopBar />
      <MobileBar left={<Logo className="h-[23px] w-auto" />} />
      <section className="grid w-full flex-1 content-center px-7 pb-[68px] lg:pb-0 lg:grid-cols-[600px_minmax(0,560px)] lg:content-start lg:mx-auto lg:max-w-page lg:items-center lg:justify-center lg:gap-20 lg:px-0 lg:pt-[50px] lg:pr-20 lg:pl-[120px]">
        <div className="relative aspect-[334/316] w-full rounded-[34px] border border-white/95 bg-linear-to-b from-white/14 to-white/8 shadow-[0_10px_28px_rgb(46_112_107/0.14)] lg:aspect-[600/640] lg:rounded-[48px] lg:from-white/70 lg:to-white/38 lg:shadow-glass lg:backdrop-blur-[15px]">
          {/* Figma prototype G8 (motion start → end): rings and glow grow out of the disc, the disc grows and the check
              fades in, then the sparkles and dots burst outwards from the centre. Start sizes are Figma's start frame. */}
          <motion.span aria-hidden style={RING_OUTER} className={`${CENTRED} rounded-full border-[1.5px] border-teal/14`} {...grow(110 / 262, 0.1)} />
          <motion.span aria-hidden style={RING_MID} className={`${CENTRED} rounded-full border-[1.5px] border-teal/24`} {...grow(110 / 196, 0.05)} />
          <motion.img aria-hidden alt="" src={asset("/images/ui/thank-you/check-halo.webp")} style={HALO} className={CENTRED} {...grow(0.4, 0)} />

          <motion.div initial={{ scale: 64 / 120 }} animate={{ scale: 1 }} transition={{ ...EASE, duration: 0.7 }} className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative Figma export */}
            <img aria-hidden alt="" src={asset("/images/ui/thank-you/check-disc.webp")} style={DISC} className={CENTRED} />
            <motion.span style={CHECK} className={`${CENTRED} text-white`} {...grow(24 / 56, 0.25)}>
              <Check aria-hidden className="size-full" strokeWidth={1.25} />
            </motion.span>
          </motion.div>

          {SRC.map((name, i) => (
            // Each bit sits in a card-sized layer scaled from the centre, so it starts as a speck on the disc and flies out to its place.
            <motion.div
              key={name}
              aria-hidden
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...EASE, duration: 0.8, delay: 0.3 + i * 0.04 }}
              className="absolute inset-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- decorative Figma export */}
              <img alt="" src={asset(`/images/ui/thank-you/${name}.webp`)} style={at(PHONE_BITS[i], DESK_BITS[i])} className={`${PLACE} aspect-square`} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...EASE, duration: 0.6, delay: 0.45 }}
          className="mt-6 text-center lg:mt-0 lg:text-left"
        >
          <h1 className="font-display text-[38px] leading-[46px] font-bold text-balance text-ink lg:text-[62px] lg:leading-[72px]">
            Thank you for taking the quiz
          </h1>
          <p className="mx-auto mt-[18px] max-w-[300px] text-base leading-[22px] text-ink/80 lg:mx-0 lg:mt-[26px] lg:max-w-[480px] lg:text-[21px] lg:leading-[31px] lg:text-ink/65">
            Your Career Archetype report is ready to download or share.
          </p>
        </motion.div>
      </section>
    </>
  );
}
