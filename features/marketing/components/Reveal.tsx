"use client";

import { motion, useReducedMotion } from "framer-motion";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Seconds to wait before the entrance starts (for staggered siblings). */
  delay?: number;
  /** Initial horizontal offset; use ±24 for side entrances. */
  x?: number;
  /** Initial vertical offset. */
  y?: number;
};

/**
 * Scroll-triggered fade-up used across the landing page. Collapses to a plain
 * div when the visitor prefers reduced motion.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  x = 0,
  y = 24,
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}
