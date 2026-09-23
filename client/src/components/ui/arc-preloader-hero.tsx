"use client";

import * as React from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";

/* ── types ───────────────────────────────────────────────────── */

export type ArcRevealGreeting = {
  /** Greeting text in the target script */
  text: string;
  /** Optional `lang` attribute applied to the span (helps screen readers / font rendering) */
  lang?: string;
};

export interface ArcRevealHeroProps {
  /** Greetings cycled before the arc reveal. */
  greetings?: ArcRevealGreeting[];
  /** How long each greeting is held on screen (ms). */
  greetingHold?: number;
  /** Duration of the curved curtain reveal (ms). */
  revealDuration?: number;
  /** Outer `<section>` class. Receives the *post-reveal* surface. */
  className?: string;
  /** Class for the intro (pre-reveal) overlay surface. */
  introClassName?: string;
  /** Class for the cycled greeting `<span>`. */
  greetingClassName?: string;
  /** Class for the wrapper around `children` (the revealed content). */
  revealClassName?: string;
  /**
   * Optional `sessionStorage` key — when set, the intro plays only once per
   * session for the same key. Leave unset to replay on every mount.
   */
  storageKey?: string;
  /** Content shown after the curtain reveal (the "landing"). */
  children?: React.ReactNode;
}

/* ── defaults ────────────────────────────────────────────────── */

const DEFAULT_GREETINGS: ArcRevealGreeting[] = [
  { text: "PDFs" },
  { text: "YOUTUBE VIDEOS" },
  { text: "WEB PAGES & CSV FILES" },
  { text: "MS DOCUMENTS" },
  { text: "MARKDOWN, JSON" },
  { text: "INSTANT ANSWERS" },
  { text: "WITH OMNI QUERY" },
];

type Phase = "intro" | "reveal" | "done";

const BG_COLORS = [
  "bg-black",
  "bg-[#FF6B2C]",
  "bg-white",
  "bg-black",
  "bg-[#FF6B2C]",
  "bg-black",
  "bg-[#FF6B2C]",
];

const TEXT_COLORS = [
  "text-[#FF6B2C]",
  "text-black",
  "text-black",
  "text-white",
  "text-white",
  "text-[#FF6B2C]",
  "text-white",
];

/* ── component ───────────────────────────────────────────────── */

export function ArcRevealHero({
  greetings = DEFAULT_GREETINGS,
  greetingHold = 620,
  revealDuration = 1500,
  className,
  introClassName,
  greetingClassName,
  revealClassName,
  storageKey,
  children,
}: ArcRevealHeroProps) {
  const prefersReducedMotion = useReducedMotion();

  const [phase, setPhase] = React.useState<Phase>("intro");
  const [index, setIndex] = React.useState(0);

  // Drive the arc shape from a single 0→1 progress.
  // The curve is a quadratic bezier with a fixed concavity (control point
  // sits 25 viewBox units below the chord), translated upward over time:
  //   t=0 → chord at y=110 (off-screen below)  → no curtain visible
  //   t=1 → chord at y=-30 (off-screen above)  → full-screen curtain
  const progress = useMotionValue(0);
  // Use a normalized clipPath [0, 1] for objectBoundingBox
  const arcClipPath = useTransform(progress, (p: number) => {
    const edge = 1.1 - p * 1.4;
    const control = edge + 0.25;
    return `M 0 0 L 1 0 L 1 ${edge} Q 0.5 ${control} 0 ${edge} Z`;
  });

  // Honor reduced-motion + replay-suppression on mount.
  React.useEffect(() => {
    if (prefersReducedMotion) {
      queueMicrotask(() => setPhase("done"));
      return;
    }
    if (storageKey && typeof window !== "undefined") {
      try {
        if (window.sessionStorage.getItem(storageKey) === "done") {
          queueMicrotask(() => setPhase("done"));
        }
      } catch {
        /* sessionStorage can throw in private mode — fall through */
      }
    }
  }, [prefersReducedMotion, storageKey]);

  // Greeting cycle.
  React.useEffect(() => {
    if (phase !== "intro") return;
    const isLast = index >= greetings.length - 1;
    if (isLast) {
      // Give the custom final animation enough time to play out completely
      const t = window.setTimeout(() => setPhase("reveal"), 2000);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setIndex((i) => i + 1), greetingHold);
    return () => window.clearTimeout(t);
  }, [phase, index, greetingHold, greetings.length]);

  // Drive the curtain reveal.
  React.useEffect(() => {
    if (phase !== "reveal") return;
    const controls = animate(progress, 1, {
      duration: revealDuration / 1000,
      ease: [0.85, 0, 0.15, 1],
      onComplete: () => {
        if (storageKey && typeof window !== "undefined") {
          try {
            window.sessionStorage.setItem(storageKey, "done");
          } catch {
            /* ignore */
          }
        }
        setPhase("done");
      },
    });
    return () => controls.stop();
  }, [phase, progress, revealDuration, storageKey]);

  const showOverlay = phase !== "done";
  const current = greetings[Math.min(index, greetings.length - 1)];

  return (
    <section
      aria-label="Hero"
      className={cn(
        "relative isolate min-h-screen w-full overflow-hidden bg-background text-foreground",
        className,
      )}
    >
      <div className={cn("relative z-0", revealClassName)}>{children}</div>

      <AnimatePresence>
        {showOverlay && (
          <>
            <svg width="0" height="0" className="absolute pointer-events-none">
              <clipPath id="arc-clip" clipPathUnits="objectBoundingBox">
                <motion.path d={arcClipPath} />
              </clipPath>
            </svg>

            <motion.div
              key="arc-reveal-overlay"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              style={{ clipPath: "url(#arc-clip)", WebkitClipPath: "url(#arc-clip)" }}
              className={cn(
                "absolute inset-x-0 top-0 z-30 h-screen overflow-hidden transition-colors duration-500 pointer-events-none",
                BG_COLORS[index % BG_COLORS.length],
                introClassName,
              )}
            >
              {/* Cycled greeting */}
              <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {phase === "intro" && current && (
                  current.text === "INSTANT ANSWERS" ? (
                    <motion.div
                      key={`${index}-${current.text}`}
                      className={cn(
                        "select-none px-6 text-center text-6xl font-bold tracking-tight text-[#FF6B2C] font-mono sm:text-7xl md:text-8xl flex flex-col md:flex-row items-center gap-4 md:gap-6 overflow-hidden",
                        greetingClassName,
                      )}
                    >
                      <motion.span
                        initial={{ opacity: 0, x: -150 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -150 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      >
                        INSTANT
                      </motion.span>
                      <motion.span
                        initial={{ opacity: 0, x: 150 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 150 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      >
                        ANSWERS
                      </motion.span>
                    </motion.div>
                  ) : current.text === "WITH OMNI QUERY" ? (
                    <motion.div
                      key={`${index}-${current.text}`}
                      className={cn(
                        "select-none px-6 text-center text-6xl font-bold tracking-tight text-[#FF6B2C] font-mono sm:text-7xl md:text-8xl relative w-full h-full flex items-center justify-center",
                        greetingClassName,
                      )}
                    >
                      {/* Dynamic Background Transition: Orange to White */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
                        className="absolute inset-0 bg-white z-0 pointer-events-none"
                      />

                      <motion.span
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: 300, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: [0.7, 0, 0.2, 1] }}
                        className="absolute flex items-center justify-center z-10 origin-center pointer-events-none text-white"
                      >
                        WITH
                      </motion.span>
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
                        className="relative z-20 font-bold text-[#FF6B2C] text-7xl sm:text-8xl md:text-9xl"
                      >
                        OMNI QUERY
                      </motion.span>
                    </motion.div>
                  ) : (
                    <motion.span
                      key={`${index}-${current.text}`}
                      lang={current.lang}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                      className={cn(
                        "select-none px-6 text-center text-6xl font-bold tracking-tight font-mono sm:text-7xl md:text-8xl uppercase",
                        TEXT_COLORS[index % TEXT_COLORS.length],
                        greetingClassName,
                      )}
                    >
                      {current.text}
                    </motion.span>
                  )
                )}
              </AnimatePresence>
            </div>

          </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}

export default ArcRevealHero;
