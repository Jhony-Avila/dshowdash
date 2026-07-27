// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.4.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-sw-cache
// PURPOSE: Login Modal - Service Worker Cache Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   ServiceWorkerCache() — exported function
//   PRECACHE_ASSETS — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '1.4.0-P17WI';
const MODULE_ID = 'login-modal-sw-cache';
const CACHE_NAME = 'login-modal-v2';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string) { const logger = _getPort('logger'); if (!logger) return; const args = Array.prototype.slice.call(arguments, 1); if (level === 'error') { if (logger.error) logger.error(...['[sw-cache]'].concat(args)); return; } if (level === 'warn') { if (logger.warn) logger.warn(...['[sw-cache]'].concat(args)); return; } if (_debugEnabled() && logger.debug) logger.debug(...['[sw-cache]'].concat(args)); };

const PRECACHE_ASSETS = ['/components/login-modal/styles.css', '/components/login-modal/index.js', '/components/login-modal/template.js', '/components/login-modal/config.json', '/assets/videos/video_background_site_web.mp4', '/assets/icons/logo-horizontal.png'];

export function ServiceWorkerCache(this: any, config: Record<string, any>) { if (!config) config = {}; const sw = config.serviceWorker || {}; this.config = config; this.enabled = sw.enabled !== false && typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof caches !== 'undefined'; this.cacheName = sw.cacheName || CACHE_NAME; this.precacheAssets = sw.assets || PRECACHE_ASSETS; this._registered = false; this._metrics = { cacheHits: 0, cacheMisses: 0, precached: 0, errors: 0 }; _initPorts(); }


// @ts-expect-error TS migration - TS2554
ServiceWorkerCache.prototype.init = function() { const self = this; if (!self.enabled) { _log('info', 'Service Worker não disponível'); return Promise.resolve(false); } return self.precache().then(() => { _log('info', 'Service Worker Cache inicializado'); return true; }).catch(error => { self._metrics.errors++; _log('error', 'Erro ao inicializar SW Cache', error); return false; }); };


// @ts-expect-error TS migration - TS2554
ServiceWorkerCache.prototype.precache = function() { const self = this; if (!self.enabled) return Promise.resolve(false); return caches.open(self.cacheName).then(cache => { const validAssets = []; const checkPromises = self.precacheAssets.map(asset => { const _c = new AbortController(); const _t = setTimeout(() => _c.abort(), 5000); return fetch(asset, { method: 'HEAD', cache: 'no-store', signal: _c.signal }).then(response => { clearTimeout(_t); if (response.ok) validAssets.push(asset); }).catch(() => { clearTimeout(_t); _log('warn', 'Asset não disponível para cache:', asset); }); }); return Promise.all(checkPromises).then(() => { if (validAssets.length > 0) { return cache.addAll(validAssets).then(() => { self._metrics.precached = validAssets.length; _log('info', `${validAssets.length} assets pre-cacheados`); }); } }); }).then(() => true).catch(error => { self._metrics.errors++; _log('error', 'Erro no precache', error); return false; }); };


// @ts-expect-error TS migration - TS2554
ServiceWorkerCache.prototype.get = function(url: string) { const self = this; if (!self.enabled) return Promise.resolve(null); return caches.open(self.cacheName).then(cache => cache.match(url).then(response => { if (response) { self._metrics.cacheHits++; _log('info', 'Cache hit:', url); return response; } self._metrics.cacheMisses++; return null; })).catch(() => { self._metrics.errors++; return null; }); };

ServiceWorkerCache.prototype.put = function(url: string, response: Response) { const self = this; if (!self.enabled) return Promise.resolve(false); return caches.open(self.cacheName).then(cache => cache.put(url, response.clone()).then(() => true)).catch(() => { self._metrics.errors++; return false; }); };


// @ts-expect-error TS migration - TS2554
ServiceWorkerCache.prototype.fetchWithCache = function(url: string, options: RequestInit) { const self = this; if (!options) options = {}; if (!self.enabled) return fetch(url, options); return self.get(url).then(cached => { if (cached) return cached; return fetch(url, options).then(response => { if (response.ok) self.put(url, response); return response; }); }).catch(error => { _log('error', 'Network fetch falhou e não há cache:', url); throw error; }); };


// @ts-expect-error TS migration - TS2554
ServiceWorkerCache.prototype.clearCache = function() { const self = this; if (!self.enabled) return Promise.resolve(false); return caches.delete(self.cacheName).then(() => { self._metrics.precached = 0; _log('info', 'Cache limpo'); return true; }).catch(() => { self._metrics.errors++; return false; }); };

ServiceWorkerCache.prototype.getCacheSize = function() { const self = this; if (!self.enabled) return Promise.resolve({ count: 0, size: 0 }); return caches.open(self.cacheName).then(cache => cache.keys().then(keys => { let totalSize = 0; const sizePromises = keys.map(request => cache.match(request).then(response => { if (response) return response.clone().blob().then(blob => { totalSize += blob.size; }); })); return Promise.all(sizePromises).then(() => ({
  count: keys.length,
  size: totalSize,
  sizeFormatted: self._formatBytes(totalSize)
})); })).catch(error => ({
  count: 0,
  size: 0,
  error: error.message
})); };

ServiceWorkerCache.prototype._formatBytes = (bytes: number) => { if (bytes === 0) return '0 Bytes'; const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`; };

ServiceWorkerCache.prototype.info = function() { return { moduleId: MODULE_ID, version: VERSION, enabled: this.enabled, cacheName: this.cacheName, portsInitialized: Ports.isInitialized(), metrics: Object.assign({}, this._metrics), timestamp: Date.now() }; };

ServiceWorkerCache.prototype.healthCheck = function() { const logger = _getPort('logger'); const checks = { enabled: this.enabled, hasCacheAPI: typeof caches !== 'undefined', lowErrorRate: this._metrics.precached === 0 || (this._metrics.errors / this._metrics.precached) < 0.3, loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 5 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/5`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; };

export { PRECACHE_ASSETS, VERSION, MODULE_ID };
export default ServiceWorkerCache;
