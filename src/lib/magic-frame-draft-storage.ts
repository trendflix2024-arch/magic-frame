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

// ── 30일 만료 ──────────────────────────────────────────────
// 임시저장 묶음(설정 localStorage 키 + 사진 IndexedDB 키들)마다 마지막 저장 시각을 기록하고,
// 불러올 때 30일이 지났으면 묶음 전체를 지운다. 고객 기기 브라우저 안의 데이터만 대상.
export const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const savedAtKey = (lsKey: string) => `${lsKey}:savedAt`;

/** 임시저장 직후 호출 — 만료 시계를 지금으로 재설정 */
export function touchDraft(lsKey: string): void {
    try { localStorage.setItem(savedAtKey(lsKey), String(Date.now())); } catch { /* ignore */ }
}

/**
 * 불러오기 전에 호출. 만료면 묶음을 지우고 true.
 * 시각 기록이 없는 예전 임시저장은 지우지 않고 지금부터 30일을 센다.
 */
export async function purgeExpiredDraft(lsKey: string, idbKeys: string[]): Promise<boolean> {
    try {
        const raw = localStorage.getItem(savedAtKey(lsKey));
        if (!raw) {
            const hasSettings = localStorage.getItem(lsKey) !== null;
            const hasPhotos = (await Promise.all(idbKeys.map(k => loadDraftValue(k).catch(() => null)))).some(Boolean);
            if (hasSettings || hasPhotos) touchDraft(lsKey);
            return false;
        }
        if (Date.now() - Number(raw) < DRAFT_TTL_MS) return false;
        localStorage.removeItem(lsKey);
        localStorage.removeItem(savedAtKey(lsKey));
        await Promise.all(idbKeys.map(k => clearDraftValue(k).catch(() => { })));
        return true;
    } catch {
        return false;
    }
}

/** 초기화·확정 등으로 임시저장을 지울 때 시각 기록도 함께 제거 */
export function forgetDraft(lsKey: string): void {
    try { localStorage.removeItem(savedAtKey(lsKey)); } catch { /* ignore */ }
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
