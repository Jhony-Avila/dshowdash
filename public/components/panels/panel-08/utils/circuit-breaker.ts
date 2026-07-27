// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-08-utils-circuit-breaker
// PURPOSE: Panel-08 - Circuit Breaker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   CircuitBreaker() — exported function
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

export const MODULE_ID = 'panels-panel-08-utils-circuit-breaker';
export const VERSION = '9.3.0-P2-ENTERPRISE';

CircuitBreaker.prototype.execute = async function(fn: () => Promise<unknown>, fallback?: () => unknown) { try { this.check(); } catch (e) { if (fallback) return fallback(); throw e; } try { var result = await fn(); this.recordSuccess(); return result; } catch (error) { this.recordFailure(error); if (fallback) return fallback(); throw error; } };
export function CircuitBreaker(this: any, threshold: number, timeout: number, logger: Record<string, (...args: unknown[]) => void>) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.logger = logger;
    this.failures = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
}

CircuitBreaker.prototype.check = function() {
    if (this.state === 'OPEN') {
        const now = Date.now();
        if (now - this.lastFailureTime > this.timeout) {
            this.state = 'HALF_OPEN';
            this.failures = 0;
            this.logger.debug('circuit.half-open');
        } else {
            throw new Error('CIRCUIT_BREAKER_OPEN');
        }
    }
};

CircuitBreaker.prototype.recordSuccess = function() {
    if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
        this.logger.debug('circuit.closed');
    }
};

CircuitBreaker.prototype.recordFailure = function() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold && this.state !== 'OPEN') {
        this.state = 'OPEN';
        this.logger.warn('circuit.open', { failures: this.failures });
    }
};

CircuitBreaker.prototype.getState = function() { return this.state; };

CircuitBreaker.prototype.getMetrics = function() { return { failures: this.failures || 0, successes: this.successes || 0, totalRequests: this.totalRequests || 0 }; };

CircuitBreaker.prototype.reset = function() { this.failures = 0; this.state = 'CLOSED'; this.lastFailureTime = null; };
CircuitBreaker.prototype.destroy = function() { this.reset(); };

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { circuitBreakerReady: true } }; }

export default CircuitBreaker;
