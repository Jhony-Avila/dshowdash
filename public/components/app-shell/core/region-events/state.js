import { REGION_MAP } from "../dom-regions/index.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.core.region-events.state";
const listeners = {};
const globalListeners = [];
const eventHistory = [];
const historyLimit = { value: 100 };
const initialized = { value: false };
const domListenersAttached = { value: false };
const metrics = {
  eventsEmitted: 0,
  listenersAdded: 0,
  listenersRemoved: 0,
  errors: 0
};
const regionNames = Object.keys(REGION_MAP);
for (let i = 0; i < regionNames.length; i++) {
  listeners[regionNames[i]] = {};
}
export {
  MODULE_ID,
  VERSION,
  domListenersAttached,
  eventHistory,
  globalListeners,
  historyLimit,
  initialized,
  listeners,
  metrics
};
