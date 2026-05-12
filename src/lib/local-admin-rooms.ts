"use client";

export type LocalAdminRoom = {
  roomId: string;
  title: string;
  joinCode: string;
  adminToken: string;
  accentColor: string;
  backgroundImageUrl: string;
  updatedAt: string;
};

const DB_NAME = "speed-networking-admin";
const DB_VERSION = 1;
const STORE_NAME = "rooms";

function openAdminDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "roomId" });
        store.createIndex("updatedAt", "updatedAt");
      }
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T> | void,
) {
  const db = await openAdminDb();

  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = callback(store);

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => {
      db.close();
      resolve(request ? request.result : (undefined as T));
    };
  });
}

export async function saveAdminRoom(room: LocalAdminRoom) {
  await withStore("readwrite", (store) => store.put(room));
}

export async function listAdminRooms() {
  const rooms = await withStore<LocalAdminRoom[]>("readonly", (store) =>
    store.getAll(),
  );

  return rooms.sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

export async function deleteAdminRoom(roomId: string) {
  await withStore("readwrite", (store) => store.delete(roomId));
}
