"use client";

import { motion, useReducedMotion } from "framer-motion";

const BLOBS = [
  {
    className:
      "left-[-12%] top-[-10%] h-[32rem] w-[32rem] bg-[radial-gradient(circle,rgba(59,130,246,0.18),rgba(34,211,238,0.04)_40%,transparent_70%)]",
    duration: 20,
    animate: {
      x: [0, 40, -10, 0],
      y: [0, 20, -10, 0],
      scale: [1, 1.08, 0.97, 1],
    },
  },
  {
    className:
      "right-[-8%] top-[8%] h-[26rem] w-[26rem] bg-[radial-gradient(circle,rgba(34,211,238,0.14),rgba(59,130,246,0.04)_36%,transparent_70%)]",
    duration: 24,
    animate: {
      x: [0, -30, 8, 0],
      y: [0, 28, -12, 0],
      scale: [1, 1.05, 0.98, 1],
    },
  },
  {
    className:
      "bottom-[-14%] left-[24%] h-[36rem] w-[36rem] bg-[radial-gradient(circle,rgba(15,23,42,0.22),rgba(59,130,246,0.08)_26%,transparent_66%)]",
    duration: 28,
    animate: {
      x: [0, 20, -6, 0],
      y: [0, -20, 8, 0],
      scale: [1, 1.04, 0.99, 1],
    },
  },
  {
    className:
      "right-[10%] bottom-[5%] h-[22rem] w-[22rem] bg-[radial-gradient(circle,rgba(34,197,94,0.07),rgba(34,211,238,0.03)_38%,transparent_68%)]",
    duration: 30,
    animate: {
      x: [0, -14, 10, 0],
      y: [0, -18, 14, 0],
      scale: [1, 1.06, 1, 1],
    },
  },
];

export function AmbientBackground() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#020617_0%,#050d1d_65%,#081120_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-8%,rgba(59,130,246,0.12),transparent_60%)]" />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(148,163,184,0.45) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div
        className="absolute inset-0 hidden opacity-[0.04] sm:block"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.1) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_38%,rgba(2,6,23,0.88)_100%)]" />

      {/* Animated blobs — scale down on mobile via .ambient-blob CSS */}
      {BLOBS.map((blob) => (
        <motion.div
          key={blob.className}
          className={`ambient-blob absolute rounded-full blur-3xl ${blob.className}`}
          animate={shouldReduceMotion ? undefined : blob.animate}
          transition={
            shouldReduceMotion
              ? undefined
              : {
                  duration: blob.duration,
                  ease: "easeInOut",
                  repeat: Number.POSITIVE_INFINITY,
                }
          }
        />
      ))}
    </div>
  );
}
