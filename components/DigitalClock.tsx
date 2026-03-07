"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Clock3, Calendar } from "lucide-react";

type Props = {
  className?: string;
};

export function DigitalClock({ className = "" }: Props) {
  const [now, setNow] = useState<Date | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const [colonVisible, setColonVisible] = useState(true);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setNow(new Date());
      setColonVisible(true);
    });

    const timer = window.setInterval(() => {
      setNow(new Date());
      setColonVisible((v) => !v);
    }, 1000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, []);

  const hours = now
    ? now.toLocaleTimeString("en-US", { hour: "2-digit", hour12: true }).split(":")[0]
    : "--";
  const minutes = now
    ? now.toLocaleTimeString("en-US", { minute: "2-digit" }).padStart(2, "0")
    : "--";
  const seconds = now
    ? now.toLocaleTimeString("en-US", { second: "2-digit" }).padStart(2, "0")
    : "--";
  const ampm = now ? (now.getHours() >= 12 ? "PM" : "AM") : "--";
  const weekday = now
    ? now.toLocaleDateString("en-US", { weekday: "long" })
    : "Loading";
  const fullDate = now
    ? now.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Local time";

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5 px-3 py-2 text-left shadow-[0_18px_40px_rgba(2,6,23,0.34)] sm:px-4 sm:py-3 lg:text-right ${className}`}
    >
      {/* Subtle top-right glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(8,145,178,0.06),transparent_40%)]" />

      <div className="relative">
        {/* Day label */}
        <div className="flex items-center gap-2 text-[0.55rem] font-black uppercase tracking-[0.24em] text-slate-400 sm:text-[0.62rem] sm:tracking-[0.3em] lg:justify-end">
          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{weekday}</span>
        </div>

        {/* Time display */}
        <div className="mt-2 flex items-baseline gap-0.5 font-mono lg:justify-end">
          <span className="text-[1.75rem] font-black tracking-tighter text-white sm:text-[2.1rem] md:text-[2.5rem] lg:text-[2.85rem]">
            {hours}
          </span>
          <span
            className={`text-[1.75rem] font-black tracking-tighter sm:text-[2.1rem] md:text-[2.5rem] lg:text-[2.85rem] transition-opacity duration-200 ${
              now && colonVisible ? "text-cyan-600" : "text-cyan-600/30"
            }`}
          >
            :
          </span>
          <span className="text-[1.75rem] font-black tracking-tighter text-white sm:text-[2.1rem] md:text-[2.5rem] lg:text-[2.85rem]">
            {minutes}
          </span>
          <span
            className={`text-[1.75rem] font-black tracking-tighter sm:text-[2.1rem] md:text-[2.5rem] lg:text-[2.85rem] transition-opacity duration-200 ${
              now && colonVisible ? "text-cyan-500" : "text-cyan-500/30"
            }`}
          >
            :
          </span>
          <span className="text-[1.75rem] font-black tracking-tighter text-slate-400 sm:text-[2.1rem] md:text-[2.5rem] lg:text-[2.85rem]">
            {seconds}
          </span>
          <span className="ml-1.5 text-xs font-black uppercase tracking-wider text-slate-400 sm:ml-2 sm:text-sm md:text-base">
            {ampm}
          </span>
        </div>

        {/* Date */}
        <div className="mt-1 flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-slate-500 sm:mt-1.5 sm:gap-2 sm:text-[0.72rem] sm:tracking-[0.18em] lg:justify-end">
          <Calendar className="h-3 w-3" aria-hidden="true" />
          <span>{fullDate}</span>
        </div>
      </div>
    </motion.div>
  );
}
