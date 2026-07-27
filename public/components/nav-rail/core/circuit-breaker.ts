// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.0.0-P1-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail-core-circuit-breaker
// PURPOSE: nav-rail/core/circuit-breaker.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   setLogger() — exported function
//   CircuitBreaker — exported value
//
// RECEIVES (via init/options): (see init function if present)
//
// EMITS (eventos):
//   (none)
//
// LISTENS (eventos):
//   (none)
//
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════

'use strict';

export const VERSION = '5.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'nav-rail.core.circuit-breaker';


let _log: (level: string, msg: string, data?: unknown) => void = () => {};

export function setLogger(logFn: (level: string, msg: string, data?: unknown) => void) {
    _log = logFn;
}

export const CircuitBreaker = {
    _failures: {} as Record<string, { failures: number; lastFailure: number; errors: { message: string; time: number }[] }>,
    _thresholds: { maxFailures: 3, resetTimeout: 30000 },

    isOpen(service: string) {
        const state = this._failures[service];
        if (!state) return false;
        if (state.failures >= this._thresholds.maxFailures) {
            if (Date.now() - state.lastFailure > this._thresholds.resetTimeout) {
                this.reset(service);
                return false;
            }
            return true;
        }
        return false;
    },

    recordFailure(service: string, error: unknown) {
        if (!this._failures[service]) {
            this._failures[service] = { failures: 0, lastFailure: 0, errors: [] };
        }
        this._failures[service].failures++;
        this._failures[service].lastFailure = Date.now();
        this._failures[service].errors.push({ message: (error as Error)?.message || String(error), time: Date.now() });
        if (this._failures[service].errors.length > 5) this._failures[service].errors.shift();
        _log('warn', `Circuit breaker: ${service} failure #${this._failures[service].failures}`, { error: (error as Error)?.message });
    },

    recordSuccess(service: string) {
        if (this._failures[service]) {
            this._failures[service].failures = Math.max(0, this._failures[service].failures - 1);
        }
    },

    reset(service?: string) {
        if (service) {
            delete this._failures[service];
        } else {
            this._failures = {};
        }
    },

    async execute(service: string, fn: () => unknown, fallback?: () => unknown) {
        if (this.isOpen(service)) {
            if (fallback) return fallback();
            throw new Error('Circuit breaker is open for: ' + service);
        }
        try {
            const result = await fn();
            this.recordSuccess(service);
            return result;
        } catch (error) {
            this.recordFailure(service, error);
            if (fallback) return fallback();
            throw error;
        }
    },

    getMetrics() {
        let totalFailures = 0;
        let openCircuits = 0;
        for (const [service, state] of Object.entries(this._failures) as [string, { failures: number; lastFailure: number; errors: unknown[] }][]) {
            totalFailures += state.failures;
            if (this.isOpen(service)) openCircuits++;
        }
        return { trackedServices: Object.keys(this._failures).length, openCircuits, totalFailures };
    },

    healthCheck() {
        const metrics = this.getMetrics();
        return {
            status: metrics.openCircuits === 0 ? 'HEALTHY' : metrics.openCircuits < 3 ? 'DEGRADED' : 'UNHEALTHY',
            moduleId: 'navrail-core-circuit-breaker',
            checks: metrics,
            timestamp: Date.now()
        };
    },

    info() {
        return { moduleId: 'navrail-core-circuit-breaker', metrics: this.getMetrics(), status: this.getStatus() };
    },

    getStatus() {
        const status: Record<string, unknown> = {};
        for (const [service, state] of Object.entries(this._failures) as [string, { failures: number; lastFailure: number; errors: unknown[] }][]) {
            status[service] = {
                isOpen: this.isOpen(service),
                failures: state.failures,
                lastFailure: state.lastFailure,
                recentErrors: state.errors.slice(-3)
            };
        }
        return status;
    },
    destroy() { for (const k of Object.keys(this._failures)) this.reset(k); }
};

export default CircuitBreaker;
