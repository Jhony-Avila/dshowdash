// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/utils/circuit-breaker
// PURPOSE: Panel-01 Circuit Breaker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
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
export const MODULE_ID = 'panel-01/utils/circuit-breaker';

const STATE = { CLOSED: 'CLOSED', OPEN: 'OPEN', HALF_OPEN: 'HALF_OPEN' };

export class CircuitBreaker {
  [key: string]: any;
  constructor(options: { failureThreshold?: number; resetTimeout?: number; halfOpenRequests?: number } = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000;
    this.halfOpenRequests = options.halfOpenRequests || 1;
    this.state = STATE.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailure = null;
    this.halfOpenAttempts = 0;
  }

  async call(fn: () => Promise<unknown>) {
    if (this.state === STATE.OPEN) {
      if (Date.now() - this.lastFailure > this.resetTimeout) {
        this.state = STATE.HALF_OPEN;
        this.halfOpenAttempts = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (error) {
      this._onFailure();
      throw error;
    }
  }

  _onSuccess() {
    this.failures = 0;
    if (this.state === STATE.HALF_OPEN) {
      this.halfOpenAttempts++;
      if (this.halfOpenAttempts >= this.halfOpenRequests) {
        this.state = STATE.CLOSED;
      }
    }
  }

  _onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.failureThreshold) {
      this.state = STATE.OPEN;
    }
  }

  reset() {
    this.state = STATE.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailure = null;
  }

  getState() {
    return { state: this.state, failures: this.failures, lastFailure: this.lastFailure };
  }

  async execute(fn: () => Promise<unknown>, fallback?: () => unknown) {
    try { return await this.call(fn); }
    catch (error) { if (fallback) return fallback(); throw error; }
  }
  getMetrics() { return { totalRequests: this.totalRequests || 0, failures: this.failures, successes: this.successes || 0 }; }
  destroy() { this.reset(); }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default CircuitBreaker;
