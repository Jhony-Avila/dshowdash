import { LISTENER_TYPES } from "./constants.js";
const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.listener-tracker.dom-tracker";
function createDOMTracker(options = {}) {
  const {
    panelRegistry,
    limitChecker,
    statsManager,
    generateId,
    createRemover
  } = options;
  return {
    // Rastreia um DOM event listener
    track(panelId, element, eventType, handler, listenerOptions = {}) {
      if (!limitChecker.check(panelId, LISTENER_TYPES.DOM)) return null;
      const registry = panelRegistry.getOrCreate(panelId);
      const listenerId = generateId();
      element.addEventListener(eventType, handler, listenerOptions);
      const cleanup = () => {
        element.removeEventListener(eventType, handler, listenerOptions);
      };
      registry.listeners.set(listenerId, {
        id: listenerId,
        type: LISTENER_TYPES.DOM,
        eventType,
        element: element.tagName || "unknown",
        options: listenerOptions,
        createdAt: Date.now()
      });
      panelRegistry.updateActivity(panelId);
      statsManager.incrementRegistered();
      return createRemover(panelId, listenerId, LISTENER_TYPES.DOM, cleanup);
    },
    // Rastreia um window event listener
    trackWindow(panelId, eventType, handler, listenerOptions = {}) {
      if (typeof window === "undefined") return null;
      return this.track(panelId, window, eventType, handler, listenerOptions);
    },
    // Rastreia um document event listener
    trackDocument(panelId, eventType, handler, listenerOptions = {}) {
      if (typeof document === "undefined") return null;
      return this.track(panelId, document, eventType, handler, listenerOptions);
    }
  };
}
var dom_tracker_default = { createDOMTracker };
export {
  MODULE_ID,
  VERSION,
  createDOMTracker,
  dom_tracker_default as default
};
