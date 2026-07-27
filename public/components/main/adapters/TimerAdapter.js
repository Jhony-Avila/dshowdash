const VERSION = "1.0.0-P1-HEX";
const MODULE_ID = "main-timer-adapter";
const _metrics = {
  timeoutsCreated: 0,
  timeoutsCleared: 0,
  intervalsCreated: 0,
  intervalsCleared: 0,
  delaysExecuted: 0
};
const _activeTimeouts = /* @__PURE__ */ new Set();
const _activeIntervals = /* @__PURE__ */ new Set();
function createTimerAdapter() {
  return {
    setTimeout: (fn, ms, ...args) => {
      _metrics.timeoutsCreated++;
      const id = setTimeout(() => {
        _activeTimeouts.delete(id);
        fn(...args);
      }, ms);
      _activeTimeouts.add(id);
      return id;
    },
    clearTimeout: (id) => {
      if (id !== null && id !== void 0) {
        _metrics.timeoutsCleared++;
        _activeTimeouts.delete(id);
        clearTimeout(id);
      }
    },
    setInterval: (fn, ms, ...args) => {
      _metrics.intervalsCreated++;
      const id = setInterval(fn, ms, ...args);
      _activeIntervals.add(id);
      return id;
    },
    clearInterval: (id) => {
      if (id !== null && id !== void 0) {
        _metrics.intervalsCleared++;
        _activeIntervals.delete(id);
        clearInterval(id);
      }
    },
    delay: (ms) => {
      _metrics.delaysExecuted++;
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
    // Cleanup de todos os timers (útil para destroy)
    clearAll: () => {
      _activeTimeouts.forEach((id) => clearTimeout(id));
      _activeIntervals.forEach((id) => clearInterval(id));
      const cleared = { timeouts: _activeTimeouts.size, intervals: _activeIntervals.size };
      _activeTimeouts.clear();
      _activeIntervals.clear();
      return cleared;
    },
    // Diagnósticos
    getActiveCount: () => ({
      timeouts: _activeTimeouts.size,
      intervals: _activeIntervals.size
    }),
    getMetrics: () => ({ ..._metrics }),
    healthCheck: () => ({
      status: "HEALTHY",
      version: VERSION,
      moduleId: MODULE_ID,
      checks: {
        activeTimeouts: _activeTimeouts.size,
        activeIntervals: _activeIntervals.size
      },
      metrics: { ..._metrics }
    }),
    info: () => ({
      version: VERSION,
      moduleId: MODULE_ID,
      type: "real",
      active: {
        timeouts: _activeTimeouts.size,
        intervals: _activeIntervals.size
      },
      metrics: { ..._metrics }
    })
  };
}
let _instance = null;
function getTimerAdapter() {
  if (!_instance) {
    _instance = createTimerAdapter();
  }
  return _instance;
}
function resetTimerAdapter() {
  if (_instance) {
    _instance.clearAll();
  }
  _instance = null;
}
var TimerAdapter_default = {
  createTimerAdapter,
  getTimerAdapter,
  resetTimerAdapter,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  createTimerAdapter,
  TimerAdapter_default as default,
  getTimerAdapter,
  resetTimerAdapter
};
