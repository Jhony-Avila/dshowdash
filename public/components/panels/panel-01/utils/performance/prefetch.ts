// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01.utils.performance.prefetch
// PURPOSE: Panel-01 - Prefetch de Paginas
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   createPrefetchManager() — exported function
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

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01.utils.performance.prefetch';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; const prefix = '[prefetch]'; if (level === 'error') logger.error?.(prefix, ...args); else if (level === 'info') logger.info?.(prefix, ...args); else logger.debug?.(prefix, ...args); };

export class PrefetchManager {
  [key: string]: any;
  constructor(options: { maxCached?: number; ttl?: number; fetchFn?: Function | null } = {}) { this.cache = new Map(); this.pending = new Map(); this.maxCached = options.maxCached || 5; this.ttl = options.ttl || 60000; this.fetchFn = options.fetchFn || null; }
  setFetchFunction(fn: (params: unknown) => Promise<unknown>) { this.fetchFn = fn; }
  async prefetch(key: string, params: unknown) { if (!this.fetchFn) return null; if (this.cache.has(key) && !this._isExpired(key)) return this.cache.get(key).data; if (this.pending.has(key)) return this.pending.get(key); const promise = this._fetch(key, params); this.pending.set(key, promise); try { const result = await promise; this._store(key, result); return result; } finally { this.pending.delete(key); } }
  async _fetch(key: string, params: unknown) { try { return await this.fetchFn(params); } catch (error) { _log('info', 'Error:', (error as Error).message); return null; } }
  _store(key: string, data: unknown) { if (this.cache.size >= this.maxCached) { const oldest = this.cache.keys().next().value; this.cache.delete(oldest); } this.cache.set(key, { data, timestamp: Date.now() }); }
  _isExpired(key: string) { const entry = this.cache.get(key); if (!entry) return true; return Date.now() - entry.timestamp > this.ttl; }
  get(key: string) { if (!this.cache.has(key) || this._isExpired(key)) return null; return this.cache.get(key).data; }
  has(key: string) { return this.cache.has(key) && !this._isExpired(key); }
  invalidate(key: string) { this.cache.delete(key); }
  clear() { this.cache.clear(); this.pending.clear(); }
  prefetchNextPage(currentPage: number, totalPages: number, params: Record<string, unknown>) { if (currentPage < totalPages) { const nextKey = `page_${currentPage + 1}`; const nextParams = { ...params, page: currentPage + 1 }; requestIdleCallback(() => this.prefetch(nextKey, nextParams), { timeout: 2000 }); } }
  prefetchAdjacentPages(currentPage: number, totalPages: number, params: Record<string, unknown>) { if (currentPage > 1) { const prevKey = `page_${currentPage - 1}`; requestIdleCallback(() => this.prefetch(prevKey, { ...params, page: currentPage - 1 }), { timeout: 3000 }); } if (currentPage < totalPages) { const nextKey = `page_${currentPage + 1}`; requestIdleCallback(() => this.prefetch(nextKey, { ...params, page: currentPage + 1 }), { timeout: 2000 }); } }
}

export function createPrefetchManager(options: Record<string, unknown> = {}) { return new PrefetchManager(options); }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
export default { PrefetchManager, createPrefetchManager, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
