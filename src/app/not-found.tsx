import type { Metadata } from "next";
import { Asset, LinkButton, Logo, MobileBar, TopBar } from "@/components/ui";
import { archetypes } from "@/lib/quiz";

export const metadata: Metadata = { title: "Page not found | Spinach" };

// A small fan of archetype cards, with the Explorer in front: the one who wandered off the map.
const FAN = [
  { key: "maverick", className: "-translate-x-[62%] -rotate-[14deg] translate-y-3 opacity-90" },
  { key: "visionary", className: "translate-x-[62%] rotate-[14deg] translate-y-3 opacity-90" },
  { key: "explorer", className: "z-10 -rotate-[3deg]" },
] as const;

export default function NotFound() {
  return (
    <main className="relative flex h-full flex-col">
      <TopBar />
      <MobileBar left={<Logo />} />
      <section className="flex flex-1 flex-col items-center justify-center px-7 pb-16 text-center lg:pb-24">
        <div aria-hidden className="relative h-[190px] w-[78px] lg:h-[262px] lg:w-[108px]">
          {FAN.map(({ key, className }) => (
            <div
              key={key}
              className={`absolute inset-0 overflow-hidden rounded-[14px] shadow-[0_18px_36px_rgb(46_52_64/0.28)] lg:rounded-[18px] ${className}`}
            >
              <Asset src={archetypes[key].image} alt="" className="size-full object-cover" />
            </div>
          ))}
        </div>
        <h1 className="mt-10 font-display text-[32px] leading-tight font-bold text-balance text-ink lg:mt-12 lg:text-[52px]">
          Even explorers take a wrong turn
        </h1>
        <p className="mt-3 max-w-[460px] text-base leading-[22px] text-pretty text-ink/65 lg:mt-4 lg:max-w-[560px] lg:text-xl lg:leading-7">
          This page doesn’t exist. The link may be broken, or the page may have moved.
        </p>
        <div className="mt-9 flex w-full max-w-[334px] flex-col gap-3 lg:mt-10 lg:max-w-none lg:w-auto lg:flex-row lg:gap-4">
          <LinkButton href="/" className="lg:w-60">
            Back to home
          </LinkButton>
          <LinkButton href="/quiz" variant="glass" className="lg:w-60">
            Take the quiz
          </LinkButton>
        </div>
      </section>
    </main>
  );
}
