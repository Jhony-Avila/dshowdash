import { ERROR_EVENTS } from "/core/runtime/events/catalog/error.events.js";
const VERSION = "8.0.0-UNIFIED";
const MODULE_ID = "main-error-supervisor";
const ERROR_LEVELS = Object.freeze({
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical",
  FATAL: "fatal"
});
const RECOVERY_STRATEGIES = Object.freeze({
  IGNORE: "ignore",
  RETRY: "retry",
  RELOAD_PANEL: "reload-panel",
  RELOAD_ENGINE: "reload-engine",
  NOTIFY_USER: "notify-user",
  ESCALATE: "escalate"
});
const MAX_ERRORS_PER_MINUTE = 20;
const ERROR_HISTORY_SIZE = 100;
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_RESET_MS = 3e4;
class ErrorSupervisor {
  constructor(context = {}) {
    this._telemetry = context.telemetry || context.ports?.telemetry || null;
    this._events = context.events || context.ports?.events || null;
    this._stateMachine = context.stateMachine || null;
    this._errorHistory = [];
    this._errorCounts = /* @__PURE__ */ new Map();
    this._lastMinuteErrors = [];
    this._circuitBreakers = /* @__PURE__ */ new Map();
    this._recoveryHandlers = /* @__PURE__ */ new Map();
    this._alertHandlers = [];
    this._metrics = {
      errorsReceived: 0,
      errorsByLevel: { info: 0, warning: 0, error: 0, critical: 0, fatal: 0 },
      recoveriesAttempted: 0,
      recoveriesSucceeded: 0,
      recoveriesFailed: 0,
      circuitBreakerTrips: 0,
      alertsSent: 0,
      suppressedErrors: 0
    };
  }
  capture(error, context = {}) {
    const errorRecord = this._createErrorRecord(error, context);
    if (this._isRateLimited()) {
      this._metrics.suppressedErrors++;
      return { handled: false, reason: "rate-limited" };
    }
    const component = context.component || context.source || "unknown";
    if (this._isCircuitOpen(component)) {
      this._metrics.suppressedErrors++;
      return { handled: false, reason: "circuit-open", component };
    }
    this._addToHistory(errorRecord);
    this._incrementErrorCount(component);
    this._metrics.errorsReceived++;
    this._metrics.errorsByLevel[errorRecord.level]++;
    this._telemetry?.error?.(error, { ...context, errorId: errorRecord.id, level: errorRecord.level });
    this._emit(ERROR_EVENTS.CAPTURED, errorRecord);
    this._checkCircuitBreaker(component);
    const strategy = this._determineRecoveryStrategy(errorRecord);
    const recoveryResult = this._executeRecovery(errorRecord, strategy);
    if (errorRecord.level === ERROR_LEVELS.CRITICAL || errorRecord.level === ERROR_LEVELS.FATAL) {
      this._sendAlerts(errorRecord);
    }
    return { handled: true, errorId: errorRecord.id, strategy, recoveryResult };
  }
  _createErrorRecord(error, context) {
    const level = context.level || this._inferErrorLevel(error, context);
    return {
      id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      message: error?.message || String(error),
      stack: error?.stack?.substring(0, 1e3),
      code: error?.code || context.code,
      component: context.component || context.source || "unknown",
      phase: context.phase,
      panelId: context.panelId,
      containerId: context.containerId,
      context: { ...context },
      fingerprint: this._generateFingerprint(error, context)
    };
  }
  _inferErrorLevel(error, context) {
    if (error?.fatal || context.fatal) return ERROR_LEVELS.FATAL;
    if (error?.code === "INIT_FAILED" || context.phase === "init") return ERROR_LEVELS.CRITICAL;
    if (context.phase === "mount" || context.phase === "navigation") return ERROR_LEVELS.ERROR;
    if (error?.name === "NetworkError" || error?.name === "TimeoutError") return ERROR_LEVELS.WARNING;
    return ERROR_LEVELS.ERROR;
  }
  _generateFingerprint(error, context) {
    const parts = [error?.name || "Error", error?.message?.substring(0, 50), context.component, context.phase].filter(Boolean);
    return parts.join(":");
  }
  _addToHistory(errorRecord) {
    this._errorHistory.push(errorRecord);
    if (this._errorHistory.length > ERROR_HISTORY_SIZE) this._errorHistory.shift();
    const now = Date.now();
    this._lastMinuteErrors.push(now);
    this._lastMinuteErrors = this._lastMinuteErrors.filter((t) => now - t < 6e4);
  }
  _incrementErrorCount(component) {
    const count = this._errorCounts.get(component) || 0;
    this._errorCounts.set(component, count + 1);
  }
  _isRateLimited() {
    return this._lastMinuteErrors.length >= MAX_ERRORS_PER_MINUTE;
  }
  _isCircuitOpen(component) {
    const breaker = this._circuitBreakers.get(component);
    if (!breaker) return false;
    if (breaker.state === "open") {
      if (Date.now() - breaker.openedAt > CIRCUIT_BREAKER_RESET_MS) {
        breaker.state = "half-open";
        return false;
      }
      return true;
    }
    return false;
  }
  _checkCircuitBreaker(component) {
    const count = this._errorCounts.get(component) || 0;
    if (count >= CIRCUIT_BREAKER_THRESHOLD) {
      let breaker = this._circuitBreakers.get(component);
      if (!breaker || breaker.state !== "open") {
        breaker = { state: "open", openedAt: Date.now(), tripCount: (breaker?.tripCount || 0) + 1 };
        this._circuitBreakers.set(component, breaker);
        this._metrics.circuitBreakerTrips++;
        this._emit(ERROR_EVENTS.CIRCUIT_BREAKER_TRIPPED, { component, tripCount: breaker.tripCount });
        this._telemetry?.track?.("error-supervisor:circuit-tripped", { component });
      }
    }
  }
  _determineRecoveryStrategy(errorRecord) {
    const customHandler = this._recoveryHandlers.get(errorRecord.component);
    if (customHandler) {
      const strategy = customHandler(errorRecord);
      if (strategy) return strategy;
    }
    switch (errorRecord.level) {
      case ERROR_LEVELS.INFO:
      case ERROR_LEVELS.WARNING:
        return RECOVERY_STRATEGIES.IGNORE;
      case ERROR_LEVELS.ERROR:
        if (errorRecord.phase === "mount" || errorRecord.phase === "load") return RECOVERY_STRATEGIES.RETRY;
        return RECOVERY_STRATEGIES.NOTIFY_USER;
      case ERROR_LEVELS.CRITICAL:
        return RECOVERY_STRATEGIES.RELOAD_PANEL;
      case ERROR_LEVELS.FATAL:
        return RECOVERY_STRATEGIES.ESCALATE;
      default:
        return RECOVERY_STRATEGIES.NOTIFY_USER;
    }
  }
  _executeRecovery(errorRecord, strategy) {
    this._metrics.recoveriesAttempted++;
    try {
      switch (strategy) {
        case RECOVERY_STRATEGIES.IGNORE:
          return { success: true, action: "ignored" };
        case RECOVERY_STRATEGIES.RETRY:
          this._emit(ERROR_EVENTS.RETRY_REQUESTED, { errorRecord });
          return { success: true, action: "retry-requested" };
        case RECOVERY_STRATEGIES.RELOAD_PANEL:
          this._emit(ERROR_EVENTS.RELOAD_PANEL_REQUESTED, { panelId: errorRecord.panelId });
          return { success: true, action: "reload-panel-requested" };
        case RECOVERY_STRATEGIES.RELOAD_ENGINE:
          this._emit(ERROR_EVENTS.RELOAD_ENGINE_REQUESTED, {});
          return { success: true, action: "reload-engine-requested" };
        case RECOVERY_STRATEGIES.NOTIFY_USER:
          this._emit(ERROR_EVENTS.USER_NOTIFICATION, { message: errorRecord.message, level: errorRecord.level });
          return { success: true, action: "user-notified" };
        case RECOVERY_STRATEGIES.ESCALATE:
          this._emit(ERROR_EVENTS.ESCALATED, { errorRecord });
          if (this._stateMachine) this._stateMachine.transition?.("error", { error: errorRecord });
          return { success: true, action: "escalated" };
        default:
          return { success: false, action: "unknown-strategy" };
      }
    } catch (e) {
      this._metrics.recoveriesFailed++;
      return { success: false, action: "recovery-failed", error: e.message };
    }
  }
  _sendAlerts(errorRecord) {
    this._metrics.alertsSent++;
    this._alertHandlers.forEach((handler) => {
      try {
        handler(errorRecord);
      } catch (e) {
      }
    });
  }
  registerRecoveryHandler(component, handler) {
    this._recoveryHandlers.set(component, handler);
    return () => this._recoveryHandlers.delete(component);
  }
  onAlert(handler) {
    this._alertHandlers.push(handler);
    return () => {
      const idx = this._alertHandlers.indexOf(handler);
      if (idx > -1) this._alertHandlers.splice(idx, 1);
    };
  }
  resetCircuitBreaker(component = null) {
    if (component) {
      this._circuitBreakers.delete(component);
      this._errorCounts.delete(component);
    } else {
      this._circuitBreakers.clear();
      this._errorCounts.clear();
    }
  }
  getRecentErrors(limit = 20, filter = {}) {
    let errors = this._errorHistory.slice(-limit);
    if (filter.level) errors = errors.filter((e) => e.level === filter.level);
    if (filter.component) errors = errors.filter((e) => e.component === filter.component);
    return errors;
  }
  getCircuitBreakerStatus() {
    const status = {};
    this._circuitBreakers.forEach((breaker, component) => {
      status[component] = { ...breaker };
    });
    return status;
  }
  getErrorRates() {
    const rates = {};
    this._errorCounts.forEach((count, component) => {
      rates[component] = count;
    });
    return rates;
  }
  _emit(event, data = {}) {
    this._events?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
  }
  getMetrics() {
    const recoverySuccessRate = this._metrics.recoveriesAttempted > 0 ? Math.round(this._metrics.recoveriesSucceeded / this._metrics.recoveriesAttempted * 100) : 0;
    return { ...this._metrics, recoverySuccessRate: `${recoverySuccessRate}%`, errorsPerMinute: this._lastMinuteErrors.length, circuitBreakersOpen: Array.from(this._circuitBreakers.values()).filter((b) => b.state === "open").length, historySize: this._errorHistory.length };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, errorsPerMinute: this._lastMinuteErrors.length, circuitBreakers: this.getCircuitBreakerStatus(), errorRates: this.getErrorRates(), metrics: this.getMetrics() };
  }
  healthCheck() {
    const errorsPerMinute = this._lastMinuteErrors.length;
    const openCircuits = Array.from(this._circuitBreakers.values()).filter((b) => b.state === "open").length;
    const recentCritical = this._errorHistory.filter((e) => e.level === ERROR_LEVELS.CRITICAL || e.level === ERROR_LEVELS.FATAL).filter((e) => Date.now() - e.timestamp < 6e4).length;
    let status = "HEALTHY";
    if (recentCritical > 0 || openCircuits > 2) status = "DEGRADED";
    if (errorsPerMinute >= MAX_ERRORS_PER_MINUTE || recentCritical > 3) status = "UNHEALTHY";
    return { status, version: VERSION, moduleId: MODULE_ID, checks: { errorsPerMinute, maxErrorsPerMinute: MAX_ERRORS_PER_MINUTE, openCircuits, recentCriticalErrors: recentCritical, isRateLimited: this._isRateLimited() }, metrics: this.getMetrics() };
  }
  destroy() {
    this._errorHistory = [];
    this._errorCounts.clear();
    this._circuitBreakers.clear();
    this._recoveryHandlers.clear();
    this._alertHandlers = [];
    this._lastMinuteErrors = [];
  }
}
function createErrorSupervisor(context) {
  return new ErrorSupervisor(context);
}
var error_supervisor_default = { ErrorSupervisor, createErrorSupervisor, ERROR_LEVELS, RECOVERY_STRATEGIES, VERSION, MODULE_ID };
export {
  ErrorSupervisor,
  MODULE_ID,
  VERSION,
  createErrorSupervisor,
  error_supervisor_default as default
};
