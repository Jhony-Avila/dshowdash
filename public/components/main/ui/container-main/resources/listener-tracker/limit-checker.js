import { LISTENER_TYPES, DEFAULT_LIMITS } from "./constants.js";
import { LISTENER_TRACKER_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.listener-tracker.limit-checker";
function createLimitChecker(options = {}) {
  const {
    panelRegistry,
    emitter,
    onWarning,
    onLimitExceeded
  } = options;
  const _limits = { ...DEFAULT_LIMITS, ...options.limits || {} };
  let _warningsEmitted = 0;
  return {
    check(panelId, type) {
      const registry = panelRegistry.get(panelId);
      if (!registry) return true;
      let current = 0;
      let max = 0;
      switch (type) {
        case LISTENER_TYPES.TIMER:
          current = registry.timers.size;
          max = _limits.maxTimersPerPanel;
          break;
        case LISTENER_TYPES.INTERVAL:
          current = registry.intervals.size;
          max = _limits.maxIntervalsPerPanel;
          break;
        case LISTENER_TYPES.OBSERVER:
          current = registry.observers.size;
          max = _limits.maxObserversPerPanel;
          break;
        default:
          current = registry.listeners.size;
          max = _limits.maxListenersPerPanel;
      }
      const ratio = current / max;
      if (ratio >= 1) {
        onLimitExceeded?.(panelId, type, current, max);
        emitter?.emit(LISTENER_TRACKER_EVENT_NAMES.LIMIT_EXCEEDED, { panelId, type, current, max });
        return false;
      }
      if (ratio >= _limits.warnThreshold) {
        _warningsEmitted++;
        onWarning?.(panelId, type, current, max);
        emitter?.emit(LISTENER_TRACKER_EVENT_NAMES.WARNING, { panelId, type, current, max, ratio });
      }
      return true;
    },
    setLimits(newLimits) {
      Object.assign(_limits, newLimits);
    },
    getLimits() {
      return { ..._limits };
    },
    getWarningsCount() {
      return _warningsEmitted;
    },
    resetWarnings() {
      _warningsEmitted = 0;
    }
  };
}
var limit_checker_default = { createLimitChecker };
export {
  MODULE_ID,
  VERSION,
  createLimitChecker,
  limit_checker_default as default
};
