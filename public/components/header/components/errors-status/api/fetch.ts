// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.4.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header.errors-status.api.fetch
// PURPOSE: Errors Status - API (Enterprise AAA)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   ErrorsAPI() — exported function
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
export const VERSION = '5.4.0-ES6';
export const MODULE_ID = 'header.errors-status.api.fetch';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _debug = () => { const cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug || false; };
const _log = function(level: string) { const args = Array.prototype.slice.call(arguments, 1); const logger = _getPort('logger'); if (!logger) return; if (!_debug() && level === 'debug') return; const fn = logger[level] || logger.info; if (typeof fn === 'function') fn(`[${MODULE_ID}]`, args.join(' ')); };
export function ErrorsAPI(this: any, options: Record<string,unknown>) { options = options || {}; this.baseUrl = options.baseUrl || '/api/errors'; this.timeout = options.timeout || 5000; this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null }; }

// @ts-expect-error TS migration - TS2554
ErrorsAPI.prototype.fetchErrors = function() { const self = this; self._metrics.requestCount++; self._metrics.lastRequestAt = Date.now(); const controller = new AbortController(); const timeoutId = setTimeout(() => { controller.abort(); }, self.timeout); return fetch(self.baseUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' }, signal: controller.signal }).then(response => { clearTimeout(timeoutId); if (!response.ok) { self._metrics.errorCount++; return { error_count: 0 }; } self._metrics.successCount++; return response.json(); }).catch(error => { clearTimeout(timeoutId); self._metrics.errorCount++; _log('error', 'Failed to fetch errors', error.message); return { error_count: 0 }; }); };
ErrorsAPI.prototype.healthCheck = function() { const ps = Ports.snapshot(); const checks = { hasBaseUrl: !!this.baseUrl, goodSuccessRate: this._metrics.requestCount === 0 || (this._metrics.successCount / this._metrics.requestCount) > 0.5, hasLogger: !!_getPort('logger'), portsInitialized: ps._initialized }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed >= 3 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 4, scoreDisplay: `${passed}/4`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: ps._initialized, timestamp: new Date().toISOString() }; };
ErrorsAPI.prototype.info = function() { const ps = Ports.snapshot(); return { version: VERSION, moduleId: MODULE_ID, baseUrl: this.baseUrl, metrics: this._metrics, portsInitialized: ps._initialized, healthCheck: this.healthCheck() }; };
ErrorsAPI.prototype.getMetrics = function() { return Object.assign({}, this._metrics); };
ErrorsAPI.prototype.resetMetrics = function() { this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null }; };
function destroy() { }

export default ErrorsAPI;
