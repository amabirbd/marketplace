import type { DemoState, SnapshotStorage } from "../data/types";
let database: Promise<IDBDatabase> | undefined;
function db() {
  database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("localloop-demo-v1", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("data");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      database = undefined;
      reject(request.error);
    };
  });
  return database;
}
export async function readValue<T>(key: string): Promise<T | undefined> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const request = database.transaction("data").objectStore("data").get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function writeValue(key: string, value: unknown) {
  const database = await db();
  return new Promise<void>((resolve, reject) => {
    const tx = database.transaction("data", "readwrite");
    tx.objectStore("data").put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
export const storage: SnapshotStorage = {
  read: async () => (await readValue<DemoState>("snapshot")) ?? null,
  write: (state) => writeValue("snapshot", state),
};
export async function clearMedia() {
  const database = await db();
  return new Promise<void>((resolve, reject) => {
    const tx = database.transaction("data", "readwrite");
    const request = tx.objectStore("data").openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        if (String(cursor.key).startsWith("media:")) cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
