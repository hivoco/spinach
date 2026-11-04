"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useIsPresent } from "motion/react";

const DISTANCE = 80;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/**
 * Slides its content in from one side on mount (or just fades in with slide={false}) and fades it out when removed inside AnimatePresence.
 * Transforms are skipped under reduced motion (see MotionConfig).
 */
export function SlideIn({ from, slide = true, delay = 0, className, children }: { from: "left" | "right"; slide?: boolean; delay?: number; className?: string; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: slide ? (from === "left" ? -DISTANCE : DISTANCE) : 0 }}
      animate={{ opacity: 1, x: 0, transition: { duration: 0.5, delay, ease: EASE_OUT } }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Card deck: the first card slides in from the right. When `id` changes, the current card is flung off to the
 * left (speeding up, tilting counter-clockwise, fading out fast) and the next card is already in place beneath it.
 * Under reduced motion it becomes a cross-fade.
 */
/** `gone` flings the current card away with nothing beneath it (the last question, before the screen changes). */
export function CardSwap({ id, gone = false, delay = 0, className = "", children }: { id: string; gone?: boolean; delay?: number; className?: string; children: ReactNode }) {
  // Only the very first card slides in; once the id changes, later cards are revealed in place.
  const [firstId, setFirstId] = useState<string | null>(id);
  if (firstId !== null && id !== firstId) setFirstId(null);
  const first = id === firstId;

  return (
    // layout="position": when the question above changes height, the deck glides to its new spot instead of jumping.
    <motion.div layout="position" transition={{ duration: 0.35, ease: EASE_OUT }} className={`relative ${className}`}>
      <AnimatePresence mode="popLayout" initial>
        {!gone && <motion.div
          key={id}
          initial={first ? { opacity: 0, x: DISTANCE } : { opacity: 1, x: 0 }}
          animate={{ opacity: 1, x: 0, transition: { duration: 0.5, delay: first ? delay : 0, ease: EASE_OUT } }}
          // The fling starts slowly and the card is fully faded within 0.25s (~50px in), before it reaches the question text.
          exit={{ x: "-120%", y: "-8%", rotate: -30, opacity: 0, zIndex: 2, transition: { duration: 0.7, ease: [0.55, 0, 1, 0.45], opacity: { duration: 0.25, ease: "easeOut" } } }}
          className="relative"
        >
          <Card>{children}</Card>
        </motion.div>}
      </AnimatePresence>
    </motion.div>
  );
}

/** Keeps a card that is flying away from taking clicks meant for the one underneath. */
function Card({ children }: { children: ReactNode }) {
  const present = useIsPresent();
  return (
    <div inert={!present} className={present ? undefined : "pointer-events-none"}>
      {children}
    </div>
  );
}
