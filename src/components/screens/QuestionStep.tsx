"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, Info, LayoutGrid } from "lucide-react";
import type { Question } from "@/lib/quiz";
import { questionPanel, questionPanelMobile } from "@/lib/shapes";
import { CardSwap, SlideIn } from "@/components/SlideIn";
import { CloseButton, GlassShape, Logo, MobileBar, Tag, TopBar } from "@/components/ui";

type Props = {
  index: number;
  total: number;
  question: Question;
  /** The picked option's text. */
  selected?: string;
  onSelect: (label: string) => void;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
};

const ADVANCE_MS = 350;
// Last question: time for the flung card to fade out (0.25s) and travel a little before the screen changes.
const FLING_MS = 450;
const pad = (n: number) => String(n).padStart(2, "0");

export function QuestionStep({ index, total, question, selected, onSelect, onNext, onBack, onClose }: Props) {
  const busy = useRef(false);
  const advance = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Only the first question's text slides in; after an answer only the card moves and the text just fades.
  const [firstId] = useState(question.id);
  const [gone, setGone] = useState(false);
  // The phone frame colours the trailing "You…" of a prompt in teal.
  const [, lead, tail] = question.prompt.match(/^(.*?)(You…)?$/) ?? [];

  const pick = (label: string) => {
    if (busy.current) return;
    busy.current = true;
    onSelect(label);
    // Let the choice register visually, then slide to the next question.
    advance.current = setTimeout(() => {
      if (index < total - 1) {
        busy.current = false;
        onNext();
        return;
      }
      // No next card to swap in, so fling this one away first, then leave the screen.
      setGone(true);
      advance.current = setTimeout(() => {
        busy.current = false;
        onNext();
      }, FLING_MS);
    }, ADVANCE_MS);
  };
  // A pending auto-advance must not fire after Close, Back or leaving the screen,
  // or it would move the quiz on after the person has gone somewhere else.
  const cancelAdvance = () => {
    clearTimeout(advance.current);
    busy.current = false;
    setGone(false); // e.g. Close was cancelled in its dialog: bring the card back
  };
  useEffect(() => () => clearTimeout(advance.current), []);
  const close = () => {
    cancelAdvance();
    onClose();
  };
  const back = () => {
    cancelAdvance();
    onBack();
  };

  return (
    <>
      <TopBar onBack={back} onClose={close} lowLogo />
      <MobileBar left={<Logo />} right={<CloseButton onClick={close} />} />
      <div className="grid w-full content-start gap-12 px-7 pt-8 lg:flex-1 lg:grid-cols-[minmax(540px,540fr)_minmax(660px,660fr)] lg:content-stretch lg:mx-auto lg:max-w-page-question lg:gap-20 lg:px-20 lg:pt-0">
        {/* Question text slides in from the left on arrival, then cross-fades between questions. */}
        <AnimatePresence mode="wait">
          <SlideIn key={question.id} from="left" slide={question.id === firstId} className="lg:pt-[67px]">
            <div className="hidden lg:block">
              <Tag>
                Question {pad(index + 1)} / {pad(total)}
              </Tag>
            </div>
            <h1 id={`q-${question.id}`} className="font-display text-[26px] leading-[33px] font-bold text-balance text-ink lg:mt-6 lg:max-w-[540px] lg:text-[46px] lg:leading-[58px]">
              {lead}
              {tail && <span className="text-teal lg:text-ink">{tail}</span>}
            </h1>
            <p className="mt-24 hidden items-center gap-2.5 text-lg text-ink/62 lg:flex">
              <Info aria-hidden className="size-[22px] shrink-0" strokeWidth={1.5} />
              Choose the response that feels most like you.
            </p>
          </SlideIn>
        </AnimatePresence>

        {/* After an answer, only the card is flung away to the left (fading before it reaches the text), revealing the next card beneath it. */}
        <CardSwap id={question.id} gone={gone} delay={0.08} className="self-start lg:mt-[-3px]">
          <GlassShape shape={questionPanel} mobile={questionPanelMobile}>
            <ul role="list" aria-labelledby={`q-${question.id}`} className="flex min-h-[380px] flex-col justify-center gap-[15px] px-5 py-7 lg:min-h-0 lg:gap-[25px] lg:px-8 lg:py-[55px]">
              {question.options.map((o, i) => {
                const on = selected === o.label;
                return (
                  <li key={o.label}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => pick(o.label)}
                      className={`flex min-h-[58px] w-full items-center gap-3 rounded-[28px] py-1.5 pr-4 pl-3 text-left text-[15px] leading-5 text-ink/92 backdrop-blur-[6px] transition lg:min-h-16 lg:gap-6 lg:rounded-[38px] lg:py-2 lg:pr-6 lg:text-xl lg:leading-[26px] ${
                        on ? "border-[1.5px] border-teal/75 bg-teal/14" : "border border-white/95 bg-white/60 hover:bg-white/85"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`grid size-8 shrink-0 place-items-center rounded-full font-display text-[13px] font-bold transition lg:size-11 lg:border lg:border-ink/10 lg:text-base ${
                          on ? "bg-teal text-white" : "border border-ink/10 bg-white/95 text-ink"
                        }`}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      {o.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </GlassShape>
        </CardSwap>
      </div>

      {/* Phone navigation from the mobile frame: back · question counter · forward. */}
      <nav aria-label="Question navigation" className="absolute inset-x-0 bottom-8 flex justify-center lg:hidden">
        <div className="relative flex h-14 w-[322px] items-center justify-between rounded-full border border-white/90 bg-white/55 px-7 backdrop-blur-[10px]">
          <button type="button" onClick={back} aria-label="Previous question" className="rounded-full p-1 text-ink transition hover:bg-white/70 active:bg-white">
            <ArrowLeft className="size-[22px]" />
          </button>
          <button type="button" onClick={() => !busy.current && onNext()} disabled={!selected} aria-label="Next question" className="rounded-full p-1 text-ink transition hover:bg-white/70 active:bg-white disabled:opacity-30 disabled:hover:bg-transparent">
            <ArrowRight className="size-[22px]" />
          </button>
          <span className="absolute top-1/2 left-1/2 flex h-16 w-[150px] -translate-1/2 items-center justify-center gap-2.5 rounded-full border-4 border-white/90 bg-ink/92 font-display text-sm font-semibold text-white tabular-nums backdrop-blur-[12px]">
            <LayoutGrid aria-hidden className="size-[22px]" strokeWidth={1.75} />
            {pad(index + 1)} / {pad(total)}
          </span>
        </div>
      </nav>
    </>
  );
}
