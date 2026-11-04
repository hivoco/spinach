"use client";

import { useEffect, useRef } from "react";
import { archetypes, archetypeOrder } from "@/lib/quiz";
import { Asset } from "@/components/ui";
import { DESKTOP_QUERY } from "@/lib/breakpoints";

// Card centres per slot k = -4…4 (centre card is k = 0), in a 390px-wide stage.
// Phone values come from the mobile Figma frame; desktop values from D1 (700px hero, scaled to 390).
const PHONE = {
  X: [-274, -158, -42, 74, 195, 316, 432, 548, 664],
  Y: [336, 332, 322, 306, 272, 306, 322, 332, 336],
};
const DESKTOP = {
  X: [-255, -144, -33, 78.5, 194.4, 310.3, 421.6, 533, 644],
  Y: [315, 309, 297, 275, 231.6, 275, 297, 309, 315],
};
const R = [20, 15, 10, 5, 0, -5, -10, -15, -20];
const S = [0.862, 0.862, 0.862, 0.862, 1, 0.862, 0.862, 0.862, 0.862];
const STAGE = 390;
// On phones the cards stop growing past a large phone's width and stay centred in any extra space.
const PHONE_ART_WIDTH = 430;
const SPEED = 1.2; // slots per second
const N = archetypeOrder.length;

// Catmull-Rom through the slot table, so cards glide between slots on a smooth curve.
const cr = (a: number[], i: number, u: number) => {
  const g = (j: number) => a[Math.max(0, Math.min(a.length - 1, j))];
  const [p0, p1, p2, p3] = [g(i - 1), g(i), g(i + 1), g(i + 2)];
  return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
};
const smooth = (x: number) => x * x * (3 - 2 * x);

/** Archetype cards looping along an arc. Drag to scrub; holds still under reduced motion. */
export function CardArc() {
  const box = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const el = box.current!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = matchMedia(DESKTOP_QUERY);
    let t = 2;
    let last = performance.now();
    let frame = 0;
    let drag: { x: number; t: number } | null = null;
    // Sizes only change on resize, so measure then rather than every frame (avoids layout reads between style writes).
    let width = 0;
    let cardW = 0;
    let cardH = 0;
    const measure = () => {
      width = el.clientWidth;
      const first = cards.current[0];
      cardW = first?.offsetWidth ?? 0;
      cardH = first?.offsetHeight ?? 0;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    const render = () => {
      const art = desktop.matches ? width : Math.min(width, PHONE_ART_WIDTH);
      const k = art / STAGE;
      const offsetX = (width - art) / 2;
      const { X, Y } = desktop.matches ? DESKTOP : PHONE;
      cards.current.forEach((card, j) => {
        if (!card) return;
        const p = ((((j - t) % N) + N) % N) - 4;
        const f = Math.max(0, Math.min(7.999, p + 4));
        const i = Math.floor(f);
        const u = f - i;
        const a = Math.abs(p);
        const op = p > 4 ? 0 : a <= 2 ? 1 : 1 - smooth(Math.min(1, a - 2));
        card.style.visibility = op <= 0.001 ? "hidden" : "visible";
        if (op <= 0.001) return;
        const s = cr(S, i, u);
        const x = cr(X, i, u) * k + offsetX - cardW / 2;
        const y = cr(Y, i, u) * k - cardH / 2;
        card.style.opacity = String(op);
        card.style.zIndex = String(Math.round(100 - a * 10));
        card.style.transform = `translate(${x}px, ${y}px) rotate(${-cr(R, i, u)}deg) scale(${s})`;
      });
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduce && !drag) t += dt * SPEED;
      render();
      frame = requestAnimationFrame(tick);
    };

    const down = (e: PointerEvent) => {
      drag = { x: e.clientX, t };
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (drag) t = drag.t - ((e.clientX - drag.x) * STAGE) / width / 118;
    };
    const up = () => (drag = null);

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, []);

  return (
    <div
      ref={box}
      role="img"
      aria-label={`10 career archetypes: ${archetypeOrder.map((k) => archetypes[k].name).join(", ")}`}
      className="absolute inset-0 cursor-grab touch-pan-y select-none active:cursor-grabbing"
    >
      {archetypeOrder.map((key, j) => (
        <div
          key={key}
          ref={(n) => {
            cards.current[j] = n;
          }}
          style={{ visibility: "hidden" }}
          className="pointer-events-none absolute top-0 left-0 aspect-[116/281] w-[min(29.75%,128px)] overflow-hidden rounded-[18px] shadow-[0_18px_36px_rgb(46_52_64/0.28)] will-change-transform lg:aspect-[199.5/483.4] lg:w-[28.5%] lg:rounded-[31px] lg:shadow-[0_31px_62px_rgb(46_52_64/0.28)]"
        >
          <Asset src={archetypes[key].image} alt="" className="size-full object-cover" />
        </div>
      ))}
    </div>
  );
}
