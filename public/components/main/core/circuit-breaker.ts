// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.1-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-circuit-breaker
// PURPOSE: Circuit Breaker - Proteção contra falhas recorrentes
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

import type { CircuitBreakerOptions } from '../types.js';

export const VERSION = '2.0.1-ENTERPRISE';
export const MODULE_ID = 'main-circuit-breaker';

const DEFAULT_THRESHOLD = 3;
const DEFAULT_RESET_TIMEOUT = 30000;

export function createCircuitBreaker(options?: CircuitBreakerOptions) {
  options = options || {};
  interface FailureRecord { count: number; firstFailure: number; lastFailure: number; }
  let _failures: Record<string, FailureRecord> = {};
  const _threshold = options.threshold || DEFAULT_THRESHOLD;
  const _resetTimeout = options.resetTimeout || DEFAULT_RESET_TIMEOUT;
  let _totalRecordedFailures = 0;
  let _totalResets = 0;
  
  const breaker = {
    recordFailure(panelId: string) {
      const now = Date.now();
      const record = _failures[panelId] || { count: 0, firstFailure: now, lastFailure: now };
      record.count++;
      record.lastFailure = now;
      _failures[panelId] = record;
      _totalRecordedFailures++;
      return record.count >= _threshold;
    },
    
    isOpen(panelId: string) {
      const record = _failures[panelId];
      if (!record) return false;
      if (record.count < _threshold) return false;
      if (Date.now() - record.lastFailure > _resetTimeout) {
        this.reset(panelId);
        return false;
      }
      return true;
    },
    
    reset(panelId: string) {
      if (_failures[panelId]) {
        delete _failures[panelId];
        _totalResets++;
      }
    },
    
    resetAll() {
      const count = Object.keys(_failures).length;

      _failures = {};
      _totalResets += count;
    },
    
    getStatus() {
      const self = this;
      const status: Record<string, any> = {};
      const keys = Object.keys(_failures);
      for (let i = 0; i < keys.length; i++) {
        const panelId = keys[i];
        const record = _failures[panelId];
        status[panelId] = {
          failures: record.count,
          isOpen: self.isOpen(panelId),
          lastFailure: record.lastFailure,
          willResetAt: record.lastFailure + _resetTimeout
        };
      }
      return status;
    },
    
    getOpenCount() {
      const self = this;
      let count = 0;
      const keys = Object.keys(_failures);
      for (let i = 0; i < keys.length; i++) {
        if (self.isOpen(keys[i])) count++;
      }
      return count;
    },
    
    getTotalFailures() {
      let total = 0;
      const keys = Object.keys(_failures);
      for (let i = 0; i < keys.length; i++) {
        total += _failures[keys[i]].count;
      }
      return total;
    },
    
    getMetrics() {
      return {
        trackedPanels: Object.keys(_failures).length,
        openCircuits: this.getOpenCount(),
        currentFailures: this.getTotalFailures(),
        totalRecordedFailures: _totalRecordedFailures,
        totalResets: _totalResets,
        threshold: _threshold,
        resetTimeout: _resetTimeout
      };
    },
    
    info() {
      return {
        version: VERSION,
        moduleId: MODULE_ID,
        threshold: _threshold,
        resetTimeout: _resetTimeout,
        openCount: this.getOpenCount(),
        totalFailures: this.getTotalFailures(),
        metrics: this.getMetrics()
      };
    },
    
    async execute<T>(panelId: string, fn: () => Promise<T>, fallback?: () => T) {
      if (this.isOpen(panelId)) {
        if (fallback) return fallback();
        throw new Error('Circuit breaker is open for: ' + panelId);
      }
      try {
        const result = await fn();
        return result;
      } catch (error) {
        this.recordFailure(panelId);
        if (fallback) return fallback();
        throw error;
      }
    },

    healthCheck() {
      const openCount = this.getOpenCount();
      let status = 'HEALTHY';
      if (openCount > 0) status = 'DEGRADED';
      if (openCount >= 3) status = 'UNHEALTHY';

      return {
        status,
        version: VERSION,
        moduleId: MODULE_ID,
        checks: {
          openCircuits: openCount,
          trackedPanels: Object.keys(_failures).length,
          totalFailures: this.getTotalFailures()
        },
        metrics: this.getMetrics()
      };
    }
  };

  return breaker;
}


function destroy() { }
export default { createCircuitBreaker, VERSION, MODULE_ID };
