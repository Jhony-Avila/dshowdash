import { LISTENER_TRACKER_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.listener-tracker.leak-detector";
function createLeakDetector(options = {}) {
  const {
    panelRegistry,
    statsManager,
    emitter,
    getCount
  } = options;
  return {
    detect(inactivityThreshold = 6e4) {
      const now = Date.now();
      const leaks = [];
      panelRegistry.forEach((registry, panelId) => {
        const counts = getCount(panelId);
        const inactiveTime = now - registry.lastActivity;
        if (inactiveTime > inactivityThreshold && counts.total > 0) {
          leaks.push({
            panelId,
            counts,
            inactiveFor: inactiveTime,
            severity: counts.total > 20 ? "high" : counts.total > 10 ? "medium" : "low"
          });
          statsManager.incrementLeaksDetected();
        }
      });
      if (leaks.length > 0) {
        emitter?.emit(LISTENER_TRACKER_EVENT_NAMES.LEAKS_DETECTED, { leaks });
      }
      return leaks;
    }
  };
}
var leak_detector_default = { createLeakDetector };
export {
  MODULE_ID,
  VERSION,
  createLeakDetector,
  leak_detector_default as default
};
