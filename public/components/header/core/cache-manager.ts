// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/cache-manager
// PURPOSE: Gerenciador de cache com TTL, auto-refresh e categorias
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   init(config) — inicializa com TTLs customizados
//   get(key) — obtém valor do cache
//   set(key, value, options) — define valor no cache
//   del(key) — remove entrada
//   has(key) — verifica existência
//   getMultiple(keys) — obtém múltiplos valores
//   setMultiple(items, options) — define múltiplos valores
//   deleteMultiple(keys) — remove múltiplas entradas
//   clearCategory(category) — limpa categoria
//   getByCategory(category) — obtém por categoria
//   setTTL(key, newTTL) — altera TTL
//   getTTL(key) — obtém TTL restante
//   extendTTL(key, time) — estende TTL
//   cleanup() — remove expirados
//   clear() — limpa todo o cache
//   getStats() — estatísticas
//   getMetrics() — métricas (hit rate)
//   resetMetrics() — reseta métricas
//   healthCheck() — auto health check
//   info() — informações do módulo
//   DEFAULT_TTLS — TTLs padrão por categoria
//   injectPorts(p) — injeta ports
//   getPorts() — snapshot dos ports
// EMITS (eventos):
//   header:cache:expired — quando entrada expira
// ═══════════════════════════════════════════════════════════════

// Header - Cache Manager with TTL
// @version 1.2.0-ES6
// @changelog v1.2.0-ES6 - Task 10.1 B05: var → const/let
// @changelog v1.1.0 - healthCheck ajustado para cache vazio
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.2.0-ES6';
export const MODULE_ID = 'header/core/cache-manager';

const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;

function _initPorts() { if (_portsInitialized) return; Ports.init(); _portsInitialized = true; }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string, ...args: any[]) {const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { if (logger.error) logger.error(prefix, args.join(' ')); return; } if (level === 'warn') { if (logger.warn) logger.warn(prefix, args.join(' ')); return; } if (level === 'info') { if (logger.info) logger.info(prefix, args.join(' ')); return; } if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(' ')); };

const _caches = new Map();
const DEFAULT_TTLS = { registry: 300000, permissions: 600000, health: 60000, alerts: 30000, components: 300000, default: 60000 };
let _metrics = { hits: 0, misses: 0, sets: 0, deletes: 0, expires: 0, refreshes: 0 };

function CacheEntry(this: any, key: string, value: unknown, ttl: number, category: string) { this.key = key; this.value = value; this.ttl = ttl; this.category = category || 'default'; this.createdAt = Date.now(); this.expiresAt = Date.now() + ttl; this.lastAccessedAt = Date.now(); this.accessCount = 0; this.refreshTimer = null; this.onExpire = null; this.onRefresh = null; }
CacheEntry.prototype.isExpired = function() { return Date.now() > this.expiresAt; };
CacheEntry.prototype.touch = function() { this.lastAccessedAt = Date.now(); this.accessCount++; };
CacheEntry.prototype.refresh = function(newValue: unknown) { this.value = newValue; this.expiresAt = Date.now() + this.ttl; this.lastAccessedAt = Date.now(); };

function init(config: Record<string,unknown>) { _initPorts(); if (config && config.ttls) { Object.keys(config.ttls).forEach(key => { (DEFAULT_TTLS as Record<string,unknown>)[key] = (config.ttls as Record<string,unknown>)[key]; }); } _log('info', 'CacheManager inicializado'); }

function get(key: string) {
  const entry = _caches.get(key);
  if (!entry) { _metrics.misses++; return null; }
  if (entry.isExpired()) { _metrics.expires++; _metrics.misses++; _handleExpire(entry); return null; }
  entry.touch();
  _metrics.hits++;
  return entry.value;
}

function set(key: string, value: unknown, options: Record<string,unknown>) {
  options = options || {};
  const category = options.category || 'default';
  const ttl = options.ttl || (DEFAULT_TTLS as Record<string,unknown>)[category as string] || DEFAULT_TTLS.default;
  const autoRefresh = options.autoRefresh || false;
  const onExpire = options.onExpire || null;
  const onRefresh = options.onRefresh || null;
  if (_caches.has(key)) { const existing = _caches.get(key); if (existing.refreshTimer) { clearTimeout(existing.refreshTimer); } }
  const entry = (new (CacheEntry as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(key, value, ttl, category));
  // @ts-expect-error TS migration - TS2740
  entry.onExpire = onExpire;
  // @ts-expect-error TS migration - TS2740
  entry.onRefresh = onRefresh;
  // @ts-expect-error TS migration - TS2362, TS2740
  if (autoRefresh && onRefresh) { const refreshTime = ttl * 0.8; entry.refreshTimer = setTimeout(() => { _handleAutoRefresh(entry); }, refreshTime); }
  _caches.set(key, entry);
  _metrics.sets++;
  return entry;
}

function del(key: string) { const entry = _caches.get(key); if (entry) { if (entry.refreshTimer) { clearTimeout(entry.refreshTimer); } _caches.delete(key); _metrics.deletes++; return true; } return false; }
function has(key: string) { const entry = _caches.get(key); return entry && !entry.isExpired(); }

// @ts-expect-error TS migration - TS2769
function _handleExpire(entry: Record<string,unknown>) { if (entry.refreshTimer) { clearTimeout(entry.refreshTimer); } if (typeof entry.onExpire === 'function') { try { entry.onExpire(entry.key, entry.value); } catch (e: any) { _log('error', 'onExpire error:', entry.key, e.message); } } _caches.delete(entry.key); _emitEvent('expired', { key: entry.key, category: entry.category }); }

function _handleAutoRefresh(entry: Record<string,unknown>) {
  _metrics.refreshes++;
  if (typeof entry.onRefresh !== 'function') return;
  try {
    const result = entry.onRefresh(entry.key, entry.value);
    // @ts-expect-error TS migration - TS2349, TS2362
    if (result && typeof result.then === 'function') { result.then((newValue: unknown) => { if (newValue !== undefined) { entry.refresh(newValue); entry.refreshTimer = setTimeout(() => { _handleAutoRefresh(entry); }, entry.ttl * 0.8); } }).catch((e: {message?:string}) => { _log('error', 'Auto-refresh error:', entry.key, e.message); }); }
    // @ts-expect-error TS migration - TS2349, TS2362
    else if (result !== undefined) { entry.refresh(result); entry.refreshTimer = setTimeout(() => { _handleAutoRefresh(entry); }, entry.ttl * 0.8); }
  } catch (e: any) { _log('error', 'Auto-refresh error:', entry.key, e.message); }
}

function getMultiple(keys: string[]) { const result = {}; keys.forEach((key: string) => { (result as Record<string,unknown>)[key as string] = get(key); }); return result; }
// @ts-expect-error TS migration - TS2352
function setMultiple(items: unknown[], options: Record<string,unknown>) { Object.keys(items).forEach(key => { set(key, items[key as number], options); }); }
function deleteMultiple(keys: string[]) { keys.forEach((key: string) => { del(key); }); }
function clearCategory(category: string) { let deleted = 0; _caches.forEach((entry, key) => { if (entry.category === category) { del(key); deleted++; } }); _log('info', 'Cleared category:', category, `(${deleted} entries)`); return deleted; }
function getByCategory(category: string) { const result = {}; _caches.forEach((entry, key) => { if (entry.category === category && !entry.isExpired()) { (result as Record<string,unknown>)[key as string] = entry.value; } }); return result; }
// @ts-expect-error TS migration - TS2365
function setTTL(key: string, newTTL: unknown) { const entry = _caches.get(key); if (entry) { entry.ttl = newTTL; entry.expiresAt = Date.now() + newTTL; return true; } return false; }
function getTTL(key: string) { const entry = _caches.get(key); if (entry && !entry.isExpired()) { return entry.expiresAt - Date.now(); } return -1; }
function extendTTL(key: string, additionalTime: unknown) { const entry = _caches.get(key); if (entry) { entry.expiresAt += additionalTime; return entry.expiresAt - Date.now(); } return -1; }
function cleanup() { let expired = 0; _caches.forEach((entry, key) => { if (entry.isExpired()) { _handleExpire(entry); expired++; } }); if (expired > 0) { _log('info', 'Cleanup removed', expired, 'expired entries'); } return expired; }
function clear() { _caches.forEach(entry => { if (entry.refreshTimer) { clearTimeout(entry.refreshTimer); } }); _caches.clear(); _log('info', 'Cache cleared'); }
// @ts-expect-error TS migration - TS2356
function getStats() { const stats = { total: 0, byCategory: {}, expired: 0 }; _caches.forEach(entry => { if (entry.isExpired()) { stats.expired++; } else { stats.total++; if (!(stats.byCategory as Record<string,unknown>)[entry.category as string]) { (stats.byCategory as Record<string,unknown>)[entry.category as string] = 0; } (stats.byCategory as Record<string,unknown>)[entry.category as string]++; } }); return stats; }
function getMetrics() { const hitRate = (_metrics.hits + _metrics.misses) > 0 ? (_metrics.hits / (_metrics.hits + _metrics.misses) * 100).toFixed(1) : 0; return Object.assign({}, _metrics, { hitRate: `${hitRate}%`, size: _caches.size }); }
function resetMetrics() { _metrics = { hits: 0, misses: 0, sets: 0, deletes: 0, expires: 0, refreshes: 0 }; }
function _emitEvent(type: string, data: Record<string,unknown>) { const eventBus = _getPort('eventBus'); if (eventBus && eventBus.emit) { eventBus.emit(`header:cache:${type}`, Object.assign({ timestamp: Date.now() }, data)); } }

function healthCheck() {
  _initPorts();
  const stats = getStats();
  const hitRate = (_metrics.hits + _metrics.misses) > 0 ? _metrics.hits / (_metrics.hits + _metrics.misses) : 1;
  const checks = { hasEntries: stats.total > 0 || _metrics.sets === 0, goodHitRate: hitRate >= 0.5 || (_metrics.hits + _metrics.misses) < 5, lowExpireRate: _metrics.sets === 0 || (_metrics.expires / _metrics.sets) < 0.3, portsInitialized: _portsInitialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, hitRate: `${(hitRate * 100).toFixed(1)}%`, size: _caches.size, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
}

function info() { return { version: VERSION, moduleId: MODULE_ID, stats: getStats(), metrics: getMetrics(), defaultTTLs: Object.assign({}, DEFAULT_TTLS), portsInitialized: _portsInitialized, healthCheck: healthCheck() }; }

export { init, get, set, del, has, getMultiple, setMultiple, deleteMultiple, clearCategory, getByCategory, setTTL, getTTL, extendTTL, cleanup, clear, getStats, getMetrics, resetMetrics, healthCheck, info, DEFAULT_TTLS };
export default { VERSION, MODULE_ID, init, get, set, del, has, clearCategory, cleanup, clear, getStats, getMetrics, healthCheck, info };
