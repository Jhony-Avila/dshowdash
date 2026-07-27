// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: header.panel-chatgpt.api.fetch
// PURPOSE: panel-chatgpt - Fetch API (Enterprise AAA)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   NONE (via Ports - NR-FULL compliant)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '10.2.0-P2-ENTERPRISE';
export const MODULE_ID = 'header.panel-chatgpt.api.fetch';

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
