// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/utils/performance/memoize
// PURPOSE: Panel-01 - Memoizacao de Renders
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   memoizeRow() — exported function
//   createMemoizedRenderer() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/utils/performance/memoize';

export class RenderCache {
  [key: string]: any;
  constructor(options: { maxSize?: number; ttl?: number } = {}) {
    this._cache = new Map();
    this._maxSize = options.maxSize || 500;
    this._ttl = options.ttl || 60000;
    this._hits = 0;
    this._misses = 0;
  }

  getKey(item: Record<string, unknown>) {
    const id = item.id || item.Id_Requisicao;
    const hash = this._hash(item);
    return `${id}:${hash}`;
  }

  _hash(obj: unknown) {
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  get(key: string) {
    const entry = this._cache.get(key);
    if (!entry) { this._misses++; return null; }
    if (Date.now() > entry.expires) { this._cache.delete(key); this._misses++; return null; }
    this._hits++;
    entry.lastAccess = Date.now();
    return entry.html;
  }

  set(key: string, html: string) {
    if (this._cache.size >= this._maxSize) this._evict();
    this._cache.set(key, { html, created: Date.now(), expires: Date.now() + this._ttl, lastAccess: Date.now() });
  }

  _evict() {
    let oldest = null;
    let oldestKey = null;
    for (const [key, entry] of this._cache) {
      if (!oldest || entry.lastAccess < oldest.lastAccess) { oldest = entry; oldestKey = key; }
    }
    if (oldestKey) this._cache.delete(oldestKey);
  }

  invalidate(id: string | number) {
    for (const key of this._cache.keys()) {
      if (key.startsWith(`${id}:`)) this._cache.delete(key);
    }
  }

  clear() { this._cache.clear(); this._hits = 0; this._misses = 0; }

  getStats() {
    const total = this._hits + this._misses;
    return { size: this._cache.size, maxSize: this._maxSize, hits: this._hits, misses: this._misses, hitRate: total > 0 ? Math.round((this._hits / total) * 100) : 0 };
  }
}

export function memoizeRow(renderFn: (item: Record<string, unknown>, index: number, options: unknown) => string, cache: RenderCache) {
  return (item: Record<string, unknown>, index: number, options: unknown) => {
    const key = cache.getKey(item);
    let html = cache.get(key);
    if (!html) { html = renderFn(item, index, options); cache.set(key, html); }
    return html;
  };
}

export function createMemoizedRenderer(renderFn: (item: Record<string, unknown>, index: number, options: unknown) => string, options: { maxSize?: number; ttl?: number } = {}) {
  const cache = new RenderCache(options);
  const memoized = memoizeRow(renderFn, cache);
  (memoized as any).invalidate = (id: string | number) => cache.invalidate(id);
  (memoized as any).clear = () => cache.clear();

  // @ts-expect-error TS migration - TS2339
  memoized.getStats = () => cache.getStats();
  return memoized;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { RenderCache, memoizeRow, createMemoizedRenderer };
