"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

// Which way the content drifts in from before settling into place.
type Direction = "up" | "left" | "right" | "none";

const offsetFor = (direction: Direction, offset: number) => {
  switch (direction) {
    case "left":
      return { x: -offset, y: 0 };
    case "right":
      return { x: offset, y: 0 };
    case "none":
      return { x: 0, y: 0 };
    default:
      return { x: 0, y: offset };
  }
};

/**
 * Fades content into place the first time any part of it is on screen (on load for content already visible).
 * Runs once; reduced-motion users get it in place with no animation.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
  offset = 50,
  duration = 0.8,
}: {
  children: ReactNode;
  className?: string;
  /** Seconds to wait, so neighbouring blocks can stagger. */
  delay?: number;
  direction?: Direction;
  /** Distance travelled, in px. */
  offset?: number;
  duration?: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, ...offsetFor(direction, offset) }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      // "some": starts as soon as the top edge appears, so tall blocks don't show a blank stretch first.
      viewport={{ once: true, amount: "some" }}
      transition={{ duration, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
