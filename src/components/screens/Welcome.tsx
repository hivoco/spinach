"use client";

import { useRef } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { ChevronsRight, Sparkles } from "lucide-react";
import { archetypeOrder, questions } from "@/lib/quiz";
import { Logo } from "@/components/ui";
import { CardArc } from "@/components/CardArc";
import { Reveal } from "@/components/Reveal";

export function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <section className="flex w-full flex-1 flex-col lg:mx-auto lg:max-w-page lg:flex-row lg:items-center lg:justify-center lg:gap-20 lg:p-10">
      <Reveal direction="left" className="relative h-[500px] w-full shrink-0 overflow-hidden rounded-br-[44px] rounded-bl-[34px] border border-x-0 border-t-0 border-white bg-teal/20 shadow-[0_10px_20px_rgb(47_111_106/0.25)] backdrop-blur-[4px] lg:aspect-auto lg:h-[820px] lg:w-[700px] lg:rounded-[48px] lg:border-x lg:border-t lg:shadow-glass lg:backdrop-blur-[12px]">
        {/* Figma halo and ring (A1 390×500 hero, D1 700×820 hero): true circles sized by width (aspect-square), positions as % of the hero. */}
        <span aria-hidden className="absolute -top-[30%] left-[28.2%] aspect-square w-[102.6%] rounded-full bg-[radial-gradient(circle,#7fafa8_0%,#fff_100%)] opacity-20 lg:top-[-30%] lg:left-[30.06%] lg:w-[93.7%]" />
        <span aria-hidden className="absolute top-[42%] -left-[30.8%] aspect-square w-[87.2%] rounded-full border-[1.5px] border-milk/80 lg:top-[42%] lg:left-[-23.83%] lg:w-[79.66%]" />

        <CardArc />

        <div className="pointer-events-none relative z-[200] flex items-center justify-between px-7 pt-6 lg:px-[43px] lg:pt-[43px]">
          <Logo className="h-[21px] w-auto lg:h-[30px]" link={false} />
          <span className="flex h-[31px] items-center rounded-full bg-teal px-3.5 font-display text-[10px] font-bold tracking-[0.8px] text-milk uppercase lg:h-[38px] lg:w-40 lg:justify-center lg:text-xs lg:tracking-[1.2px]">
            {archetypeOrder.length} archetypes
          </span>
        </div>
      </Reveal>

      <Reveal direction="right" delay={0.15} className="px-7 pt-[26px] lg:mt-[52px] lg:w-[580px] lg:p-0">
        <span className="inline-flex h-[33px] items-center gap-2 rounded-full border border-[#d6d4ce] bg-white px-3.5 font-display text-xs font-semibold text-ink-2 lg:h-[42px] lg:gap-2.5 lg:px-5 lg:text-[15px] lg:text-ink">
          <span aria-hidden className="size-1.5 rounded-full bg-teal lg:size-2" />
          Takes about 2 minutes
        </span>
        <h1 className="mt-[13px] font-display text-balance text-4xl leading-[1.12] font-bold tracking-[-0.02em] text-ink lg:mt-[26px] lg:text-[62px] lg:leading-[72px] lg:tracking-normal">
          Find your
          <span className="block text-teal">Career Archetype</span>
        </h1>
        <p className="mt-3.5 max-w-80 text-base leading-[1.4] text-ink-2 lg:mt-6 lg:max-w-[500px] lg:text-[21px] lg:leading-[27px]">
          Answer {questions.length} short scenarios and discover the blend of archetypes that shapes how you work.
        </p>
        <SwipeToStart onStart={onStart} />
        <button
          type="button"
          onClick={onStart}
          className="relative mt-[54px] hidden h-[84px] w-[560px] items-center justify-center rounded-full border border-white/95 bg-white/60 font-display text-[19px] font-semibold text-ink shadow-[0_10px_28px_rgb(46_112_107/0.14)] backdrop-blur-[6px] transition hover:bg-white/80 lg:flex"
        >
          Start
        </button>
      </Reveal>
    </section>
  );
}

/**
 * Phone-only start control: drag the knob to the end to start. Keyboard and screen-reader activation
 * (a click with no pointer, detail 0) starts it too, so it never depends on a swipe alone.
 */
function SwipeToStart({ onStart }: { onStart: () => void }) {
  const track = useRef<HTMLButtonElement>(null);
  const started = useRef(false);
  const x = useMotionValue(0);
  const labelOpacity = useTransform(x, [0, 120], [1, 0]);
  const start = () => {
    if (started.current) return;
    started.current = true;
    onStart();
  };
  // Distance the knob can travel: track width minus the knob and its 8px inset on both sides.
  const travel = () => (track.current ? track.current.clientWidth - 56 - 16 : 0);

  return (
    <button
      ref={track}
      type="button"
      aria-label="Start quiz"
      onClick={(e) => e.detail === 0 && start()}
      className="relative mt-[34px] flex h-[72px] w-full items-center rounded-full border border-white bg-white/60 backdrop-blur-[6px] lg:hidden"
    >
      <motion.span style={{ opacity: labelOpacity }} className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-base font-semibold text-ink">
        Swipe to start quiz
      </motion.span>
      <motion.span style={{ opacity: labelOpacity }} className="pointer-events-none absolute right-6 text-teal">
        <ChevronsRight className="size-6" />
      </motion.span>
      <motion.span
        drag="x"
        dragConstraints={track}
        dragElastic={0}
        dragMomentum={false}
        style={{ x }}
        onDragEnd={() => {
          const end = travel();
          if (x.get() > end * 0.75) animate(x, end, { duration: 0.15 }).then(start);
          else animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
        }}
        className="relative ml-2 grid size-14 shrink-0 cursor-grab touch-none place-items-center rounded-full bg-teal text-white active:cursor-grabbing"
      >
        <Sparkles className="size-6" strokeWidth={1.75} />
      </motion.span>
    </button>
  );
}
