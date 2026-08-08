// services/CacheAssets3d.ts — CACHE PERSISTENTE de assets 3D (mega 686 ·
// §475, lote 681–690, flag as5.progressivo3d no CALLER).
// @version 1.0.0  @created 2026-08-07
//
// IndexedDB para GLBs (personagens, partes, pacotes de animação):
//   · chave COM hash (`url#hash`, do manifest §477) = IMUTÁVEL — cache
//     eterno; hash novo invalida sozinho (§475 "invalidação por hash");
//   · chave SEM hash = expira em 7 dias (§475 "expiração");
//   · limite total com despejo LRU (§475 "limite/limpeza");
//   · qualquer erro (IDB indisponível, quota) degrada para a rede —
//     cache é ACELERADOR, nunca dependência (§481).
const BANCO = 'dshow.avst3d.v1';
const LOJA = 'arquivos';
const LIMITE_BYTES = 96 * 1024 * 1024; // §475: teto do cache local
const EXPIRA_MS = 7 * 24 * 60 * 60 * 1000; // chaves sem hash

interface Registro {
  chave: string;
  bytes: ArrayBuffer;
  tamanho: number;
  imutavel: boolean;
  usadoEm: number;
}

let _db: Promise<IDBDatabase | null> | null = null;

function abrirBanco(): Promise<IDBDatabase | null> {
  if (_db) return _db;
  _db = new Promise((resolve) => {
    try {
      const req = indexedDB.open(BANCO, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(LOJA)) {
          db.createObjectStore(LOJA, { keyPath: 'chave' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch { resolve(null); }
  });
  return _db;
}

function pedir<T>(r: IDBRequest<T>): Promise<T | null> {
  return new Promise((resolve) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => resolve(null);
  });
}

/** Monta a chave §477: com hash = imutável; sem = expira. */
export function chaveCache(url: string, hash?: string | null): string {
  return hash ? `${url}#${hash}` : url;
}

/** Lê do cache; null = ausente/expirado/erro (caller vai à rede). */
export async function lerCache(chave: string): Promise<ArrayBuffer | null> {
  const db = await abrirBanco();
  if (!db) return null;
  try {
    const tx = db.transaction(LOJA, 'readwrite');
    const loja = tx.objectStore(LOJA);
    const reg = (await pedir(loja.get(chave))) as Registro | undefined | null;
    if (!reg) return null;
    if (!reg.imutavel && Date.now() - reg.usadoEm > EXPIRA_MS) {
      loja.delete(chave); // §475 expiração
      return null;
    }
    loja.put({ ...reg, usadoEm: Date.now() }); // LRU: toque de uso
    return reg.bytes;
  } catch { return null; }
}

/** Grava com despejo LRU até caber no limite (§475). Nunca lança. */
export async function gravarCache(chave: string, bytes: ArrayBuffer, imutavel: boolean): Promise<void> {
  const db = await abrirBanco();
  if (!db || bytes.byteLength > LIMITE_BYTES) return;
  try {
    const tx = db.transaction(LOJA, 'readwrite');
    const loja = tx.objectStore(LOJA);
    const todos = ((await pedir(loja.getAll())) ?? []) as Registro[];
    let total = todos.reduce((s, r) => s + r.tamanho, 0);
    if (total + bytes.byteLength > LIMITE_BYTES) {
      // despeja os MENOS usados primeiro (nunca o que está entrando)
      for (const r of todos.sort((a, b) => a.usadoEm - b.usadoEm)) {
        if (total + bytes.byteLength <= LIMITE_BYTES) break;
        loja.delete(r.chave);
        total -= r.tamanho;
      }
    }
    loja.put({ chave, bytes, tamanho: bytes.byteLength, imutavel, usadoEm: Date.now() } satisfies Registro);
  } catch { /* quota/erro: rede cobre */ }
}

/** Busca com cache §475: tenta o IDB, senão rede (e grava). */
export async function buscarComCache(
  url: string,
  hash?: string | null,
): Promise<ArrayBuffer> {
  const chave = chaveCache(url, hash);
  const doCache = await lerCache(chave);
  if (doCache) return doCache;
  const r = await fetch(url, { cache: 'default' });
  if (!r.ok) throw new Error(`GLB ${r.status}`);
  const bytes = await r.arrayBuffer();
  void gravarCache(chave, bytes, Boolean(hash));
  return bytes;
}
