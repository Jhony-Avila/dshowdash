const VERSION = "2.0.1-ENTERPRISE";
const MODULE_ID = "main-circuit-breaker";
const DEFAULT_THRESHOLD = 3;
const DEFAULT_RESET_TIMEOUT = 3e4;
function createCircuitBreaker(options) {
  options = options || {};
  let _failures = {};
  const _threshold = options.threshold || DEFAULT_THRESHOLD;
  const _resetTimeout = options.resetTimeout || DEFAULT_RESET_TIMEOUT;
  let _totalRecordedFailures = 0;
  let _totalResets = 0;
  const breaker = {
    recordFailure(panelId) {
      const now = Date.now();
      const record = _failures[panelId] || { count: 0, firstFailure: now, lastFailure: now };
      record.count++;
      record.lastFailure = now;
      _failures[panelId] = record;
      _totalRecordedFailures++;
      return record.count >= _threshold;
    },
    isOpen(panelId) {
      const record = _failures[panelId];
      if (!record) return false;
      if (record.count < _threshold) return false;
      if (Date.now() - record.lastFailure > _resetTimeout) {
        this.reset(panelId);
        return false;
      }
      return true;
    },
    reset(panelId) {
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
      const status = {};
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
    async execute(panelId, fn, fallback) {
      if (this.isOpen(panelId)) {
        if (fallback) return fallback();
        throw new Error("Circuit breaker is open for: " + panelId);
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
      let status = "HEALTHY";
      if (openCount > 0) status = "DEGRADED";
      if (openCount >= 3) status = "UNHEALTHY";
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
function destroy() {
}
var circuit_breaker_default = { createCircuitBreaker, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createCircuitBreaker,
  circuit_breaker_default as default
};
