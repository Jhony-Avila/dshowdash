// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-EVENT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: listener-tracker
// PURPOSE: Listener Tracker - Sistema de rastreamento de event listeners
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, LISTENER_TYPES, DEFAULT_LIMITS, createPanelRegistry, crea...
//   LISTENER_TRACKER_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   createListenerTracker() — exported function
//   getListenerTracker() — exported function
//   resetGlobalTracker() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   LISTENER_TYPES — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   LISTENER_TRACKER_EVENT_NAMES.DESTROYED
//   LISTENER_TRACKER_EVENT_NAMES.LIMITS_UPDATED
//   LISTENER_TRACKER_EVENT_NAMES.PANEL_REGISTERED
//   LISTENER_TRACKER_EVENT_NAMES.PANEL_UNREGISTERED
//   event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import {
  VERSION, MODULE_ID, LISTENER_TYPES, DEFAULT_LIMITS,
  createPanelRegistry,
  createLimitChecker,
  createDOMTracker,
  createTimerTracker,
  createObserverTracker,
  createCleanupManager,
  createStatsManager,
  createLeakDetector,
  createQueryMethods
} from './listener-tracker/index.js';
import { LISTENER_TRACKER_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export { VERSION, MODULE_ID, LISTENER_TYPES };

export function createListenerTracker(options: Record<string, unknown> = {}) {
  const {
    eventBus,
    limits: limitsOpt = {},
    onWarning,
    onLimitExceeded,
    onCleanup
  } = options as Record<string, any>;

  let _destroyed = false;

  const emitter = {
    emit(event: string, data: Record<string, unknown>) {
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
    registerPanel(panelId: string) {
      if (_destroyed) return false;
      panelRegistry.getOrCreate(panelId);
      emitter.emit(LISTENER_TRACKER_EVENT_NAMES.PANEL_REGISTERED, { panelId });
      return true;
    },

    unregisterPanel(panelId: string) {
      const count = cleanupManager.cleanupPanel(panelId);
      panelRegistry.delete(panelId);
      emitter.emit(LISTENER_TRACKER_EVENT_NAMES.PANEL_UNREGISTERED, { panelId, cleanedUp: count });
      return count;
    },

    trackDOMListener(panelId: string, element: HTMLElement, eventType: string, handler: (...args: unknown[]) => void, opts: Record<string, unknown>) {
      if (_destroyed) return null;
      return domTracker.track(panelId, element, eventType, handler, opts);
    },

    trackWindowListener(panelId: string, eventType: string, handler: (...args: unknown[]) => void, opts: Record<string, unknown>) {
      if (_destroyed) return null;
      return domTracker.trackWindow(panelId, eventType, handler, opts);
    },

    trackDocumentListener(panelId: string, eventType: string, handler: (...args: unknown[]) => void, opts: Record<string, unknown>) {
      if (_destroyed) return null;
      return domTracker.trackDocument(panelId, eventType, handler, opts);
    },

    trackTimeout(panelId: string, callback: (...args: unknown[]) => void, delay: number) {
      if (_destroyed) return null;
      return timerTracker.trackTimeout(panelId, callback, delay);
    },

    trackInterval(panelId: string, callback: (...args: unknown[]) => void, delay: number) {
      if (_destroyed) return null;
      return timerTracker.trackInterval(panelId, callback, delay);
    },

    trackRAF(panelId: string, callback: (...args: unknown[]) => void) {
      if (_destroyed) return null;
      return timerTracker.trackRAF(panelId, callback);
    },

    trackEventBusListener(panelId: string, eventName: string, handler: (...args: unknown[]) => void, bus: unknown) {
      if (_destroyed) return null;
      return observerTracker.trackEventBus(panelId, eventName, handler, bus);
    },

    trackObserver(panelId: string, observer: { observe: (t: HTMLElement, o?: Record<string, unknown>) => void; disconnect: () => void; constructor: { name: string } }, target: HTMLElement, opts: Record<string, unknown>) {
      if (_destroyed) return null;
      return observerTracker.trackObserver(panelId, observer, target, opts);
    },

    trackCustom(panelId: string, description: string, cleanupFn: (...args: unknown[]) => void) {
      if (_destroyed) return null;
      return observerTracker.trackCustom(panelId, description, cleanupFn);
    },

    cleanupPanel: (panelId: string) => cleanupManager.cleanupPanel(panelId),

    getCount: (panelId: string) => queryMethods.getCount(panelId),
    getDetails: (panelId: string) => queryMethods.getDetails(panelId),
    listPanels: () => queryMethods.listPanels(),

    detectLeaks: (threshold: number) => leakDetector.detect(threshold),

    getStats() {
      const baseStats = statsManager.getStats();
      return {
        ...baseStats,
        totalActive: queryMethods.getTotalActive(),
        panelsTracked: panelRegistry.size(),
        limits: limitChecker.getLimits()
      };
    },

    setLimits(newLimits: unknown) {
      limitChecker.setLimits(newLimits);
      emitter.emit(LISTENER_TRACKER_EVENT_NAMES.LIMITS_UPDATED, { limits: limitChecker.getLimits() });
    },

    healthCheck() {
      const stats = this.getStats();
      // @ts-expect-error strict migration — TS2554
      const leaks = this.detectLeaks();
      return {
        status: _destroyed ? 'DESTROYED' : (leaks.length > 0 ? 'WARNING' : 'HEALTHY'),
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
      // @ts-expect-error strict migration — TS2345
      panelRegistry.forEach((_: unknown, panelId: string) => {
        cleanupManager.cleanupPanel(panelId);
      });
      panelRegistry.clear();
      emitter.emit(LISTENER_TRACKER_EVENT_NAMES.DESTROYED, { stats: statsManager.getStats() });
    }
  };

  return tracker;
}

let _globalTracker: ReturnType<typeof createListenerTracker> | null = null;

export function getListenerTracker(options: Record<string, unknown>) {
  if (!_globalTracker) {
    _globalTracker = createListenerTracker(options);
  }
  return _globalTracker;
}

export function resetGlobalTracker() {
  if (_globalTracker) {
    _globalTracker.destroy();
    _globalTracker = null;
  }
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ['createListenerTracker', 'getListenerTracker'],
    listenerTypes: Object.keys(LISTENER_TYPES),
    modular: true
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    hasGlobalTracker: !!_globalTracker,
    modular: true
  };
}

export default {
  VERSION, MODULE_ID,
  LISTENER_TYPES,
  createListenerTracker, getListenerTracker, resetGlobalTracker,
  info, healthCheck
};
