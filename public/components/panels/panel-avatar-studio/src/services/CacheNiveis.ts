// services/CacheNiveis.ts — CACHE MULTINÍVEL (mega 272 · §277).
// @version 1.0.0  @created 2026-08-05
//
// Memória → IndexedDB → buscar(). Fail-safe por construção: qualquer erro
// de IndexedDB (privado/quota/indisponível) degrada para memória-apenas e
// NUNCA propaga — o chamador só vê o resultado de buscar(). TTL por
// entrada; valores precisam ser serializáveis (structured clone).
const memoria = new Map<string, { valor: unknown; expira: number }>();
const DB = 'avst-cache-v1';
const STORE = 'kv';

function abrirIdb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') { resolve(null); return; }
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch { resolve(null); }
  });
}

async function idbLer(chave: string): Promise<{ valor: unknown; expira: number } | null> {
  const db = await abrirIdb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(chave);
      req.onsuccess = () => { resolve(req.result ?? null); db.close(); };
      req.onerror = () => { resolve(null); db.close(); };
    } catch { resolve(null); db.close(); }
  });
}

async function idbGravar(chave: string, registro: { valor: unknown; expira: number }): Promise<void> {
  const db = await abrirIdb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(registro, chave);
      tx.oncomplete = () => { resolve(); db.close(); };
      tx.onerror = () => { resolve(); db.close(); };
    } catch { resolve(); db.close(); }
  });
}

/** Busca com cache §277: memória → IndexedDB → buscar() (grava nos dois). */
export async function lembrar<T>(chave: string, ttlMs: number, buscar: () => Promise<T>): Promise<T> {
  const agora = Date.now();
  const m = memoria.get(chave);
  if (m && m.expira > agora) return m.valor as T;
  const d = await idbLer(chave).catch(() => null);
  if (d && d.expira > agora) {
    memoria.set(chave, d);
    return d.valor as T;
  }
  const valor = await buscar();
  const registro = { valor, expira: agora + ttlMs };
  memoria.set(chave, registro);
  void idbGravar(chave, registro).catch(() => { /* fail-safe */ });
  return valor;
}

/** Invalida uma chave nos DOIS níveis (memória síncrona; IDB best-effort). */
export function esquecer(chave: string): void {
  memoria.delete(chave);
  void abrirIdb().then((db) => {
    if (!db) return;
    try {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(chave);
      tx.oncomplete = () => db.close();
      tx.onerror = () => db.close();
    } catch { db.close(); }
  }).catch(() => { /* fail-safe */ });
}
