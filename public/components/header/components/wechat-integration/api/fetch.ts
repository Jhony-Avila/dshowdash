// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header.wechat-integration.api.fetch
// PURPOSE: Boot-safe fetch API for WeChat integration with AbortError fallback
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   IntegrationAPI — Constructor for fetching WeChat API status
//   VERSION, MODULE_ID, getVersion() — Module metadata
//   injectPorts() — Inject port dependencies
//   getPorts() — Get current ports snapshot
// ═══════════════════════════════════════════════════════════════
// WeChat Integration - IntegrationAPI (Enterprise AAA)
// @version 6.1.0-ES6
// @changelog v6.1.0-ES6 - Task 10.1 B05: var → const/let
// @changelog v6.0.0-BOOT-SAFE - AbortError handling + fallback (nunca derruba boot)
// P17WI: PortsFactory/PortsProfiles pattern
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '6.1.0-ES6';
const MODULE_ID = 'header.wechat-integration.api.fetch';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

function _log(level: string, ...args: any[]) {
  const logger = _getPort('logger');
  if (logger && logger[level]) logger[level](...[`[${MODULE_ID}]`].concat(args));
}
function _debug() { const cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug || false; }

// BOOT-SAFE: Fallback factory - nunca retorna erro que derrube o boot
function _createFallback(reason: string) {
  return {
    status: 'unavailable',
    configured: false,
    unread_count: 0,
    message: 'Indisponível no momento',
    integration: 'wechat',
    _fallback: true,
    _fallback_reason: reason
  };
}

// BOOT-SAFE: Detecta AbortError (timeout)
function _isAbortError(error: unknown) {
  if (!error) return false;
  // @ts-expect-error TS migration - TS2339
  if (error.name === 'AbortError') return true;
  // @ts-expect-error TS migration - TS2339
  const msg = String(error.message || '').toLowerCase();
  return msg.indexOf('aborted') !== -1 || msg.indexOf('abort') !== -1;
}

function IntegrationAPI(this: any, endpoint?: string) {
  this.endpoint = endpoint || '/api/integrations/wechat/status.php';
  this.timeout = 12000;
  this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null };
}

IntegrationAPI.prototype.fetchStatus = function() {
  const self = this;
  self._metrics.requestCount++;
  self._metrics.lastRequestAt = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => { controller.abort(); }, self.timeout);

  return fetch(self.endpoint, {
    signal: controller.signal,
    headers: { 'Content-Type': 'application/json' }
  })
    .then(response => {
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
      if (!data.ok) throw new Error(data.error || 'API_ERROR');
      self._metrics.successCount++;
      return data.data;
    })
    .catch(error => {
      clearTimeout(timeoutId);
      self._metrics.errorCount++;

      if (_isAbortError(error)) {
        _log('warn', 'Fetch aborted (non-fatal)', { timeout: self.timeout });
        return _createFallback('timeout');
      }

      _log('error', 'Fetch failed (non-fatal)', { error: error.message });
      return _createFallback('error');
    });
};

IntegrationAPI.prototype.healthCheck = function() {
  const checks = {
    hasEndpoint: !!this.endpoint,
    goodSuccessRate: this._metrics.requestCount === 0 || (this._metrics.successCount / this._metrics.requestCount) > 0.5,
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed === 3 ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: 3,
    scoreDisplay: `${passed}/3`,
    checks,
    portsInitialized: Ports.isInitialized(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: new Date().toISOString()
  };
};

IntegrationAPI.prototype.info = function() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    endpoint: this.endpoint,
    metrics: this._metrics,
    portsInitialized: Ports.isInitialized(),
    healthCheck: this.healthCheck()
  };
};

IntegrationAPI.prototype.getMetrics = function() { return Object.assign({}, this._metrics); };
IntegrationAPI.prototype.resetMetrics = function() { this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null }; };

function getVersion() { return VERSION; }

export { IntegrationAPI, VERSION, MODULE_ID, getVersion, injectPorts, getPorts };
function destroy() { }

export default IntegrationAPI;
