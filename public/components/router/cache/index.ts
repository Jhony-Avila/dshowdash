// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.cache.index
// PURPOSE: Router Cache Layer v1.2.0-P17WI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   RouteCache — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '1.2.0-P17WI';
const MODULE_ID = 'router.cache.index';

const hasWindow = typeof window !== 'undefined';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

function _log(level: string, msg: string, ctx: Record<string, unknown>) { if (!ctx) ctx = {}; const logger = _getPort('logger'); if (!logger || typeof logger[level] !== 'function') return; ctx.component = MODULE_ID; logger[level](msg, ctx); }

const DEFAULT_CONFIG = { enabled: true, ttl: 60000, maxSize: 500, cleanupInterval: 30000 };
let _config = Object.assign({}, DEFAULT_CONFIG);
const _cache = new Map();
let _cleanupTimer: ReturnType<typeof setInterval> | null = null;
const _metrics = { hits: 0, misses: 0, evictions: 0, invalidations: 0 };

function _createEntry(key: string, value: unknown) { return { key, value, createdAt: Date.now(), lastAccess: Date.now(), accessCount: 1 }; }
function _isExpired(entry: { createdAt: number }) { return Date.now() - entry.createdAt > _config.ttl; }
function _cleanup() { let evicted = 0; _cache.forEach((entry, key) => { if (_isExpired(entry)) { _cache.delete(key); evicted++; } }); if (evicted > 0) { _metrics.evictions += evicted; _log('debug', 'Cache cleanup', { evicted, remaining: _cache.size }); } }
function _ensureCapacity() { if (_cache.size >= _config.maxSize) { let oldest = null; let oldestTime = Infinity; _cache.forEach((entry, key) => { if (entry.lastAccess < oldestTime) { oldestTime = entry.lastAccess; oldest = key; } }); if (oldest) { _cache.delete(oldest); _metrics.evictions++; } } }
function _startCleanupTimer() { if (_cleanupTimer) clearInterval(_cleanupTimer); _cleanupTimer = setInterval(_cleanup, _config.cleanupInterval); }

const RouteCache = {
  get(path: string) { if (!_config.enabled) return null; const entry = _cache.get(path); if (!entry) { _metrics.misses++; return null; } if (_isExpired(entry)) { _cache.delete(path); _metrics.misses++; return null; } entry.lastAccess = Date.now(); entry.accessCount++; _metrics.hits++; _log('debug', 'Cache hit', { path, accessCount: entry.accessCount }); return entry.value; },
  set(path: string, resolvedRoute: unknown) { if (!_config.enabled) return; _ensureCapacity(); _cache.set(path, _createEntry(path, resolvedRoute)); _log('debug', 'Cache set', { path, cacheSize: _cache.size }); },
  invalidate(path: string) { if (_cache.has(path)) { _cache.delete(path); _metrics.invalidations++; _log('debug', 'Cache invalidated', { path }); return true; } return false; },
  invalidatePattern(pattern: string) { let count = 0; const regex = new RegExp(pattern); _cache.forEach((_, key) => { if (regex.test(key)) { _cache.delete(key); count++; } }); _metrics.invalidations += count; _log('debug', 'Cache pattern invalidated', { pattern, count }); return count; },
  clear() { const size = _cache.size; _cache.clear(); _metrics.invalidations += size; _log('info', 'Cache cleared', { cleared: size }); },
  has(path: string) { const entry = _cache.get(path); return entry && !_isExpired(entry); },
  configure(options: Record<string, unknown>) { if (!options) options = {}; _config = Object.assign({}, _config, options); if (_config.enabled) { _startCleanupTimer(); } else { if (_cleanupTimer) clearInterval(_cleanupTimer); } _log('info', 'Cache configured', { config: _config }); return Object.assign({}, _config); },
  enable() { this.configure({ enabled: true }); },
  disable() { this.configure({ enabled: false }); },
  isEnabled() { return _config.enabled; },
  getMetrics() { const total = _metrics.hits + _metrics.misses; return Object.assign({}, _metrics, { size: _cache.size, hitRate: total > 0 ? `${(_metrics.hits / total * 100).toFixed(2)}%` : '0%', config: Object.assign({}, _config) }); },
  getStatus() { return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), enabled: _config.enabled, size: _cache.size, maxSize: _config.maxSize, ttl: _config.ttl, metrics: this.getMetrics() }; },
  healthCheck() { return { status: _config.enabled ? 'HEALTHY' : 'DISABLED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { enabled: _config.enabled, hasCapacity: _cache.size < _config.maxSize, cleanupActive: !!_cleanupTimer } }; },
  info() { return Object.assign({ moduleId: MODULE_ID, version: VERSION }, this.getStatus()); }
};

_startCleanupTimer();

export { RouteCache, VERSION, MODULE_ID, injectPorts, getPorts };
export default RouteCache;
