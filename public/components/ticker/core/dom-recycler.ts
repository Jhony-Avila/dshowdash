// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ticker.core.dom-recycler
// PURPOSE: DOM Recycler - Ticker Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
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
import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '1.2.0-P17WI';
export const MODULE_ID = 'ticker.core.dom-recycler';
const hasWindow = typeof window !== 'undefined';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args); };
export class DOMRecycler {
  [key: string]: any;
  constructor(options: { maxPoolSize?: number } = {}) { this.maxPoolSize = options.maxPoolSize || 100; this._pools = new Map(); this._activeElements = new WeakSet(); this._metrics = { created: 0, recycled: 0, returned: 0, poolHits: 0, poolMisses: 0 }; }
  acquire(type: string, createFn: () => unknown) { let pool = this._pools.get(type); if (!pool) { pool = []; this._pools.set(type, pool); } let element; if (pool.length > 0) { element = pool.pop(); this._metrics.poolHits++; this._metrics.recycled++; _log('debug', `Recycled: ${type}`); } else { element = createFn(); this._metrics.poolMisses++; this._metrics.created++; } this._activeElements.add(element); return element; }
  release(type: string, element: unknown) { if (!element || !this._activeElements.has(element)) return false; let pool = this._pools.get(type); if (!pool) { pool = []; this._pools.set(type, pool); } if (pool.length >= this.maxPoolSize) { (element as HTMLElement).remove(); return false; } this._resetElement(element); pool.push(element); this._activeElements.delete(element); this._metrics.returned++; return true; }
  releaseAll(type: string, elements: unknown[]) { if (!Array.isArray(elements)) return; elements.forEach((el: unknown) => this.release(type, el)); }
  _resetElement(element: unknown) { const el = element as HTMLElement; el.className = ''; el.removeAttribute('style'); el.removeAttribute('data-index'); el.textContent = ''; const attrs = [...el.attributes]; attrs.forEach((attr: Attr) => { if (attr.name !== 'class') el.removeAttribute(attr.name); }); }
  getPoolSize(type: string) { const pool = this._pools.get(type); return pool ? pool.length : 0; }
  getTotalPoolSize() { let total = 0; for (const pool of this._pools.values()) { total += pool.length; } return total; }
  clearPool(type?: string) { if (type) { const pool = this._pools.get(type); if (pool) { pool.forEach((el: unknown) => (el as any).remove?.()); pool.length = 0; } } else { for (const pool of this._pools.values()) { pool.forEach((el: unknown) => (el as any).remove?.()); pool.length = 0; } this._pools.clear(); } _log('debug', type ? `Pool cleared: ${type}` : 'All pools cleared'); }
  warmPool(type: string, count: number, createFn: () => unknown) { let pool = this._pools.get(type); if (!pool) { pool = []; this._pools.set(type, pool); } const toCreate = Math.min(count, this.maxPoolSize - pool.length); for (let i = 0; i < toCreate; i++) { const element = createFn(); pool.push(element); this._metrics.created++; } _log('debug', `Pool warmed: ${type} (+${toCreate})`); }
  healthCheck() { const logger = _getPort('logger'); const hitRate = this._metrics.poolHits + this._metrics.poolMisses > 0 ? this._metrics.poolHits / (this._metrics.poolHits + this._metrics.poolMisses) : 0; const checks = { hasCapacity: this.getTotalPoolSize() < this.maxPoolSize * this._pools.size, goodHitRate: hitRate > 0.5 || (this._metrics.poolHits + this._metrics.poolMisses) < 10, loggerReady: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 4 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/4`, hitRate: `${(hitRate * 100).toFixed(1)}%`, totalPoolSize: this.getTotalPoolSize(), poolTypes: this._pools.size, checks, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, maxPoolSize: this.maxPoolSize, totalPoolSize: this.getTotalPoolSize(), poolTypes: [...this._pools.keys()], metrics: { ...this._metrics }, portsInitialized: Ports.isInitialized() }; }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { created: 0, recycled: 0, returned: 0, poolHits: 0, poolMisses: 0 }; }
}
export function getVersion() { return VERSION; }
export default DOMRecycler;
