// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-user-profile/core/circuit-breaker
// PURPOSE: Panel User Profile - Circuit Breaker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createCircuitBreaker() — exported function
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
export const MODULE_ID = 'panels/panel-user-profile/core/circuit-breaker';

export class CircuitBreaker {
  [key: string]: any;
  constructor(options: Record<string, unknown> = {}) {
    this.threshold = options.threshold || 5;
    this.timeout = options.timeout || 60000;
    this.halfOpenMax = options.halfOpenMax || 3;
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.halfOpenSuccesses = 0;
    this.lastFailure = null;
    this.lastSuccess = null;
    this._metrics = { totalCalls: 0, successCalls: 0, failedCalls: 0, rejectedCalls: 0 };
  }

  async execute(fn: () => Promise<unknown>, fallback: (() => unknown) | null = null) {
    this._metrics.totalCalls++;
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = 'half-open';
        this.halfOpenSuccesses = 0;
      } else {
        this._metrics.rejectedCalls++;
        if (fallback) return fallback();
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
    this.successes++;
    this.lastSuccess = Date.now();
    this._metrics.successCalls++;
    if (this.state === 'half-open') {
      this.halfOpenSuccesses++;
      if (this.halfOpenSuccesses >= this.halfOpenMax) this.state = 'closed';
    }
  }

  _onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    this._metrics.failedCalls++;
    if (this.failures >= this.threshold) this.state = 'open';
  }

  reset() { this.state = 'closed'; this.failures = 0; this.successes = 0; this.halfOpenSuccesses = 0; this.lastFailure = null; return this; }
  forceOpen() { this.state = 'open'; this.lastFailure = Date.now(); return this; }
  forceClose() { this.state = 'closed'; this.failures = 0; return this; }
  getState() { return this.state; }
  isOpen() { return this.state === 'open'; }
  isClosed() { return this.state === 'closed'; }

  healthCheck() {
    const checks = { stateClosed: this.state === 'closed', noRecentFailures: this.failures < this.threshold, hasSuccesses: this.successes > 0 || this._metrics.totalCalls === 0 };
    let status = 'HEALTHY';
    if (this.state === 'half-open') status = 'DEGRADED';
    if (this.state === 'open') status = 'UNHEALTHY';
    return { status, state: this.state, failures: this.failures, threshold: this.threshold, checks, version: VERSION, moduleId: MODULE_ID };
  }

  info() { return { version: VERSION, moduleId: MODULE_ID, state: this.state, failures: this.failures, threshold: this.threshold, successes: this.successes, metrics: { ...this._metrics }, healthCheck: this.healthCheck() }; }
  getMetrics() { return { ...this._metrics }; }
  destroy() { this.reset(); }
}

export function createCircuitBreaker(options: Record<string, unknown> = {}) { return new CircuitBreaker(options); }
export default CircuitBreaker;
