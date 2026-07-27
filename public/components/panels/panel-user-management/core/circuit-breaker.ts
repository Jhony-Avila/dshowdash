// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-management.core.circuit-breaker
// PURPOSE: Circuit Breaker - Enterprise Pattern
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
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

export const MODULE_ID = 'panel-user-management.core.circuit-breaker';
export const VERSION = '9.3.0-P2-ENTERPRISE';

export class CircuitBreaker {
  [key: string]: any;
  constructor(options: Record<string, unknown> = {}) {
    this.threshold = options.threshold || 3;
    this.timeout = options.timeout || 30000;
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailure = null;
    this.resetTimer = null;
  }
  isOpen() { return this.state === 'OPEN'; }
  isClosed() { return this.state === 'CLOSED'; }
  isHalfOpen() { return this.state === 'HALF_OPEN'; }
  recordSuccess() { this.failures = 0; this.state = 'CLOSED'; if (this.resetTimer) { clearTimeout(this.resetTimer); this.resetTimer = null; } }
  recordFailure() { this.failures++; this.lastFailure = Date.now(); if (this.failures >= this.threshold) { this.state = 'OPEN'; this.resetTimer = setTimeout(() => { this.state = 'HALF_OPEN'; }, this.timeout); } }
  canExecute() { if (this.state === 'CLOSED') return true; if (this.state === 'HALF_OPEN') return true; if (this.state === 'OPEN' && Date.now() - this.lastFailure > this.timeout) { this.state = 'HALF_OPEN'; return true; } return false; }
  reset() { this.failures = 0; this.state = 'CLOSED'; this.lastFailure = null; if (this.resetTimer) { clearTimeout(this.resetTimer); this.resetTimer = null; } }
  getState() { return { state: this.state, failures: this.failures, threshold: this.threshold, timeout: this.timeout }; }
  healthCheck() { return { status: this.state === 'OPEN' ? 'DEGRADED' : 'HEALTHY', moduleId: MODULE_ID, version: VERSION, state: this.state, failures: this.failures }; }
  info() { return { moduleId: MODULE_ID, version: VERSION, ...this.getState() }; }

  async execute(fn: () => Promise<unknown>, fallback?: () => unknown) {
    if (!this.canExecute()) { if (fallback) return fallback(); throw new Error('Circuit breaker is open'); }
    try { const result = await fn(); this.recordSuccess(); return result; }

    // @ts-expect-error TS migration - TS2554
    catch (error) { this.recordFailure(error); if (fallback) return fallback(); throw error; }
  }
  getMetrics() { return { totalRequests: this.totalRequests || 0, failures: this.failures, successes: this.successes || 0 }; }
  destroy() { this.reset(); }
}

export function createCircuitBreaker(options: Record<string, unknown>) { return new CircuitBreaker(options); }
export default { CircuitBreaker, createCircuitBreaker, MODULE_ID, VERSION };
