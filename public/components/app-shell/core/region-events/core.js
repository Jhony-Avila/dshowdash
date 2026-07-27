import { listeners, globalListeners, metrics } from "./state.js";
import { addToHistory, createEvent } from "./helpers.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.core.region-events.core";
function emit(regionName, eventType, data) {
  const event = createEvent(regionName, eventType, data);
  addToHistory(event);
  metrics.eventsEmitted++;
  const regionListeners = listeners[regionName];
  if (regionListeners) {
    const typeListeners = regionListeners[eventType] || [];
    for (let i = 0; i < typeListeners.length; i++) {
      try {
        typeListeners[i](event);
      } catch (e) {
        metrics.errors++;
      }
    }
    const allListeners = regionListeners["*"] || [];
    for (let j = 0; j < allListeners.length; j++) {
      try {
        allListeners[j](event);
      } catch (e) {
        metrics.errors++;
      }
    }
  }
  for (let k = 0; k < globalListeners.length; k++) {
    try {
      globalListeners[k](event);
    } catch (e) {
      metrics.errors++;
    }
  }
  return true;
}
function on(regionName, eventType, callback) {
  if (typeof callback !== "function") return () => {
  };
  if (!listeners[regionName]) {
    listeners[regionName] = {};
  }
  if (!listeners[regionName][eventType]) {
    listeners[regionName][eventType] = [];
  }
  listeners[regionName][eventType].push(callback);
  metrics.listenersAdded++;
  return () => {
    off(regionName, eventType, callback);
  };
}
function off(regionName, eventType, callback) {
  const regionListeners = listeners[regionName];
  if (!regionListeners) return;
  const typeListeners = regionListeners[eventType];
  if (!typeListeners) return;
  const idx = typeListeners.indexOf(callback);
  if (idx >= 0) {
    typeListeners.splice(idx, 1);
    metrics.listenersRemoved++;
  }
}
export {
  MODULE_ID,
  VERSION,
  emit,
  off,
  on
};
