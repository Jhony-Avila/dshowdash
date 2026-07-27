import { LISTENER_TYPES } from "./constants.js";
const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.listener-tracker.observer-tracker";
function createObserverTracker(options = {}) {
  const {
    panelRegistry,
    limitChecker,
    statsManager,
    generateId,
    createRemover,
    eventBus
  } = options;
  return {
    // Rastreia um EventBus listener
    trackEventBus(panelId, eventName, handler, bus = eventBus) {
      if (!bus) return null;
      if (!limitChecker.check(panelId, LISTENER_TYPES.EVENTBUS)) return null;
      const registry = panelRegistry.getOrCreate(panelId);
      const listenerId = generateId();
      const unsubscribe = bus.on?.(eventName, handler) || (() => bus.off?.(eventName, handler));
      registry.listeners.set(listenerId, {
        id: listenerId,
        type: LISTENER_TYPES.EVENTBUS,
        eventType: eventName,
        createdAt: Date.now()
      });
      panelRegistry.updateActivity(panelId);
      statsManager.incrementRegistered();
      return createRemover(panelId, listenerId, LISTENER_TYPES.EVENTBUS, unsubscribe);
    },
    // Rastreia um Observer (MutationObserver, ResizeObserver, etc)
    trackObserver(panelId, observer, target, observerOptions = {}) {
      if (!limitChecker.check(panelId, LISTENER_TYPES.OBSERVER)) return null;
      const registry = panelRegistry.getOrCreate(panelId);
      const listenerId = generateId();
      observer.observe(target, observerOptions);
      registry.observers.set(listenerId, {
        id: listenerId,
        type: LISTENER_TYPES.OBSERVER,
        observerType: observer.constructor.name,
        createdAt: Date.now()
      });
      panelRegistry.updateActivity(panelId);
      statsManager.incrementRegistered();
      return createRemover(panelId, listenerId, LISTENER_TYPES.OBSERVER, () => observer.disconnect());
    },
    // Rastreia listener genérico com cleanup customizado
    trackCustom(panelId, description, cleanupFn) {
      if (!limitChecker.check(panelId, LISTENER_TYPES.CUSTOM)) return null;
      const registry = panelRegistry.getOrCreate(panelId);
      const listenerId = generateId();
      registry.listeners.set(listenerId, {
        id: listenerId,
        type: LISTENER_TYPES.CUSTOM,
        description,
        createdAt: Date.now()
      });
      panelRegistry.updateActivity(panelId);
      statsManager.incrementRegistered();
      return createRemover(panelId, listenerId, LISTENER_TYPES.CUSTOM, cleanupFn);
    }
  };
}
var observer_tracker_default = { createObserverTracker };
export {
  MODULE_ID,
  VERSION,
  createObserverTracker,
  observer_tracker_default as default
};
