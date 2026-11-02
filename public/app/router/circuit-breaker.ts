// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.1-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: router-global:circuit-breaker
// PURPOSE: Router Global - Circuit Breaker & Retry
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   log from ./ports.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CircuitBreaker — exported value
//   RetryManager — exported value
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { log } from './ports.js';

export const VERSION = '1.0.1-ENTERPRISE';
export const MODULE_ID = 'router-global:circuit-breaker';

interface CircuitMetrics {
  circuitBreakerTrips: number;
  loopsDetected: number;
  retriesAttempted: number;
  retriesSucceeded: number;
  retriesFailed: number;
  [key: string]: number | string | null;
}

export const CircuitBreaker = {
  state: 'CLOSED',
  failures: 0,
  threshold: 5,
  resetTimeout: 30000,
  lastFailure: null as number | null,
  recentPaths: [] as Array<{ path: string; timestamp: number }>,
  maxRecentPaths: 10,
  loopThreshold: 3,
  loopTimeWindow: 2000,

  recordFailure(path: string, metrics: CircuitMetrics | null) {
    this.failures++;
    this.lastFailure = Date.now();
    if (metrics) metrics.circuitBreakerTrips++;
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      log('error', 'Circuit breaker OPEN - too many failures', { failures: this.failures });
      const self = this;
      setTimeout(() => { self.halfOpen(); }, this.resetTimeout);
    }
  },

  recordSuccess() {
    if (this.state === 'HALF_OPEN') { this.state = 'CLOSED'; this.failures = 0; log('info', 'Circuit breaker CLOSED - recovered'); }
  },

  halfOpen() {
    if (this.state === 'OPEN') { this.state = 'HALF_OPEN'; log('info', 'Circuit breaker HALF_OPEN - testing'); }
  },

  isOpen() { return this.state === 'OPEN'; },

  canNavigate(path: string, metrics: CircuitMetrics | null): boolean {
    if (this.isOpen()) { log('warn', 'Navigation blocked - circuit breaker OPEN'); return false; }
    if (this.detectLoop(path, metrics)) { log('warn', 'Navigation blocked - loop detected', { path }); return false; }
    return true;
  },

  detectLoop(path: string, metrics: CircuitMetrics | null): boolean {
    const now = Date.now();
    const self = this;
    this.recentPaths = this.recentPaths.filter((p: { path: string; timestamp: number }) => now - p.timestamp < self.loopTimeWindow);
    const samePathCount = this.recentPaths.filter((p: { path: string; timestamp: number }) => p.path === path).length;
    this.recentPaths.push({ path, timestamp: now });
    if (this.recentPaths.length > this.maxRecentPaths) this.recentPaths.shift();
    if (samePathCount >= this.loopThreshold) { if (metrics) metrics.loopsDetected++; return true; }
    return false;
  },

  reset() { this.state = 'CLOSED'; this.failures = 0; this.lastFailure = null; this.recentPaths = []; },

  getStatus() { return { state: this.state, failures: this.failures, threshold: this.threshold, lastFailure: this.lastFailure, recentPathsCount: this.recentPaths.length }; },

  destroy() { this.reset(); }
};

export const RetryManager = {
  maxRetries: 3,
  baseDelay: 300,
  maxDelay: 5000,

  withRetry(fn: () => Promise<unknown>, context: string, metrics: CircuitMetrics | null): Promise<{ success: boolean; result?: unknown; error?: unknown; attempts: number }> {
    if (!context) context = 'operation';
    const self = this;
    let lastError = null;
    let attempt = 1;
    
    function tryAttempt(): Promise<{ success: boolean; result?: unknown; error?: unknown; attempts: number }> {
      return Promise.resolve().then(() => fn()).then((result: unknown) => {
        if (attempt > 1) { log('info', `${context} succeeded on attempt ${attempt}`); if (metrics) metrics.retriesSucceeded++; }
        return { success: true, result, attempts: attempt };
      }).catch(error => {
        lastError = error;
        if (metrics) metrics.retriesAttempted++;
        if (attempt < self.maxRetries) {
          const delay = Math.min(self.baseDelay * Math.pow(2, attempt - 1), self.maxDelay);
          log('warn', `${context} failed, retry ${attempt}/${self.maxRetries} in ${delay}ms`, { error: error.message });
          attempt++;
          return new Promise(r => { setTimeout(r, delay); }).then(tryAttempt);
        }
        if (metrics) metrics.retriesFailed++;
        return { success: false, error: lastError, attempts: self.maxRetries };
      });
    }
    
    return tryAttempt();
  },

  getStatus() { return { maxRetries: this.maxRetries, baseDelay: this.baseDelay, maxDelay: this.maxDelay }; }
};

export function healthCheck() {
  return {
    status: CircuitBreaker.state === 'CLOSED' ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    checks: {
      circuitState: CircuitBreaker.state,
      failures: CircuitBreaker.failures,
      threshold: CircuitBreaker.threshold
    }
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    circuitBreaker: CircuitBreaker.getStatus(),
    retry: RetryManager.getStatus()
  };
}

export default { CircuitBreaker, RetryManager, healthCheck, info };
