// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header.whatsapp-integration.api.fetch
// PURPOSE: WhatsApp Integration - IntegrationAPI (Enterprise AAA)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   IntegrationAPI() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
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

const VERSION = '6.1.0-ES6';
const MODULE_ID = 'header.whatsapp-integration.api.fetch';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

function _log(level: string, ...args: any[]) {
  const logger = _getPort('logger');
  if (logger && logger[level]) logger[level].apply(logger, [`[${MODULE_ID}]`].concat(args));
}
function _debug() { const cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug || false; }

// BOOT-SAFE: Fallback factory - nunca retorna erro que derrube o boot
function _createFallback(reason: string) {
  return {
    status: 'unavailable',
    configured: false,
    unread_count: 0,
    message: 'Indisponível no momento',
    integration: 'whatsapp',
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
  this.endpoint = endpoint || '/api/integrations/whatsapp/status.php';
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
