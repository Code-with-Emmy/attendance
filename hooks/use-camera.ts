"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startRef = useRef<() => Promise<void>>(async () => {});
  const startTokenRef = useRef(0);
  const retryTimerRef = useRef<number | null>(null);
  const initTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>("");

  const clearRetry = useCallback(() => {
    if (retryTimerRef.current !== null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const clearInitTimer = useCallback(() => {
    if (initTimerRef.current !== null) {
      window.clearTimeout(initTimerRef.current);
      initTimerRef.current = null;
    }
  }, []);

  const queueRetry = useCallback(
    (delayMs: number) => {
      clearRetry();
      if (!mountedRef.current) {
        return;
      }
      retryTimerRef.current = window.setTimeout(() => {
        if (!mountedRef.current) {
          return;
        }
        void startRef.current();
      }, delayMs);
    },
    [clearRetry],
  );

  const stop = useCallback(() => {
    startTokenRef.current += 1;
    clearRetry();
    clearInitTimer();

    if (!streamRef.current) {
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.srcObject = null;
      }
      return;
    }

    for (const track of streamRef.current.getTracks()) {
      track.stop();
    }

    streamRef.current = null;

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }
  }, [clearInitTimer, clearRetry]);

  const start = useCallback(async () => {
    let token = 0;
    setError("");
    setReady(false);

    const firstVideoRef = videoRef.current;
    if (!firstVideoRef) {
      queueRetry(160);
      return;
    }

    try {
      stop();
      token = startTokenRef.current + 1;
      startTokenRef.current = token;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        queueRetry(160);
        return;
      }

      if (token !== startTokenRef.current) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        return;
      }

      video.srcObject = stream;

      if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
        await new Promise<void>((resolve) => {
          const onLoadedMetadata = () => {
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            resolve();
          };
          video.addEventListener("loadedmetadata", onLoadedMetadata, { once: true });
        });
      }

      await video.play();

      if (token !== startTokenRef.current) {
        return;
      }

      setReady(true);
      clearRetry();
    } catch (err) {
      if (token !== startTokenRef.current) {
        return;
      }

      if (err instanceof DOMException && err.name === "AbortError") {
        queueRetry(220);
        return;
      }

      if (err instanceof DOMException && err.name === "NotReadableError") {
        queueRetry(450);
        return;
      }

      console.error(err);
      setError("Unable to access camera. Please allow camera permission and retry.");
      setReady(false);
    }
  }, [clearRetry, queueRetry, stop]);

  useEffect(() => {
    startRef.current = start;
    mountedRef.current = true;
    initTimerRef.current = window.setTimeout(() => {
      if (!mountedRef.current) {
        return;
      }
      void startRef.current();
    }, 0);

    const onVisibilityOrFocus = () => {
      if (document.visibilityState === "visible" && !streamRef.current) {
        void start();
      }
    };

    window.addEventListener("focus", onVisibilityOrFocus);
    document.addEventListener("visibilitychange", onVisibilityOrFocus);

    return () => {
      mountedRef.current = false;
      clearInitTimer();
      window.removeEventListener("focus", onVisibilityOrFocus);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
      stop();
    };
  }, [clearInitTimer, start, stop]);

  return {
    videoRef,
    ready,
    error,
    restart: start,
  };
}
