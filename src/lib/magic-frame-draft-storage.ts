// IndexedDB 기반 사진 임시저장 — localStorage 5MB 한계 우회 (모바일 Safari)
// 편집 설정은 기존대로 localStorage, 사진(Data URL)만 IndexedDB.

const DB_NAME = 'magic-frame-drafts';
const STORE = 'images';
const VERSION = 1;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB unavailable'));
            return;
        }
        const req = indexedDB.open(DB_NAME, VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function saveDraftValue(key: string, value: string): Promise<void> {
    const db = await openDB();
    try {
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE, 'readwrite');
            tx.objectStore(STORE).put(value, key);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
        });
    } finally {
        db.close();
    }
}

export async function loadDraftValue(key: string): Promise<string | null> {
    const db = await openDB();
    try {
        return await new Promise<string | null>((resolve, reject) => {
            const tx = db.transaction(STORE, 'readonly');
            const req = tx.objectStore(STORE).get(key);
            req.onsuccess = () => resolve((req.result as string) ?? null);
            req.onerror = () => reject(req.error);
        });
    } finally {
        db.close();
    }
}

export async function clearDraftValue(key: string): Promise<void> {
    const db = await openDB();
    try {
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE, 'readwrite');
            tx.objectStore(STORE).delete(key);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } finally {
        db.close();
    }
}
