const VERSION = "3.0.0-AAA-P0-FIX";
const MODULE_ID = "action-telemetry";
let _history = [];
let _maxHistory = 500;
let _metrics = { tracked: 0, errors: 0, starts: 0, successes: 0, failures: 0 };
function track(action) {
  try {
    _history.push({ ...action, trackedAt: Date.now() });
    if (_history.length > _maxHistory) _history.shift();
    _metrics.tracked++;
  } catch (error) {
    _metrics.errors++;
  }
}
function getHistory(filter = {}) {
  let result = [..._history];
  if (filter.type) result = result.filter((a) => a.type === filter.type);
  if (filter.limit) result = result.slice(-filter.limit);
  return result;
}
function clearHistory() {
  _history = [];
}
function getMetrics() {
  return { ..._metrics, historySize: _history.length };
}
function healthCheck() {
  const isFull = _history.length >= _maxHistory * 0.9;
  return { status: isFull ? "DEGRADED" : "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { historySize: _history.length, maxHistory: _maxHistory, isFull }, metrics: getMetrics() };
}
class ActionTelemetry {
  constructor(context = {}) {
    this._context = context;
    this._ports = context.ports || {};
    this._localHistory = [];
    this._localMetrics = { tracked: 0, errors: 0, starts: 0, successes: 0, failures: 0 };
  }
  track(action) {
    track(action);
    this._localHistory.push({ ...action, trackedAt: Date.now() });
    this._localMetrics.tracked++;
    if (this._localHistory.length > _maxHistory) this._localHistory.shift();
  }
  // FIX P0: Métodos exigidos pelo ActionExecutor
  emitStart(action) {
    this._localMetrics.starts++;
    _metrics.starts++;
    const event = {
      phase: "start",
      actionId: action?.actionId,
      type: action?.type,
      timestamp: Date.now()
    };
    this.track({ ...action, ...event });
    this._ports?.telemetry?.track?.("action:start", event);
  }
  emitSuccess(action, result = {}) {
    this._localMetrics.successes++;
    _metrics.successes++;
    const event = {
      phase: "success",
      actionId: action?.actionId,
      type: action?.type,
      result,
      timestamp: Date.now()
    };
    this.track({ ...action, ...event });
    this._ports?.telemetry?.track?.("action:success", event);
  }
  emitError(action, error) {
    this._localMetrics.failures++;
    _metrics.failures++;
    const event = {
      phase: "error",
      actionId: action?.actionId,
      type: action?.type,
      error: typeof error === "string" ? error : error?.message || "Unknown error",
      timestamp: Date.now()
    };
    this.track({ ...action, ...event });
    this._ports?.telemetry?.track?.("action:error", event);
  }
  emitEnd(action, result = {}) {
    const event = {
      phase: "end",
      actionId: action?.actionId,
      type: action?.type,
      result,
      timestamp: Date.now()
    };
    this.track({ ...action, ...event });
    this._ports?.telemetry?.track?.("action:end", event);
  }
  getHistory(filter = {}) {
    return getHistory(filter);
  }
  getLocalHistory(limit = 100) {
    return this._localHistory.slice(-limit);
  }
  clearHistory() {
    this._localHistory = [];
    clearHistory();
  }
  getMetrics() {
    return { global: getMetrics(), local: { ...this._localMetrics, historySize: this._localHistory.length } };
  }
  healthCheck() {
    return { ...healthCheck(), localHistorySize: this._localHistory.length };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, localHistorySize: this._localHistory.length, metrics: this.getMetrics() };
  }
  destroy() {
    this._localHistory = [];
    this._localMetrics = { tracked: 0, errors: 0, starts: 0, successes: 0, failures: 0 };
  }
}
function createActionTelemetry(context = {}) {
  return new ActionTelemetry(context);
}
var action_telemetry_default = { track, getHistory, clearHistory, getMetrics, healthCheck, ActionTelemetry, createActionTelemetry, VERSION, MODULE_ID };
export {
  ActionTelemetry,
  MODULE_ID,
  VERSION,
  clearHistory,
  createActionTelemetry,
  action_telemetry_default as default,
  getHistory,
  getMetrics,
  healthCheck,
  track
};
