import { useEffect, useState, useCallback, useRef } from "react";
import { SyncDB } from "../sync-manager";

export function useAttendanceSync() {
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updateCount = useCallback(async () => {
    try {
      const events = await SyncDB.getUnsyncedEvents();
      setUnsyncedCount(events.length);
    } catch (err) {
      console.error("Failed to update sync count", err);
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      const events = await SyncDB.getUnsyncedEvents();
      if (events.length === 0) {
        setIsSyncing(false);
        return;
      }

      console.log(`Attempting to sync ${events.length} events...`);

      for (const event of events) {
        // Limit retries for individual events
        if (event.retryCount > 10) continue;

        try {
          const res = await fetch("/api/kiosk/clock", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: event.type,
              embedding: event.embedding,
              idempotencyKey: event.idempotencyKey,
              timestamp: event.timestamp,
            }),
          });

          if (res.ok) {
            await SyncDB.markSynced(event.id);
          } else {
            const data = await res.json();
            await SyncDB.updateError(event.id, data.error || "Sync failed");
          }
        } catch (err) {
          await SyncDB.updateError(event.id, err instanceof Error ? err.message : "Network error");
          // If network error, stop the batch and try again later
          break;
        }
      }
    } finally {
      setIsSyncing(false);
      await updateCount();
    }
  }, [isSyncing, updateCount]);

  useEffect(() => {
    updateCount();
    
    // Auto-sync every 30 seconds
    syncTimerRef.current = setInterval(syncNow, 30000);
    
    // Also sync when online
    const handleOnline = () => syncNow();
    window.addEventListener("online", handleOnline);

    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
      window.removeEventListener("online", handleOnline);
    };
  }, [syncNow, updateCount]);

  return {
    unsyncedCount,
    isSyncing,
    syncNow,
    updateCount
  };
}
