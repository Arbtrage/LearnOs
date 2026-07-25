type QueuedTick = {
  id: string;
  sessionId: string;
  createdAt: number;
};

const DB_NAME = "learnos-offline";
const STORE = "timer-ticks";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueSessionTick(sessionId: string) {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  const item: QueuedTick = {
    id: crypto.randomUUID(),
    sessionId,
    createdAt: Date.now(),
  };
  tx.objectStore(STORE).put(item);
}

export async function flushSessionTicks() {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  const all = await new Promise<QueuedTick[]>((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as QueuedTick[]);
    req.onerror = () => reject(req.error);
  });

  for (const item of all) {
    try {
      await fetch(`/api/sessions/${item.sessionId}/tick`, { method: "PATCH" });
      store.delete(item.id);
    } catch {
      break;
    }
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    void flushSessionTicks();
  });
}
