"use client";

import type { RefObject } from "react";

type Props = {
  videoRef: RefObject<HTMLVideoElement | null>;
  ready: boolean;
  error?: string;
};

export function CameraPanel({ videoRef }: Props) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#020617]">
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_20%_18%,rgba(59,130,246,0.16),transparent_34%),radial-gradient(circle_at_78%_20%,rgba(34,197,94,0.08),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.08),rgba(2,6,23,0.42))]" />
      <div className="pointer-events-none absolute inset-0 z-10 border border-white/6" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-[linear-gradient(90deg,transparent,rgba(59,130,246,0.34),transparent)]" />

      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        className="h-full w-full scale-x-[-1] object-cover saturate-[0.9] contrast-[1.04] brightness-[0.9]"
      />
    </div>
  );
}
