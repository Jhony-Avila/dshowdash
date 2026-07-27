// =============================================================
// DEPENDENCY CONTRACT (v5.6.0-ES6)
// =============================================================
// MODULE: header.real-time-clock.api.fetch
// PURPOSE: HTTP fetch adapter with timeout, abort handling, and Ports integration
// -------------------------------------------------------------
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   FetchAdapter (constructor)
//   VERSION, MODULE_ID, getVersion()
//   injectPorts(p), getPorts()
// =============================================================
// Real Time Clock - Fetch Adapter (Enterprise AAA)
// @version 5.6.0-ES6
// @changelog v5.6.0-ES6 - Task 10.1 B03: var → const/let
// P17WI: PortsFactory/PortsProfiles pattern
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '5.6.0-ES6';
const MODULE_ID = 'header.real-time-clock.api.fetch';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

function _debug() { const cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug || false; }

function _log(level: 'error' | 'warn' | 'info' | 'debug', ...args: any[]) { const logger = _getPort('logger'); if (!logger) return; if (!_debug() && level === 'debug') return; const fn = logger[level] || logger.info; if (typeof fn === 'function') fn.apply(logger, [`[${MODULE_ID}]`].concat(args)); }

function FetchAdapter(this: any, options: Record<string,unknown>) { options = options || {}; this.baseURL = options.baseURL || ''; this.timeout = options.timeout || 10000; this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null }; }

FetchAdapter.prototype.get = function(endpoint: string) {
  const self = this;
  self._metrics.requestCount++;
  self._metrics.lastRequestAt = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => { controller.abort(); }, self.timeout);
  return fetch(self.baseURL + endpoint, { signal: controller.signal })
    .then(response => { clearTimeout(timeoutId); if (!response.ok) throw new Error(`HTTP ${response.status}`); self._metrics.successCount++; return response.json(); })
    .catch(error => { clearTimeout(timeoutId); self._metrics.errorCount++; const reason = error.name === 'AbortError' ? 'timeout' : 'network-error'; _log('warn', 'Request failed (non-fatal)', endpoint, reason); return { now: (null as unknown|null), _fallback: true, _reason: reason }; });
};

FetchAdapter.prototype.healthCheck = function() {
  const checks = { hasBaseURL: true, goodSuccessRate: this._metrics.requestCount === 0 || (this._metrics.successCount / this._metrics.requestCount) > 0.5, hasLogger: !!_getPort('logger'), portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed >= 3 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 4, scoreDisplay: `${passed}/4`, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
};

FetchAdapter.prototype.info = function() { return { version: VERSION, moduleId: MODULE_ID, baseURL: this.baseURL, metrics: this._metrics, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() }; };
FetchAdapter.prototype.getMetrics = function() { return Object.assign({}, this._metrics); };
FetchAdapter.prototype.resetMetrics = function() { this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null }; };

function getVersion() { return VERSION; }

export { FetchAdapter, VERSION, MODULE_ID, getVersion, injectPorts, getPorts };
function destroy() { }

export default FetchAdapter;
