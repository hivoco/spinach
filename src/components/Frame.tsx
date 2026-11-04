"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { Backdrop } from "@/components/ui";
import { DESKTOP_QUERY } from "@/lib/breakpoints";

/**
 * Lays every route out on Figma's frame (390×844 phone, 1440×900 desktop) and zooms it to fit the window,
 * inside the safe areas (notch, home indicator). Hidden until the zoom is known, so nothing jumps on load.
 * Phones: the frame then stretches to the screen's exact height (and width, up to PHONE_MAX_WIDTH) so
 * full-bleed parts like the welcome panel touch the screen edges instead of floating in a letterbox.
 */
// Widest phone frame the mobile layouts stretch to. Short visible areas need more: 375×667 needs ~475px, and
// Safari with both toolbars showing (~375×620) needs ~510px. 600 covers screens down to ~1.4:1 tall; past that
// (e.g. landscape phones) side bars are better than a stretched layout. The carousel and result panel stop
// growing at large-phone size (430px) so nothing overflows.
const PHONE_MAX_WIDTH = 600;
// Windows wider than 16:10 widen the desktop frame too (no side bars); screens centre their content in it.
const DESKTOP_MAX_WIDTH = 1920;

type Fit = { zoom: number; width?: number; height?: number };

export function Frame({ children }: { children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<Fit | null>(null);

  useEffect(() => {
    const el = stage.current!;
    const desktop = matchMedia(DESKTOP_QUERY);
    const update = () => {
      const s = getComputedStyle(el);
      const w = el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
      const h = el.clientHeight - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom);
      if (desktop.matches) {
        const zoom = Math.min(w / 1440, h / 900);
        return setFit({ zoom, width: Math.min(w / zoom, DESKTOP_MAX_WIDTH) });
      }
      const zoom = Math.min(w / 390, h / 844);
      setFit({ zoom, width: Math.min(w / zoom, PHONE_MAX_WIDTH), height: h / zoom });
    };
    const ro = new ResizeObserver(update);
    ro.observe(el);
    desktop.addEventListener("change", update);
    return () => {
      ro.disconnect();
      desktop.removeEventListener("change", update);
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <Backdrop />
      <div
        ref={stage}
        className="grid h-dvh place-items-center overflow-hidden pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]"
      >
        <div
          className="h-[844px] w-[390px] overflow-hidden lg:h-[900px] lg:w-[1440px]"
          style={fit ? { zoom: fit.zoom, width: fit.width, height: fit.height } : { visibility: "hidden" }}
        >
          {children}
        </div>
      </div>
    </MotionConfig>
  );
}
