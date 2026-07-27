import { LISTENER_TYPES } from "./constants.js";
const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.listener-tracker.timer-tracker";
function createTimerTracker(options = {}) {
  const {
    panelRegistry,
    limitChecker,
    statsManager,
    generateId,
    createRemover
  } = options;
  return {
    // Rastreia um setTimeout
    trackTimeout(panelId, callback, delay) {
      if (!limitChecker.check(panelId, LISTENER_TYPES.TIMER)) return null;
      const registry = panelRegistry.getOrCreate(panelId);
      const listenerId = generateId();
      const wrappedCallback = () => {
        registry.timers.delete(listenerId);
        callback();
      };
      const timerId = setTimeout(wrappedCallback, delay);
      registry.timers.set(listenerId, {
        id: listenerId,
        type: LISTENER_TYPES.TIMER,
        timerId,
        delay,
        createdAt: Date.now()
      });
      panelRegistry.updateActivity(panelId);
      statsManager.incrementRegistered();
      return createRemover(panelId, listenerId, LISTENER_TYPES.TIMER, () => clearTimeout(timerId));
    },
    // Rastreia um setInterval
    trackInterval(panelId, callback, delay) {
      if (!limitChecker.check(panelId, LISTENER_TYPES.INTERVAL)) return null;
      const registry = panelRegistry.getOrCreate(panelId);
      const listenerId = generateId();
      const intervalId = setInterval(callback, delay);
      registry.intervals.set(listenerId, {
        id: listenerId,
        type: LISTENER_TYPES.INTERVAL,
        intervalId,
        delay,
        createdAt: Date.now()
      });
      panelRegistry.updateActivity(panelId);
      statsManager.incrementRegistered();
      return createRemover(panelId, listenerId, LISTENER_TYPES.INTERVAL, () => clearInterval(intervalId));
    },
    // Rastreia um requestAnimationFrame
    trackRAF(panelId, callback) {
      const registry = panelRegistry.getOrCreate(panelId);
      const listenerId = generateId();
      const wrappedCallback = (timestamp) => {
        registry.rafs.delete(listenerId);
        callback(timestamp);
      };
      const rafId = requestAnimationFrame(wrappedCallback);
      registry.rafs.set(listenerId, {
        id: listenerId,
        type: LISTENER_TYPES.RAF,
        rafId,
        createdAt: Date.now()
      });
      panelRegistry.updateActivity(panelId);
      statsManager.incrementRegistered();
      return createRemover(panelId, listenerId, LISTENER_TYPES.RAF, () => cancelAnimationFrame(rafId));
    }
  };
}
var timer_tracker_default = { createTimerTracker };
export {
  MODULE_ID,
  VERSION,
  createTimerTracker,
  timer_tracker_default as default
};
