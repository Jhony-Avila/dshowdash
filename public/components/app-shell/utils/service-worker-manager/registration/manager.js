import { SW_STATES, UPDATE_STRATEGIES } from "../constants.js";
import { _state, getConfig, incrementMetric } from "../state.js";
import { notifySubscribers, updateState } from "../helpers/notify.js";
import { skipWaiting } from "../updates/manager.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.utils.service-worker-manager.registration.manager";
function isSupported() {
  _state.supported = "serviceWorker" in navigator;
  return _state.supported;
}
function register(options) {
  options = options || {};
  if (!isSupported()) {
    updateState(SW_STATES.NOT_SUPPORTED);
    return Promise.resolve({ ok: false, error: "Service Workers not supported" });
  }
  const config = getConfig();
  const swPath = options.swPath || config.swPath;
  const scope = options.scope || config.scope;
  return navigator.serviceWorker.register(swPath, { scope }).then((registration) => {
    _state.registration = registration;
    incrementMetric("registrations");
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          _state.updateAvailable = true;
          _state.waitingWorker = newWorker;
          incrementMetric("updates");
          notifySubscribers({
            type: "update-available",
            worker: newWorker,
            timestamp: Date.now()
          });
          if (config.updateStrategy === UPDATE_STRATEGIES.IMMEDIATE) {
            skipWaiting();
          }
        }
      });
    });
    if (registration.installing) {
      updateState(SW_STATES.INSTALLING, { registration });
    } else if (registration.waiting) {
      _state.updateAvailable = true;
      _state.waitingWorker = registration.waiting;
      updateState(SW_STATES.INSTALLED, { registration, updateAvailable: true });
    } else if (registration.active) {
      updateState(SW_STATES.ACTIVATED, { registration });
    }
    notifySubscribers({
      type: "registered",
      registration,
      timestamp: Date.now()
    });
    return { ok: true, registration };
  }).catch((error) => {
    incrementMetric("errors");
    updateState(SW_STATES.ERROR, { error: error.message });
    return { ok: false, error: error.message };
  });
}
function unregister() {
  if (!_state.registration) {
    return Promise.resolve({ ok: false, error: "No registration" });
  }
  return _state.registration.unregister().then((success) => {
    if (success) {
      _state.registration = null;
      updateState(SW_STATES.NOT_REGISTERED);
      notifySubscribers({
        type: "unregistered",
        timestamp: Date.now()
      });
    }
    return { ok: success };
  });
}
export {
  MODULE_ID,
  VERSION,
  isSupported,
  register,
  unregister
};
