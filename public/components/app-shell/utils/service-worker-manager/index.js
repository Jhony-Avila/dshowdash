import { VERSION, MODULE_ID, SW_STATES, UPDATE_STRATEGIES } from "./constants.js";
import { getMetrics } from "./state.js";
import { register, unregister, isSupported } from "./registration/manager.js";
import { checkForUpdates, applyUpdate, skipWaiting, hasUpdate } from "./updates/manager.js";
import { postMessage, onMessage } from "./messaging/manager.js";
import { clearCache, precache, getCacheNames, getCacheSize } from "./cache/manager.js";
import { registerSync, getSyncTags } from "./sync/manager.js";
import { requestPushPermission, getPushSubscription, subscribePush } from "./push/manager.js";
import { startPeriodicCheck, stopPeriodicCheck } from "./periodic/manager.js";
import {
  isRegistered,
  isControlling,
  getState,
  getRegistration,
  configure,
  getConfig,
  subscribe,
  healthCheck,
  info
} from "./api.js";
import { notifySubscribers } from "./helpers/notify.js";
import { isSupported as isSupported2, register as register2 } from "./registration/manager.js";
import { getConfig as getConfig2 } from "./state.js";
if (typeof window !== "undefined") {
  isSupported2();
  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      notifySubscribers({
        type: "controller-changed",
        timestamp: Date.now()
      });
    });
  }
  const config = getConfig2();
  if (config.autoRegister) {
    register2();
  }
}
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2, SW_STATES as SW_STATES2, UPDATE_STRATEGIES as UPDATE_STRATEGIES2 } from "./constants.js";
import { register as _register, unregister as unregister2, isSupported as _isSupported } from "./registration/manager.js";
import { checkForUpdates as checkForUpdates2, applyUpdate as applyUpdate2, skipWaiting as skipWaiting2, hasUpdate as hasUpdate2 } from "./updates/manager.js";
import { postMessage as postMessage2, onMessage as onMessage2 } from "./messaging/manager.js";
import { clearCache as clearCache2, precache as precache2, getCacheNames as getCacheNames2, getCacheSize as getCacheSize2 } from "./cache/manager.js";
import { registerSync as registerSync2, getSyncTags as getSyncTags2 } from "./sync/manager.js";
import { requestPushPermission as requestPushPermission2, getPushSubscription as getPushSubscription2, subscribePush as subscribePush2 } from "./push/manager.js";
import { startPeriodicCheck as startPeriodicCheck2, stopPeriodicCheck as stopPeriodicCheck2 } from "./periodic/manager.js";
import {
  isRegistered as isRegistered2,
  isControlling as isControlling2,
  getState as getState2,
  getRegistration as getRegistration2,
  configure as configure2,
  subscribe as subscribe2,
  healthCheck as healthCheck2,
  info as info2
} from "./api.js";
import { getMetrics as getMetrics2 } from "./state.js";
var service_worker_manager_default = {
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2,
  SW_STATES: SW_STATES2,
  UPDATE_STRATEGIES: UPDATE_STRATEGIES2,
  register: _register,
  unregister: unregister2,
  checkForUpdates: checkForUpdates2,
  applyUpdate: applyUpdate2,
  skipWaiting: skipWaiting2,
  hasUpdate: hasUpdate2,
  postMessage: postMessage2,
  onMessage: onMessage2,
  clearCache: clearCache2,
  precache: precache2,
  getCacheNames: getCacheNames2,
  getCacheSize: getCacheSize2,
  registerSync: registerSync2,
  getSyncTags: getSyncTags2,
  requestPushPermission: requestPushPermission2,
  getPushSubscription: getPushSubscription2,
  subscribePush: subscribePush2,
  isSupported: _isSupported,
  isRegistered: isRegistered2,
  isControlling: isControlling2,
  getState: getState2,
  getRegistration: getRegistration2,
  startPeriodicCheck: startPeriodicCheck2,
  stopPeriodicCheck: stopPeriodicCheck2,
  configure: configure2,
  getConfig: getConfig2,
  subscribe: subscribe2,
  getMetrics: getMetrics2,
  healthCheck: healthCheck2,
  info: info2
};
export {
  MODULE_ID,
  SW_STATES,
  UPDATE_STRATEGIES,
  VERSION,
  applyUpdate,
  checkForUpdates,
  clearCache,
  configure,
  service_worker_manager_default as default,
  getCacheNames,
  getCacheSize,
  getConfig,
  getMetrics,
  getPushSubscription,
  getRegistration,
  getState,
  getSyncTags,
  hasUpdate,
  healthCheck,
  info,
  isControlling,
  isRegistered,
  isSupported,
  onMessage,
  postMessage,
  precache,
  register,
  registerSync,
  requestPushPermission,
  skipWaiting,
  startPeriodicCheck,
  stopPeriodicCheck,
  subscribe,
  subscribePush,
  unregister
};
