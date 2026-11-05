"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, LoaderCircle, RotateCcw } from "lucide-react";
import { archetypeOrder } from "@/lib/quiz";
import { Button, Logo, MobileBar, TopBar } from "@/components/ui";

const STEPS = ["Answers received", "Matching your archetypes", "Preparing your report"];
// Timings from the animated mockup: each running step takes ~3s, then a short hold on the full ring.
const STEP_MS = 3000;
const HOLD_MS = 600;
// Ring fill once each step is done: the first step is done on arrival, the mockup parks at 65% between steps.
const FILL = [0.02, 0.65, 1];
// Grid columns light up in the design's ink / teal / clay; idle dots are faded milk.
const COLUMN_COLORS = ["rgb(46 52 64 / 1)", "rgb(47 111 106 / 1)", "rgb(180 106 85 / 1)"];
const IDLE_DOT = "rgb(245 244 241 / 0.28)";
const WAVE_S = 1.1;
const R = 138.5;
const CIRCUMFERENCE = 2 * Math.PI * R;

// Soft background light that drifts behind the ring (percentages so it fits both the phone and desktop frames).
const BLOBS = [
  { className: "-left-[20%] -top-[2%] size-[300px] bg-sage/65 lg:size-[520px]", x: 30, y: 22, duration: 11 },
  { className: "left-[56%] top-[45%] size-[220px] bg-teal/35 lg:size-[380px]", x: -26, y: -30, duration: 13 },
  { className: "-left-[13%] top-[71%] size-[240px] bg-clay/38 lg:size-[420px]", x: 34, y: -18, duration: 15 },
  { className: "left-[72%] -top-[16%] size-[240px] bg-clay/38 lg:size-[420px]", x: -30, y: 26, duration: 12 },
];

type Props = {
  /** How many answers are being matched. */
  count: number;
  /** The server has returned the result; until then the last step keeps running. */
  ready: boolean;
  failed: boolean;
  onRetry: () => void;
  onDone: () => void;
};

export function Processing({ count, ready, failed, onRetry, onDone }: Props) {
  const [done, setDone] = useState(1);

  useEffect(() => {
    if (done === STEPS.length - 1 && !ready) return;
    const t = setTimeout(done < STEPS.length ? () => setDone(done + 1) : onDone, done < STEPS.length ? STEP_MS : HOLD_MS);
    return () => clearTimeout(t);
  }, [done, ready, onDone]);

  // The ring fills while the active step runs, so it heads for the next step's fill over a whole step.
  const fill = FILL[Math.min(done, STEPS.length - 1)];

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-[5] overflow-hidden">
        {BLOBS.map((b, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full opacity-80 blur-[35px] lg:blur-[60px] ${b.className}`}
            animate={{ x: b.x, y: b.y, scale: 1.12 }}
            transition={{ duration: b.duration, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
          />
        ))}
      </div>
      <TopBar />
      <MobileBar center={<Logo className="h-5 w-auto" />} />
      <section className="flex flex-1 flex-col items-center px-7 pt-28 text-center lg:pt-[70px]">
        <div className="relative grid size-[236px] place-items-center lg:size-[280px]">
          <svg aria-hidden viewBox="0 0 280 280" className="absolute inset-0 size-full -rotate-90">
            <circle cx="140" cy="140" r={R} fill="none" className="stroke-teal" strokeOpacity={0.16} strokeWidth={3} />
            <motion.circle
              cx="140"
              cy="140"
              r={R}
              fill="none"
              className="stroke-teal"
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE * (1 - FILL[0]) }}
              animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - fill) }}
              transition={{ duration: STEP_MS / 1000, ease: "easeInOut" }}
            />
          </svg>
          <motion.div
            className="grid size-[170px] place-items-center rounded-full bg-sage/25 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.18)] backdrop-blur-[4px] lg:size-[200px] lg:border lg:border-white/80"
            animate={{ scale: [1, 1.025, 1] }}
            transition={{ duration: 2.9, ease: "easeInOut", repeat: Infinity }}
          >
            <div className="grid grid-cols-3 gap-2.5 lg:gap-4">
              {Array.from({ length: 9 }, (_, i) => {
                const row = Math.floor(i / 3);
                const col = i % 3;
                return (
                  <motion.span
                    key={i}
                    className="size-3.5 rounded-full lg:size-[18px]"
                    style={{ backgroundColor: IDLE_DOT }}
                    // Diagonal scanning wave: each dot lights up a beat after its top-left neighbour.
                    animate={{ backgroundColor: [IDLE_DOT, COLUMN_COLORS[col], IDLE_DOT], scale: [1, 1.4, 1] }}
                    transition={{ duration: WAVE_S, ease: "easeInOut", repeat: Infinity, delay: (row + col) * 0.16 }}
                  />
                );
              })}
            </div>
          </motion.div>
        </div>

        <p className="mt-8 font-display text-[10px] font-bold tracking-[2px] text-teal uppercase lg:mt-[46px] lg:text-xs lg:tracking-[2.4px]">Almost there</p>
        <h1 className="mt-3 font-display text-balance text-[28px] font-bold text-ink lg:mt-2.5 lg:text-[52px] lg:leading-[63px]">Processing Results</h1>
        <p className="mt-3 max-w-[260px] text-base leading-[22px] text-ink/65 lg:mt-[15px] lg:max-w-none lg:text-xl lg:leading-[26px]">
          Matching your {count} answers to the {archetypeOrder.length} archetypes.
        </p>

        <ol
          aria-live="polite"
          className="mt-9 grid w-full max-w-[800px] gap-4 rounded-[28px] border border-white/95 bg-white/60 px-6 py-[22px] text-left shadow-[0_10px_28px_rgb(46_112_107/0.14)] backdrop-blur-[7px] lg:rounded-[32px] lg:shadow-glass lg:backdrop-blur-[8px] lg:mt-16 lg:h-[100px] lg:grid-cols-3 lg:items-center lg:px-[30px] lg:py-0"
        >
          {STEPS.map((s, i) => {
            const state = i < done ? "done" : i === done ? "active" : "todo";
            return (
              <li
                key={s}
                className={`flex items-center gap-3.5 text-[15px] transition-colors duration-300 lg:gap-3 lg:text-base ${state === "todo" ? "text-ink/40" : "text-ink/90"}`}
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full transition-colors duration-300 lg:size-9 ${
                    state === "done" ? "bg-teal text-white" : state === "active" ? "bg-teal/12 text-teal" : "border-[1.5px] border-ink/40"
                  }`}
                >
                  {state === "done" ? (
                    // Pop in with a slight overshoot when a step completes (the first step is already done on arrival).
                    <motion.span className="grid" initial={i === 0 ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: [0.6, 1.15, 1], opacity: 1 }} transition={{ duration: 0.35 }}>
                      <Check className="size-3.5 lg:size-[18px]" strokeWidth={2.5} />
                    </motion.span>
                  ) : state === "active" ? (
                    <LoaderCircle className="size-4 animate-spin lg:size-5 motion-reduce:animate-none" />
                  ) : null}
                </span>
                {s}
              </li>
            );
          })}
        </ol>

        {failed && (
          <div role="alert" className="mt-6 flex flex-col items-center gap-4 lg:mt-8">
            <p className="text-base text-clay lg:text-lg">We couldn’t work out your result. Check your connection and try again.</p>
            <Button onClick={onRetry} className="w-60">
              <RotateCcw className="size-5" />
              Try Again
            </Button>
          </div>
        )}
      </section>
    </>
  );
}
