// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: _shared/core/circuit-breaker-base
// PURPOSE: Panel CircuitBreaker Factory
// ───────────────────────────────────────────────────────────────
// IMPORTS: (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createModuleCircuitBreaker() — exported function (factory)
//
// RECEIVES (via init/options): moduleId
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = '_shared/core/circuit-breaker-base';

export function createModuleCircuitBreaker(moduleId: string) {
  const MODULE_ID = moduleId;

  class CircuitBreaker {
  [key: string]: any;
    constructor(options: { threshold?: number; timeout?: number; halfOpenMax?: number } = {}) {
      this.threshold = options.threshold || 5;
      this.timeout = options.timeout || 60000;
      this.halfOpenMax = options.halfOpenMax || 3;
      this.state = 'closed';
      this.failures = 0;
      this.lastFailure = null;
      this.halfOpenSuccesses = 0;
      this._metrics = { totalCalls: 0, successCalls: 0, failedCalls: 0, rejectedCalls: 0 };
    }

    async execute(fn: () => Promise<unknown>, fallback?: (() => unknown) | null) {
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

    reset() { this.state = 'closed'; this.failures = 0; this.lastFailure = null; this.halfOpenSuccesses = 0; }
    getState() { return this.state; }
    isOpen() { return this.state === 'open'; }
    isClosed() { return this.state === 'closed'; }
    getMetrics() { return { ...this._metrics }; }
    destroy() { this.reset(); }

    healthCheck() {
      let status = 'HEALTHY';
      if (this.state === 'half-open') status = 'DEGRADED';
      if (this.state === 'open') status = 'UNHEALTHY';
      return { status, state: this.state, failures: this.failures, threshold: this.threshold, metrics: this._metrics, version: VERSION, moduleId: MODULE_ID };
    }

    info() { return { version: VERSION, moduleId: MODULE_ID, state: this.state, failures: this.failures, threshold: this.threshold, metrics: { ...this._metrics }, healthCheck: this.healthCheck() }; }
  }

  return { CircuitBreaker, MODULE_ID, VERSION };
}
