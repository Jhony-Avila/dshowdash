// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-EVENT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: limit-checker
// PURPOSE: Listener Limit Checker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LISTENER_TYPES, DEFAULT_LIMITS from ./constants.js
//   LISTENER_TRACKER_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   createLimitChecker() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   LISTENER_TRACKER_EVENT_NAMES.LIMIT_EXCEEDED
//   LISTENER_TRACKER_EVENT_NAMES.WARNING
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { LISTENER_TYPES, DEFAULT_LIMITS } from './constants.js';
import { LISTENER_TRACKER_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.listener-tracker.limit-checker';

export function createLimitChecker(options: Record<string, any> = {}) {
  const { 
    panelRegistry,
    emitter,
    onWarning,
    onLimitExceeded
  } = options;

  const _limits = { ...DEFAULT_LIMITS, ...(options.limits || {}) };
  let _warningsEmitted = 0;

  return {
    check(panelId: string, type: string) {
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

    setLimits(newLimits: unknown) {
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

export default { createLimitChecker };
