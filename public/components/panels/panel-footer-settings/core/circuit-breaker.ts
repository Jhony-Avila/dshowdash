// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-footer-settings/core/circuit-breaker
// PURPOSE: Footer  - Circuit Breaker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels/panel-footer-settings/core/circuit-breaker';

export class CircuitBreaker {
  [key: string]: any;
  constructor(options: { threshold?: number; timeout?: number } = {}) {
    this.threshold = options.threshold || 5;
    this.timeout = options.timeout || 60000;
    this.state = 'closed';
    this.failures = 0;
    this.lastFailure = null;
    this.successCount = 0;
  }

  async execute(fn: () => Promise<unknown>, fallback?: () => Promise<unknown>) {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (error) {
      this._onFailure();
        if (fallback) return fallback();
      throw error;
    }
  }

  _onSuccess() {
    this.failures = 0;
    this.successCount++;
    if (this.state === 'half-open') this.state = 'closed';
  }

  _onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) this.state = 'open';
  }

  reset() { this.state = 'closed'; this.failures = 0; this.lastFailure = null; }
  getState() { return this.state; }

  healthCheck() {
    return { status: this.state === 'closed' ? 'HEALTHY' : 'degraded', state: this.state, failures: this.failures, version: VERSION, moduleId: MODULE_ID };
  }

  info() { return { version: VERSION, moduleId: MODULE_ID, state: this.state, failures: this.failures, threshold: this.threshold, successCount: this.successCount, healthCheck: this.healthCheck() }; }
  getMetrics() { return { totalRequests: this.totalRequests || 0, failures: this.failures, successes: this.successes || 0 }; }
  destroy() { this.reset(); }
}

export default CircuitBreaker;
