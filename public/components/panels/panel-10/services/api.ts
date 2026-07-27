// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.6.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-10.services.api
// PURPOSE: Panel-10 ApiClient Enterprise
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
//   'abort'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { AUTH_EVENTS, AUTH_INTENTS } from '/core/runtime/events/catalog/auth.events.js';

const MODULE_ID = 'panel-10.services.api';
const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const CONFIG = { timeout: 10000, retryAttempts: 2, retryDelay: 1000, retryMultiplier: 2 };

function _emit(eventName: string, data: Record<string, any> = {}) { try { const eb = _getPort('eventBus'); if (eb?.emit) eb.emit(eventName, { source: MODULE_ID, timestamp: Date.now(), ...data }); } catch (e) {} }

function ApiClient(this: any, panelId: string, logger: Record<string, unknown>) { this.panelId = panelId; this.logger = logger; this.activeController = null; this.baseURL = '/api/modules/panels'; this._lastData = null; this._lastFetchTime = null; this._metrics = { fetchCount: 0, successCount: 0, errorCount: 0, authFailCount: 0, retryCount: 0, totalDuration: 0, avgDuration: 0 }; _initPorts(); }

ApiClient.prototype._isAuthenticated = () => { try { const auth = _getPort('auth'); return auth?.isAuthenticated ? auth.isAuthenticated() : false; } catch (e) { return false; } };
ApiClient.prototype._emitAuthRequired = function(reason?: string) { this._metrics.authFailCount++; _emit(AUTH_INTENTS.LOGIN, { reason: reason || 'session-expired', source: this.panelId }); };

ApiClient.prototype.fetchData = function(options: Record<string, any> = {}) {
    if (!this._isAuthenticated()) { this._emitAuthRequired(); return Promise.resolve({ success: false, error: 'AUTH_REQUIRED', message: 'Sessão expirada' }); }
    const { signal, timeout = CONFIG.timeout, retries = CONFIG.retryAttempts } = options;
    const url = `${this.baseURL}/${this.panelId}/api.php`; const startTime = performance.now(); this._metrics.fetchCount++;

    const attempt = (attemptNum: number) => new Promise((resolve) => {
        const controller = new AbortController(); const timeoutId = setTimeout(() => { controller.abort(); }, timeout);
        if (signal) signal.addEventListener('abort', () => { controller.abort(); }); this.activeController = controller;
        fetch(url, { signal: controller.signal, credentials: 'include', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Panel-Id': this.panelId, 'X-Request-ID': `${this.panelId}-${Date.now()}` } })
            .then((response) => {
                clearTimeout(timeoutId);
                if (response.status === 401) { this._metrics.authFailCount++; _emit(AUTH_EVENTS.SESSION_EXPIRED, { source: this.panelId }); resolve({ success: false, error: 'AUTH_REQUIRED', message: 'Sessão expirada' }); return; }
                if (response.status === 403) { resolve({ success: false, error: 'ACCESS_DENIED', message: 'Acesso negado' }); return; }
                if (!response.ok) throw new Error(`HTTP_${response.status}`);
                return response.json();
            })
            .then((data) => {
                if (!data) return;
                const duration = performance.now() - startTime; this._metrics.successCount++; this._metrics.totalDuration += duration; this._metrics.avgDuration = this._metrics.totalDuration / this._metrics.successCount;
                this._lastData = data; this._lastFetchTime = Date.now();
                this.logger?.debug?.('api.success', { duration: `${duration.toFixed(2)}ms`, attempt: attemptNum + 1 });
                resolve({ success: true, payload: data, duration });
            })
            .catch((error) => {
                if (error.name === 'AbortError') { resolve({ success: false, error: 'REQUEST_ABORTED' }); return; }
                if (attemptNum < retries) { this._metrics.retryCount++; const delay = CONFIG.retryDelay * Math.pow(CONFIG.retryMultiplier, attemptNum); this.logger?.warn?.('api.retry', { attempt: attemptNum + 1, delay, error: error.message }); setTimeout(() => { attempt(attemptNum + 1).then(resolve); }, delay); }
                else { this._metrics.errorCount++; this.logger?.error?.('api.failed', { error: error.message }); resolve({ success: false, error: error.message.includes('HTTP_') ? error.message : 'NETWORK_ERROR', message: error.message }); }
            });
    });
    return attempt(0);
};

ApiClient.prototype.cancel = function() { if (this.activeController) { this.activeController.abort(); this.activeController = null; this.logger?.debug?.('api.cancelled'); } };
ApiClient.prototype.getLastData = function() { return this._lastData; };
ApiClient.prototype.getLastFetchTime = function() { return this._lastFetchTime; };
ApiClient.prototype.hasRecentData = function(maxAge = 60000) { if (!this._lastFetchTime) return false; return Date.now() - this._lastFetchTime < maxAge; };
ApiClient.prototype.getMetrics = function() { return { ...this._metrics, successRate: this._metrics.fetchCount > 0 ? `${((this._metrics.successCount / this._metrics.fetchCount) * 100).toFixed(1)}%` : '0%' }; };
ApiClient.prototype.resetMetrics = function() { this._metrics = { fetchCount: 0, successCount: 0, errorCount: 0, authFailCount: 0, retryCount: 0, totalDuration: 0, avgDuration: 0 }; };
ApiClient.prototype.healthCheck = function() { const errorRate = this._metrics.fetchCount > 0 ? this._metrics.errorCount / this._metrics.fetchCount : 0; return { status: errorRate > 0.5 ? 'unhealthy' : errorRate > 0.2 ? 'degraded' : 'healthy', authenticated: this._isAuthenticated(), hasRecentData: this.hasRecentData(), metrics: this.getMetrics(), version: VERSION, moduleId: MODULE_ID }; };

export { ApiClient, VERSION, MODULE_ID };
export default ApiClient;
