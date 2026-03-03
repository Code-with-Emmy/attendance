/**
 * Simple IndexedDB wrapper for queuing attendance events while offline.
 */

export interface QueuedEvent {
  id: string; // Internal UUID/Client-side ID
  idempotencyKey: string;
  type: string;
  embedding: number[];
  timestamp: string;
  synced: boolean;
  error?: string;
  retryCount: number;
}

const DB_NAME = "AttendanceSyncDB";
const STORE_NAME = "events";
const DB_VERSION = 1;

export class SyncDB {
  private static db: IDBDatabase | null = null;

  static async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("synced", "synced", { unique: false });
          store.createIndex("idempotencyKey", "idempotencyKey", { unique: true });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  static async queueEvent(event: Omit<QueuedEvent, "id" | "synced" | "retryCount">): Promise<QueuedEvent> {
    const db = await this.init();
    const queued: QueuedEvent = {
      ...event,
      id: crypto.randomUUID(),
      synced: false,
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(queued);

      request.onsuccess = () => resolve(queued);
      request.onerror = () => reject(request.error);
    });
  }

  static async getUnsyncedEvents(): Promise<QueuedEvent[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("synced");
      const request = index.getAll(0); // false is usually stored as 0 or true/false depending

      request.onsuccess = () => {
        // Filter manually if index doesn't support Boolean well in all browsers
        const results = request.result as QueuedEvent[];
        resolve(results.filter(e => !e.synced));
      };
      request.onerror = () => reject(request.error);
    });
  }

  static async markSynced(id: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const event = getRequest.result as QueuedEvent;
        if (event) {
          event.synced = true;
          event.error = undefined;
          store.put(event);
        }
        resolve();
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  static async updateError(id: string, error: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const event = getRequest.result as QueuedEvent;
        if (event) {
          event.error = error;
          event.retryCount += 1;
          store.put(event);
        }
        resolve();
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  static async clearSynced(): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("synced");
      const request = index.openCursor(1); // true

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}
