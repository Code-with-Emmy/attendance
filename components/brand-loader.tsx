"use client";

import { BRAND_COMPANY, BRAND_PRODUCT } from "@/lib/branding";

type Props = {
  label?: string;
  compact?: boolean;
};

export function BrandLoader({ label = "Loading workspace...", compact = false }: Props) {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink-soft)]">
        <span className="loader-dot" />
        {label}
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10 lg:px-6">
      <section className="glass-card reveal w-full max-w-xl rounded-[2rem] p-8 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full border border-cyan-200 bg-cyan-50 p-1">
          <div className="loader-orbit h-full w-full rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-700">{BRAND_COMPANY}</p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--ink-strong)]">{BRAND_PRODUCT}</h1>
        <p className="mt-3 text-sm text-[var(--ink-soft)]">{label}</p>
      </section>
    </main>
  );
}
