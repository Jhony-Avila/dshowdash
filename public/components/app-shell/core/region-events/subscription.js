import { listeners, globalListeners, metrics } from "./state.js";
import { on } from "./core.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.core.region-events.subscription";
function onAny(eventType, callback) {
  if (typeof callback !== "function") return () => {
  };
  const unsubscribes = [];
  const keys = Object.keys(listeners);
  for (let i = 0; i < keys.length; i++) {
    unsubscribes.push(on(keys[i], eventType, callback));
  }
  return () => {
    for (let j = 0; j < unsubscribes.length; j++) {
      unsubscribes[j]();
    }
  };
}
function onGlobal(callback) {
  if (typeof callback !== "function") return () => {
  };
  globalListeners.push(callback);
  metrics.listenersAdded++;
  return () => {
    const idx = globalListeners.indexOf(callback);
    if (idx >= 0) {
      globalListeners.splice(idx, 1);
      metrics.listenersRemoved++;
    }
  };
}
function once(regionName, eventType, callback) {
  if (typeof callback !== "function") return () => {
  };
  let unsubscribe;
  const wrapper = (event) => {
    unsubscribe();
    callback(event);
  };
  unsubscribe = on(regionName, eventType, wrapper);
  return unsubscribe;
}
function waitFor(regionName, eventType, timeout) {
  timeout = timeout || 1e4;
  return new Promise((resolve, reject) => {
    let timeoutId;
    const unsubscribe = once(regionName, eventType, (event) => {
      if (timeoutId) clearTimeout(timeoutId);
      resolve(event);
    });
    timeoutId = setTimeout(() => {
      unsubscribe();
      reject(new Error(`Timeout waiting for ${eventType} on ${regionName}`));
    }, timeout);
  });
}
export {
  MODULE_ID,
  VERSION,
  onAny,
  onGlobal,
  once,
  waitFor
};
