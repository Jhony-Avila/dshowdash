// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.6.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-04.services.api
// PURPOSE: Panel-04 API Client
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   AUTH_EVENTS, AUTH_INTENTS from /core/runtime/events/catalog/auth.events.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   ApiClient() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventName
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { AUTH_EVENTS, AUTH_INTENTS } from '/core/runtime/events/catalog/auth.events.js';

const MODULE_ID = 'panel-04.services.api';
const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function ApiClient(this: any, panelId: string, options: Record<string, unknown> = {}) {
  if (options === undefined) options = {};
  this.panelId = panelId;
  this.logger = options.logger || options;
  this.debug = options.debug || (() => false);
  this.activeController = null;
  this.baseURL = '/api/modules/panels';
  this._metrics = { fetchCount: 0, successCount: 0, errorCount: 0, authFailCount: 0, avgResponseTime: 0, lastResponseTime: 0 };
}

ApiClient.prototype._log = function(level: string, action: string, data: Record<string, unknown> = {}) { if (level === 'debug' && !this.debug()) return; if (this.logger && this.logger.info) { const fn = this.logger[level] || this.logger.info; if (typeof fn === 'function') fn.call(this.logger, action, data); } };

ApiClient.prototype._isAuthenticated = () => { const auth = _getPort('auth'); return auth && auth.isAuthenticated ? auth.isAuthenticated() : false; };

ApiClient.prototype._emit = function(eventName: string, data: Record<string, unknown> = {}) { _initPorts(); const eventBus = _getPort('eventBus') as { emit?: (...a: unknown[]) => void } | null; if (eventBus && eventBus.emit) { eventBus.emit(eventName, Object.assign({}, data, { source: this.panelId, timestamp: Date.now() })); } };

ApiClient.prototype._emitAuthRequired = function() { this._metrics.authFailCount++; this._emit(AUTH_INTENTS.LOGIN, { reason: 'session-expired' }); };

ApiClient.prototype._updateMetrics = function(responseTime: number, success: boolean) { this._metrics.lastResponseTime = responseTime; const total = this._metrics.successCount + this._metrics.errorCount; if (total > 0) { this._metrics.avgResponseTime = (this._metrics.avgResponseTime * (total - 1) + responseTime) / total; } };

ApiClient.prototype.fetchData = function(options: Record<string, unknown> = {}) {
  const self = this;
  if (options === undefined) options = {};
  if (!this._isAuthenticated()) { this._emitAuthRequired(); return Promise.resolve({ success: false, error: 'AUTH_REQUIRED', message: 'Sessão expirada' }); }
  const signal = options.signal; const timeout = (options.timeout as number) || 15000; const period = (options.period as string) || '24h'; const startTime = performance.now();
  const controller = signal ? null : new AbortController(); const abortSignal = signal || (controller ? controller.signal : null);
  if (!signal) this.activeController = controller;
  const timeoutId = setTimeout(() => { if (controller) { controller.abort(); self._log('warn', 'api.timeout', { timeout }); } }, timeout);
  const url = `${this.baseURL}/${this.panelId}/api.php?period=${encodeURIComponent(period)}`;
  this._metrics.fetchCount++;
  self._log('debug', 'api.fetch-start', { url, period });

  // @ts-expect-error TS migration - TS2345
  return fetch(url, { method: 'GET', signal: abortSignal, credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-Panel-Id': this.panelId, 'X-Request-Time': Date.now().toString() } }).then(response => {
    clearTimeout(timeoutId);
    const responseTime = performance.now() - startTime;
    if (response.status === 401) { self._metrics.authFailCount++; self._emit(AUTH_EVENTS.SESSION_EXPIRED); return { success: false, error: 'AUTH_REQUIRED', message: 'Sessão expirada' }; }
    if (!response.ok) { self._metrics.errorCount++; self._log('warn', 'api.http-error', { status: response.status }); return { success: false, error: `HTTP_${response.status}`, message: `Erro HTTP: ${response.status}` }; }
    const contentType = response.headers.get('content-type');
    if (!contentType || contentType.indexOf('application/json') === -1) { self._metrics.errorCount++; self._log('error', 'api.invalid-content-type', { contentType }); return { success: false, error: 'INVALID_CONTENT_TYPE', message: 'Resposta não é JSON' }; }
    return response.json().then(data => { self._metrics.successCount++; self._updateMetrics(responseTime, true); self._log('debug', 'api.fetch-success', { responseTime: `${responseTime.toFixed(2)}ms`, dataSize: JSON.stringify(data).length }); return { success: true, payload: data, meta: { responseTime, period } }; });
  }).catch(error => {
    clearTimeout(timeoutId);
    const responseTime = performance.now() - startTime;
    if (error.name === 'AbortError') { self._log('debug', 'api.aborted'); return { success: false, error: 'REQUEST_ABORTED', message: 'Requisição cancelada' }; }
    self._metrics.errorCount++; self._updateMetrics(responseTime, false); self._log('error', 'api.fetch-error', { error: error.message, responseTime: `${responseTime.toFixed(2)}ms` });
    return { success: false, error: 'NETWORK_ERROR', message: error.message || 'Erro de rede' };
  }).finally(() => { if (controller) self.activeController = null; });
};

ApiClient.prototype.cancel = function() { if (this.activeController) { this._log('debug', 'api.cancel'); this.activeController.abort(); this.activeController = null; } };
ApiClient.prototype.getMetrics = function() { return Object.assign({}, this._metrics, { successRate: this._metrics.fetchCount > 0 ? `${((this._metrics.successCount / this._metrics.fetchCount) * 100).toFixed(1)}%` : '100%' }); };
ApiClient.prototype.reset = function() { this.cancel(); this._metrics = { fetchCount: 0, successCount: 0, errorCount: 0, authFailCount: 0, avgResponseTime: 0, lastResponseTime: 0 }; this._log('debug', 'api.reset'); };
ApiClient.prototype.healthCheck = function() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, panelId: this.panelId, metrics: this.getMetrics(), hasActiveRequest: !!this.activeController }; };
ApiClient.prototype.info = function() { return { moduleId: MODULE_ID, version: VERSION, panelId: this.panelId, baseURL: this.baseURL }; };

export { ApiClient, VERSION, MODULE_ID };
export default ApiClient;
