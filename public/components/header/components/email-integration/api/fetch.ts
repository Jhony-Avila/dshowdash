// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header.email-integration.api.fetch
// PURPOSE: API adapter for email status fetching (boot-safe, contract validation)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   VERSION, MODULE_ID — module metadata
//   injectPorts(p) — inject external ports
//   getPorts() — get ports snapshot
//   IntegrationAPI(options) — email API request constructor
//   IntegrationAPI (default) — default export
// ═══════════════════════════════════════════════════════════════
// Email Integration - API Adapter (Enterprise AAA)
// @version 6.1.0-ES6
// @changelog v6.1.0-ES6 - Task 10.1 B11: var → const/let
// @changelog v6.0.0-AAA-BOOT-FIX - P0 Fix: URL canônica, validação de contrato
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '6.1.0-ES6';
export const MODULE_ID = 'header.email-integration.api.fetch';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = function(level: string, ...args: any[]) {
  const logger = _getPort('logger');
  if (logger && logger[level]) logger[level](...[`[${MODULE_ID}]`].concat(args));
};

function _trackTelemetry(event: string, data: Record<string,unknown>) {
  try {
    const telemetry = _getPort('telemetry');
    if (telemetry && telemetry.track) telemetry.track(`${MODULE_ID}:${event}`, data || {});
  } catch (e) {}
}

function _validateResponseContract(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.indexOf('application/json') !== -1;
  const isHtml = contentType.indexOf('text/html') !== -1;
  return {
    ok: response.ok,
    status: response.status,
    isJson,
    isHtml,
    contentType,
    isContractViolation: !isJson && response.ok,
    isAuthError: response.status === 401 || response.status === 403
  };
}

function _createFallback(reason: string) {
  return { received_today: 0, unread: 0, status: 'unavailable', _fallback: true, _reason: reason };
}

export function IntegrationAPI(this: any, options?: { baseURL?: string; timeout?: number; headers?: Record<string, string> }) {
  if (!options) options = {};
  this.baseURL = options.baseURL || '/api/email';
  this.timeout = options.timeout || 10000;
  this.headers = options.headers || {};
  this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, contractViolations: 0, authErrors: 0, lastRequestAt: null };
}

IntegrationAPI.prototype.get = function(endpoint: string, options: Record<string,unknown>) {
  return this._request('GET', endpoint, null, options || {});
};

IntegrationAPI.prototype.post = function(endpoint: string, data: Record<string,unknown>, options: Record<string,unknown>) {
  return this._request('POST', endpoint, data, options || {});
};

IntegrationAPI.prototype._request = function(method: string, endpoint: string, data: Record<string,unknown>, options: Record<string,unknown>) {
  const self = this;
  self._metrics.requestCount++;
  self._metrics.lastRequestAt = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => { controller.abort(); }, self.timeout);
  
  const config: Record<string, unknown> = {
    method,
    headers: Object.assign({ 'Accept': 'application/json' }, self.headers, options.headers || {}),
    signal: controller.signal,
    credentials: 'include'
  };
  
  if (data) {
    config.body = JSON.stringify(data);
    (config.headers as Record<string,unknown>)['Content-Type'] = 'application/json';
  }
  
  const url = self.baseURL + endpoint;
  
  return fetch(url, config)
    .then(response => {
      clearTimeout(timeoutId);
      
      const contract = _validateResponseContract(response);
      
      if (contract.isAuthError) {
        self._metrics.authErrors++;
        _log('info', 'Auth required', { status: contract.status });
        return _createFallback('auth-required');
      }
      
      if (contract.isContractViolation) {
        self._metrics.contractViolations++;
        _log('error', 'API_CONTRACT_VIOLATION', { contentType: contract.contentType });
        _trackTelemetry('contract-violation', { contentType: contract.contentType });
        return _createFallback('contract-violation');
      }
      
      if (!response.ok) {
        self._metrics.errorCount++;
        return _createFallback('http-error');
      }
      
      self._metrics.successCount++;
      return response.json();
    })
    .catch(error => {
      clearTimeout(timeoutId);
      self._metrics.errorCount++;
      _log('error', 'Request failed', { method, endpoint, error: error.message });
      return _createFallback('network-error');
    });
};

IntegrationAPI.prototype.fetchStatus = function() {
  const self = this;
  self._metrics.requestCount++;
  self._metrics.lastRequestAt = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => { controller.abort(); }, self.timeout);
  
  const url = '/api/outlook/header-counter';
  
  return fetch(url, { 
    signal: controller.signal, 
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  })
    .then(response => {
      clearTimeout(timeoutId);
      
      const contract = _validateResponseContract(response);
      
      if (contract.isAuthError) {
        self._metrics.authErrors++;
        _log('info', 'Auth required for email status', { status: contract.status });
        return _createFallback('auth-required');
      }
      
      if (contract.isContractViolation) {
        self._metrics.contractViolations++;
        _log('error', `API_CONTRACT_VIOLATION: Expected JSON, got ${contract.contentType}`, { url });
        _trackTelemetry('contract-violation', { contentType: contract.contentType, url });
        return _createFallback('contract-violation');
      }
      
      if (!response.ok) {
        self._metrics.errorCount++;
        return _createFallback('http-error');
      }
      
      self._metrics.successCount++;
      return response.json();
    })
    .then(data => {
      if (data && data._fallback) return data;
      { const d = data && data.data ? data.data : data; return { received_today: d.received_today || 0, unread: d.unread || 0, updated_at: d.updated_at || null, status: 'ok' }; }
    })
    .catch(error => {
      clearTimeout(timeoutId);
      self._metrics.errorCount++;
      const reason = error.name === 'AbortError' ? 'timeout' : 'network-error';
      _log('warn', 'Fetch failed, using fallback', { error: error.message, reason });
      return _createFallback(reason);
    });
};

IntegrationAPI.prototype.healthCheck = function() {
  const ps = Ports.snapshot();
  const checks = { 
    hasBaseURL: this.baseURL !== undefined, 
    goodSuccessRate: this._metrics.requestCount === 0 || (this._metrics.successCount / this._metrics.requestCount) > 0.5, 
    lowContractViolations: this._metrics.requestCount === 0 || (this._metrics.contractViolations / this._metrics.requestCount) < 0.1,
    portsInitialized: ps._initialized 
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return { 
    status: passed === 4 ? 'HEALTHY' : 'DEGRADED', 
    score: passed, 
    maxScore: 4, 
    scoreDisplay: `${passed}/4`, 
    checks, 
    version: VERSION, 
    moduleId: MODULE_ID, 
    timestamp: new Date().toISOString() 
  };
};

IntegrationAPI.prototype.info = function() {
  const ps = Ports.snapshot();
  return { 
    version: VERSION, 
    moduleId: MODULE_ID, 
    baseURL: this.baseURL, 
    metrics: this._metrics, 
    portsInitialized: ps._initialized, 
    healthCheck: this.healthCheck() 
  };
};

IntegrationAPI.prototype.getMetrics = function() { return Object.assign({}, this._metrics); };
IntegrationAPI.prototype.resetMetrics = function() { this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, contractViolations: 0, authErrors: 0, lastRequestAt: null }; };

function destroy() { }

export default IntegrationAPI;
