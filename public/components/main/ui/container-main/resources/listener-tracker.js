import {
  VERSION,
  MODULE_ID,
  LISTENER_TYPES,
  createPanelRegistry,
  createLimitChecker,
  createDOMTracker,
  createTimerTracker,
  createObserverTracker,
  createCleanupManager,
  createStatsManager,
  createLeakDetector,
  createQueryMethods
} from "./listener-tracker/index.js";
import { LISTENER_TRACKER_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
function createListenerTracker(options = {}) {
  const {
    eventBus,
    limits: limitsOpt = {},
    onWarning,
    onLimitExceeded,
    onCleanup
  } = options;
  let _destroyed = false;
  const emitter = {
    emit(event, data) {
      if (eventBus?.emit) {
        eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
      }
    }
  };
  function generateId() {
    return `lst-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  const panelRegistry = createPanelRegistry();
  const statsManager = createStatsManager();
  const limitChecker = createLimitChecker({
    panelRegistry,
    emitter,
    limits: limitsOpt,
    onWarning,
    onLimitExceeded
  });
  const queryMethods = createQueryMethods({ panelRegistry });
  const cleanupManager = createCleanupManager({
    panelRegistry,
    statsManager,
    emitter,
    onCleanup
  });
  const domTracker = createDOMTracker({
    panelRegistry,
    limitChecker,
    statsManager,
    generateId,
    createRemover: cleanupManager.createRemover.bind(cleanupManager)
  });
  const timerTracker = createTimerTracker({
    panelRegistry,
    limitChecker,
    statsManager,
    generateId,
    createRemover: cleanupManager.createRemover.bind(cleanupManager)
  });
  const observerTracker = createObserverTracker({
    panelRegistry,
    limitChecker,
    statsManager,
    generateId,
    createRemover: cleanupManager.createRemover.bind(cleanupManager),
    eventBus
  });
  const leakDetector = createLeakDetector({
    panelRegistry,
    statsManager,
    emitter,
    getCount: queryMethods.getCount.bind(queryMethods)
  });
  const tracker = {
    registerPanel(panelId) {
      if (_destroyed) return false;
      panelRegistry.getOrCreate(panelId);
      emitter.emit(LISTENER_TRACKER_EVENT_NAMES.PANEL_REGISTERED, { panelId });
      return true;
    },
    unregisterPanel(panelId) {
      const count = cleanupManager.cleanupPanel(panelId);
      panelRegistry.delete(panelId);
      emitter.emit(LISTENER_TRACKER_EVENT_NAMES.PANEL_UNREGISTERED, { panelId, cleanedUp: count });
      return count;
    },
    trackDOMListener(panelId, element, eventType, handler, opts) {
      if (_destroyed) return null;
      return domTracker.track(panelId, element, eventType, handler, opts);
    },
    trackWindowListener(panelId, eventType, handler, opts) {
      if (_destroyed) return null;
      return domTracker.trackWindow(panelId, eventType, handler, opts);
    },
    trackDocumentListener(panelId, eventType, handler, opts) {
      if (_destroyed) return null;
      return domTracker.trackDocument(panelId, eventType, handler, opts);
    },
    trackTimeout(panelId, callback, delay) {
      if (_destroyed) return null;
      return timerTracker.trackTimeout(panelId, callback, delay);
    },
    trackInterval(panelId, callback, delay) {
      if (_destroyed) return null;
      return timerTracker.trackInterval(panelId, callback, delay);
    },
    trackRAF(panelId, callback) {
      if (_destroyed) return null;
      return timerTracker.trackRAF(panelId, callback);
    },
    trackEventBusListener(panelId, eventName, handler, bus) {
      if (_destroyed) return null;
      return observerTracker.trackEventBus(panelId, eventName, handler, bus);
    },
    trackObserver(panelId, observer, target, opts) {
      if (_destroyed) return null;
      return observerTracker.trackObserver(panelId, observer, target, opts);
    },
    trackCustom(panelId, description, cleanupFn) {
      if (_destroyed) return null;
      return observerTracker.trackCustom(panelId, description, cleanupFn);
    },
    cleanupPanel: (panelId) => cleanupManager.cleanupPanel(panelId),
    getCount: (panelId) => queryMethods.getCount(panelId),
    getDetails: (panelId) => queryMethods.getDetails(panelId),
    listPanels: () => queryMethods.listPanels(),
    detectLeaks: (threshold) => leakDetector.detect(threshold),
    getStats() {
      const baseStats = statsManager.getStats();
      return {
        ...baseStats,
        totalActive: queryMethods.getTotalActive(),
        panelsTracked: panelRegistry.size(),
        limits: limitChecker.getLimits()
      };
    },
    setLimits(newLimits) {
      limitChecker.setLimits(newLimits);
      emitter.emit(LISTENER_TRACKER_EVENT_NAMES.LIMITS_UPDATED, { limits: limitChecker.getLimits() });
    },
    healthCheck() {
      const stats = this.getStats();
      const leaks = this.detectLeaks();
      return {
        status: _destroyed ? "DESTROYED" : leaks.length > 0 ? "WARNING" : "HEALTHY",
        version: VERSION,
        moduleId: MODULE_ID,
        stats,
        leaksDetected: leaks.length,
        panelsTracked: panelRegistry.size(),
        modular: true
      };
    },
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        panelsTracked: panelRegistry.size(),
        limits: limitChecker.getLimits(),
        listenerTypes: Object.keys(LISTENER_TYPES),
        modular: true
      };
    },
    destroy() {
      _destroyed = true;
      panelRegistry.forEach((_, panelId) => {
        cleanupManager.cleanupPanel(panelId);
      });
      panelRegistry.clear();
      emitter.emit(LISTENER_TRACKER_EVENT_NAMES.DESTROYED, { stats: statsManager.getStats() });
    }
  };
  return tracker;
}
let _globalTracker = null;
function getListenerTracker(options) {
  if (!_globalTracker) {
    _globalTracker = createListenerTracker(options);
  }
  return _globalTracker;
}
function resetGlobalTracker() {
  if (_globalTracker) {
    _globalTracker.destroy();
    _globalTracker = null;
  }
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ["createListenerTracker", "getListenerTracker"],
    listenerTypes: Object.keys(LISTENER_TYPES),
    modular: true
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    hasGlobalTracker: !!_globalTracker,
    modular: true
  };
}
var listener_tracker_default = {
  VERSION,
  MODULE_ID,
  LISTENER_TYPES,
  createListenerTracker,
  getListenerTracker,
  resetGlobalTracker,
  info,
  healthCheck
};
export {
  LISTENER_TYPES,
  MODULE_ID,
  VERSION,
  createListenerTracker,
  listener_tracker_default as default,
  getListenerTracker,
  healthCheck,
  info,
  resetGlobalTracker
};
