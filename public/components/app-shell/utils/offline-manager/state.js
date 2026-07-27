import { CONNECTION_STATUS, SYNC_STATUS } from "./constants.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.utils.offline-manager.state";
const state = {
  isOnline: true,
  connectionStatus: CONNECTION_STATUS.UNKNOWN,
  effectiveType: null,
  downlink: null,
  rtt: null,
  syncStatus: SYNC_STATUS.IDLE,
  pendingActions: [],
  lastOnline: null,
  lastOffline: null
};
const config = {
  showBanner: true,
  bannerPosition: "bottom",
  autoSync: true,
  syncOnReconnect: true,
  queuePersist: true,
  storageKey: "app-shell-offline-queue",
  maxQueueSize: 100,
  slowThreshold: 500
};
const subscribers = [];
let bannerElement = null;
function setBannerElement(el) {
  bannerElement = el;
}
function getBannerElement() {
  return bannerElement;
}
const metrics = {
  offlineEvents: 0,
  onlineEvents: 0,
  actionsSynced: 0,
  actionsQueued: 0,
  syncErrors: 0
};
function incrementMetric(key, amount) {
  if (metrics.hasOwnProperty(key)) metrics[key] += amount || 1;
}
function getMetrics() {
  return {
    offlineEvents: metrics.offlineEvents,
    onlineEvents: metrics.onlineEvents,
    actionsSynced: metrics.actionsSynced,
    actionsQueued: metrics.actionsQueued,
    syncErrors: metrics.syncErrors,
    pendingActions: state.pendingActions.length
  };
}
function notifySubscribers(event) {
  for (let i = 0; i < subscribers.length; i++) {
    try {
      subscribers[i](event);
    } catch (e) {
    }
  }
}
export {
  MODULE_ID,
  VERSION,
  config as _config,
  state as _state,
  subscribers as _subscribers,
  bannerElement,
  config,
  getBannerElement,
  getMetrics,
  incrementMetric,
  metrics,
  notifySubscribers,
  setBannerElement,
  state,
  subscribers
};
