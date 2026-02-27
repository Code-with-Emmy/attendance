"use client";

import type { RefObject } from "react";

type Props = {
  videoRef: RefObject<HTMLVideoElement | null>;
  ready: boolean;
  error?: string;
};

export function CameraPanel({ videoRef, ready, error }: Props) {
  return (
    <section className="glass-card reveal rounded-3xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--ink-strong)]">Camera Preview</h2>
        <span className={`status-chip ${error ? "status-warn" : ready ? "status-ok" : "status-warn"}`}>
          {error ? "Camera Error" : ready ? "Camera Ready" : "Starting"}
        </span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-slate-950 shadow-inner">
        <video ref={videoRef} muted playsInline autoPlay className="aspect-video w-full object-cover" />
      </div>
      <p className="mt-3 text-sm text-[var(--ink-soft)]">
        {error ? error : ready ? "Camera ready." : "Starting camera..."}
      </p>
    </section>
  );
}
