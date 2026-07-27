// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-sessions/utils/circuit-breaker
// PURPOSE: Panel User Sessions - Circuit Breaker Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CB_STATES — exported value
//   getVersion() — exported function
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
export const MODULE_ID = 'panel-user-sessions/utils/circuit-breaker';

export const CB_STATES = Object.freeze({
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
});

export class CircuitBreaker {
  [key: string]: any;
  constructor(threshold: number, timeout: number, logger?: { warn?: (event: string, data?: Record<string, unknown>) => void }) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.logger = logger;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.state = CB_STATES.CLOSED;
    this.totalRequests = 0;
  }

  check() {
    this.totalRequests++;
    if (this.state === CB_STATES.OPEN) {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed > this.timeout) {
        this.state = CB_STATES.HALF_OPEN;
        this.failures = 0;
      } else {
        throw new Error(`CIRCUIT_BREAKER_OPEN:${Math.ceil((this.timeout - elapsed) / 1000)}s`);
      }
    }
  }

  recordSuccess() {
    this.successes++;
    if (this.state === CB_STATES.HALF_OPEN) {
      this.state = CB_STATES.CLOSED;
      this.failures = 0;
    }
  }

  recordFailure(error: unknown) {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold && this.state !== CB_STATES.OPEN) {
      this.state = CB_STATES.OPEN;
      this.logger?.warn?.('circuit.open', { failures: this.failures });
    }
  }

  reset() {
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.state = CB_STATES.CLOSED;
    this.totalRequests = 0;
  }

  isOpen() { return this.state === CB_STATES.OPEN; }
  isClosed() { return this.state === CB_STATES.CLOSED; }

  healthCheck() {
    const successRate = this.totalRequests > 0 ? ((this.successes / this.totalRequests) * 100).toFixed(1) : 100;
    return { status: this.state === CB_STATES.CLOSED ? 'HEALTHY' : 'DEGRADED', state: this.state, failures: this.failures, threshold: this.threshold, successRate: `${successRate}%`, healthy: this.state === CB_STATES.CLOSED, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  }

  info() {
    return { version: VERSION, moduleId: MODULE_ID, state: this.state, failures: this.failures, threshold: this.threshold, healthy: this.state === CB_STATES.CLOSED, timestamp: Date.now() };
  }

  async execute(fn: () => Promise<unknown>, fallback?: () => unknown) {
    try { this.check(); } catch (e) { if (fallback) return fallback(); throw e; }
    try { const result = await fn(); this.recordSuccess(); return result; }
    catch (error) { this.recordFailure(error); if (fallback) return fallback(); throw error; }
  }
  getMetrics() { return { totalRequests: this.totalRequests || 0, failures: this.failures, successes: this.successes || 0 }; }
  getState() { return this.state; }
  destroy() { this.reset(); }
}

export function getVersion() { return VERSION; }
export default CircuitBreaker;
