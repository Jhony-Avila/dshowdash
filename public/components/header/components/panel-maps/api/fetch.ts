// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v10.1.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: header.panel-maps.api.fetch
// PURPOSE: HTTP fetch API with abort handling and fallback pattern
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
// PROVIDES:
//   FetchAPI — class with fetch(), abort(), healthCheck(), info()
//   injectPorts(p) — inject ports into module
//   getPorts() — return ports snapshot
// WINDOW ACCESS:
//   NONE (via Ports - NR-FULL compliant)
// ═══════════════════════════════════════════════════════════════
// panel-maps - Fetch API (Enterprise AAA)
// @version 10.1.0-STRICT-MODE
// @changelog v10.1.0-STRICT-MODE - Migração para strict mode (NR-FULL compliant)
// @changelog v10.0.0-PORTSFACTORY - Migração para PortsFactory/PortsProfiles (elimina window.Logger)
// @changelog v9.1.0-ENTERPRISE - Logger fallback pattern
// @changelog v9.0.0-BOOT-SAFE - AbortError handling + fallback (nunca derruba boot)
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '10.2.0-P2-ENTERPRISE';
export const MODULE_ID = 'header.panel-maps.api.fetch';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debug = () => _getPort('config')?.app?.debug || false;
const _log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger');
  if (!logger) return;
  if (!_debug() && level === 'debug') return;
  const fn = logger[level] || logger.info;
  if (typeof fn === 'function') fn(`[${MODULE_ID}]`, ...args);
};

function _createFallback(reason: string, endpoint: string) {
  return { data: (null as Record<string,unknown>|null), status: 'unavailable', _fallback: true, _fallback_reason: reason, _endpoint: endpoint };
}

function _isAbortError(error: unknown) {
  if (!error) return false;
  // @ts-expect-error TS migration - TS2339
  if (error.name === 'AbortError') return true;
  // @ts-expect-error TS migration - TS2339
  const msg = String(error.message || '').toLowerCase();
  return msg.includes('aborted') || msg.includes('abort');
}

export class FetchAPI { [key: string]: any;
  constructor(options: { baseUrl?: string; timeout?: number } = {}) {
    this.baseUrl = options.baseUrl || '';
    this.timeout = options.timeout || 12000;
    this._abortController = null;
    this._metrics = { requests: 0, successes: 0, failures: 0, lastRequestAt: null };
  }

  async fetch(endpoint: string, options = {}) {
    this._metrics.requests++;
    this._metrics.lastRequestAt = Date.now();
    this._abortController = new AbortController();
    const timeoutId = setTimeout(() => this._abortController.abort(), this.timeout);
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, { ...options, signal: this._abortController.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this._metrics.successes++;
      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      this._metrics.failures++;
      if (_isAbortError(error)) {
        _log('warn', 'Fetch aborted (non-fatal)', { endpoint, timeout: this.timeout });
        return _createFallback('timeout', endpoint);
      }
      _log('error', 'Fetch failed (non-fatal)', { endpoint, error: error.message });
      return _createFallback('error', endpoint);
    }
  }

  abort() { if (this._abortController) this._abortController.abort(); }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { requests: 0, successes: 0, failures: 0, lastRequestAt: null }; }

  healthCheck() {
    const ps = Ports.snapshot();
    const successRate = this._metrics.requests > 0 ? this._metrics.successes / this._metrics.requests : 1;
    const checks = { ready: true, goodSuccessRate: successRate > 0.5, portsInitialized: ps._initialized };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 3 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 3, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: ps._initialized };
  }

  info() {
    const ps = Ports.snapshot();
    return { version: VERSION, moduleId: MODULE_ID, baseUrl: this.baseUrl, metrics: this.getMetrics(), portsInitialized: ps._initialized };
  }
  destroy() { this.resetMetrics?.(); }
}

export default FetchAPI;
