"use client";

import type { RefObject } from "react";

type Props = {
  videoRef: RefObject<HTMLVideoElement | null>;
  ready: boolean;
  error?: string;
};

export function CameraPanel({ videoRef }: Props) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* Cinematic Tint Layer */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_30%_30%,rgba(0,102,255,0.1),transparent_50%),radial-gradient(circle_at_70%_70%,rgba(0,184,148,0.08),transparent_50%)] mix-blend-screen opacity-50" />

      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        className="h-full w-full object-cover scale-x-[-1]"
      />
    </div>
  );
}
