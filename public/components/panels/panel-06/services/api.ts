// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-06.services.api
// PURPOSE: ApiClient - Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   AUTH_INTENTS from /core/runtime/events/catalog/auth.events.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   ApiClient() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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
import { AUTH_INTENTS } from '/core/runtime/events/catalog/auth.events.js';

const MODULE_ID = 'panel-06.services.api';
const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

function ApiClient(this: any, panelId: string, logger: { error?: (...args: unknown[]) => void }) { this.panelId = panelId; this.logger = logger; this.activeController = null; this.baseURL = '/api/modules/panels'; this._metrics = { fetchCount: 0, successCount: 0, errorCount: 0, authFailCount: 0 }; _initPorts(); }

ApiClient.prototype._isAuthenticated = () => { const auth = _getPort('auth'); return auth?.isAuthenticated ? auth.isAuthenticated() : false; };
ApiClient.prototype._emit = function(eventName: string, data?: Record<string, unknown>) { const eb = _getPort('eventBus'); if (eb?.emit) eb.emit(eventName, { ...(data || {}), source: this.panelId, timestamp: Date.now() }); };
ApiClient.prototype._emitAuthRequired = function() { this._metrics.authFailCount++; this._emit(AUTH_INTENTS.LOGIN, { reason: 'session-expired' }); };

ApiClient.prototype.fetchData = function(options: Record<string, unknown> = {}) {
  if (!this._isAuthenticated()) { this._emitAuthRequired(); return Promise.resolve({ success: false, error: 'AUTH_REQUIRED', message: 'Sessão expirada' }); }
  const signal = options.signal; const controller = signal ? null : new AbortController(); const abortSignal = signal || controller?.signal;
  this._metrics.fetchCount++;
  const url = String(options.url || `${this.baseURL}/${this.panelId}/data`);
  const fetchOptions: RequestInit = { method: (options.method || 'GET') as string, headers: { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> || {}) }, signal: abortSignal as AbortSignal };

  if (options.body) fetchOptions.body = JSON.stringify(options.body);
  return fetch(url, fetchOptions).then(response => { if (!response.ok) { if (response.status === 401) { this._emitAuthRequired(); return { success: false, error: 'AUTH_REQUIRED' }; } throw new Error(`HTTP ${response.status}`); } return response.json(); }).then(data => { this._metrics.successCount++; return { success: true, data }; }).catch(error => { this._metrics.errorCount++; if (this.logger) this.logger.error('fetchData', { error: error.message }); return { success: false, error: error.message }; });
};

ApiClient.prototype.getMetrics = function() { return { ...this._metrics }; };
ApiClient.prototype.abort = function() { if (this.activeController) { this.activeController.abort(); this.activeController = null; } };

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION });

export { ApiClient, MODULE_ID, VERSION };
export default ApiClient;
