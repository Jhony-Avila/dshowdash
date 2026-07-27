// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-16/utils/circuit-breaker
// PURPOSE: Panel-16 Circuit Breaker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CircuitBreaker() — exported function
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
export const MODULE_ID = 'panel-16/utils/circuit-breaker';

CircuitBreaker.prototype.execute = async function(fn: () => Promise<unknown>, fallback?: () => unknown) { try { this.check(); } catch (e) { if (fallback) return fallback(); throw e; } try { var result = await fn(); this.recordSuccess(); return result; } catch (error) { this.recordFailure(error); if (fallback) return fallback(); throw error; } };
export function CircuitBreaker(this: any, threshold: number, timeout: number) {
  this._threshold = threshold || 5;
  this._timeout = timeout || 30000;
  this._failures = 0;
  this._lastFailure = null;
  this._state = 'CLOSED';
  this._totalRequests = 0;
  this._successes = 0;
}

CircuitBreaker.prototype.check = function() {
  this._totalRequests++;
  if (this._state === 'OPEN') {
    const now = Date.now();
    if (this._lastFailure && (now - this._lastFailure) > this._timeout) {
      this._state = 'HALF_OPEN';
    } else {
      throw new Error('Circuit breaker is OPEN');
    }
  }
};

CircuitBreaker.prototype.recordSuccess = function() {
  this._failures = 0;
  this._successes++;
  this._state = 'CLOSED';
};

CircuitBreaker.prototype.recordFailure = function() {
  this._failures++;
  this._lastFailure = Date.now();
  if (this._failures >= this._threshold) {
    this._state = 'OPEN';
  }
};

CircuitBreaker.prototype.getState = function() { return this._state; };
CircuitBreaker.prototype.getFailures = function() { return this._failures; };
CircuitBreaker.prototype.reset = function() { this._failures = 0; this._state = 'CLOSED'; this._lastFailure = null; this._successes = 0; this._totalRequests = 0; };
CircuitBreaker.prototype.isOpen = function() { return this._state === 'OPEN'; };
CircuitBreaker.prototype.isClosed = function() { return this._state === 'CLOSED'; };

CircuitBreaker.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, state: this._state, failures: this._failures, threshold: this._threshold, timeout: this._timeout, totalRequests: this._totalRequests, successes: this._successes, timestamp: Date.now() };
};

CircuitBreaker.prototype.healthCheck = function() {
  const successRate = this._totalRequests > 0 ? ((this._successes / this._totalRequests) * 100).toFixed(1) : 100;
  const checks: Record<string, boolean> = { notOpen: this._state !== 'OPEN', belowThreshold: this._failures < this._threshold };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) { if (checks[keys[i]]) passed++; }
  return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, successRate: `${successRate}%`, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
};

CircuitBreaker.prototype.getMetrics = function() { return { failures: this._failures || 0, successes: this._successes || 0, totalRequests: this._totalRequests || 0 }; };

CircuitBreaker.prototype.destroy = function() { this.reset(); };


export function getVersion() { return VERSION; }
export default { CircuitBreaker, VERSION, MODULE_ID, getVersion };
