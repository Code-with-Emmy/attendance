"use client";

import { BrandLogo } from "@/components/brand-logo";

type Props = {
  label?: string;
  compact?: boolean;
};

export function BrandLoader({
  label = "Connecting...",
  compact = false,
}: Props) {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
        {label}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 font-(family-name:--font-lato) flex items-center justify-center p-6">
      <section className="w-full max-w-sm bg-white border-2 border-slate-200 rounded-xl p-12 text-center shadow-sm">
        <div className="mx-auto mb-10 flex h-16 w-16 items-center justify-center rounded-xl bg-slate-900 shadow-xl">
          <div className="h-8 w-8 border-4 border-slate-700 border-t-cyan-500 animate-spin rounded-full" />
        </div>

        <BrandLogo size="lg" className="mx-auto" />
        <h1 className="mt-6 text-3xl font-black text-slate-900 tracking-tighter">
          Attendance System
        </h1>
        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
          {label}
        </p>
      </section>
    </main>
  );
}
