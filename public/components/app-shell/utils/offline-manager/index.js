import { VERSION, MODULE_ID, CONNECTION_STATUS, SYNC_STATUS } from "./constants.js";
import { queueAction, removeAction, getPendingActions, getPendingCount, clearPending } from "./queue/manager.js";
import { syncPending, getSyncStatus } from "./sync/manager.js";
import {
  isOnline,
  isOffline,
  getConnectionStatus,
  getConnectionInfo,
  getState,
  ping,
  configure,
  getConfig,
  subscribe,
  healthCheck,
  info,
  destroy,
  getMetrics
} from "./api.js";
import { updateConnectionInfo } from "./connection/detection.js";
import { handleOnline, handleOffline, handleConnectionChange } from "./connection/handlers.js";
import { loadQueue } from "./storage/queue.js";
if (typeof window !== "undefined") {
  updateConnectionInfo();
  loadQueue();
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  if (typeof navigator !== "undefined" && navigator.connection) {
    navigator.connection.addEventListener("change", handleConnectionChange);
  }
}
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2, CONNECTION_STATUS as CONNECTION_STATUS2, SYNC_STATUS as SYNC_STATUS2 } from "./constants.js";
import { queueAction as queueAction2, removeAction as removeAction2, getPendingActions as getPendingActions2, getPendingCount as getPendingCount2, clearPending as clearPending2 } from "./queue/manager.js";
import { syncPending as syncPending2, getSyncStatus as getSyncStatus2 } from "./sync/manager.js";
import {
  isOnline as isOnline2,
  isOffline as isOffline2,
  getConnectionStatus as getConnectionStatus2,
  getConnectionInfo as getConnectionInfo2,
  getState as getState2,
  ping as ping2,
  configure as configure2,
  getConfig as getConfig2,
  subscribe as subscribe2,
  healthCheck as healthCheck2,
  info as info2,
  destroy as destroy2,
  getMetrics as getMetrics2
} from "./api.js";
var offline_manager_default = {
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2,
  CONNECTION_STATUS: CONNECTION_STATUS2,
  SYNC_STATUS: SYNC_STATUS2,
  isOnline: isOnline2,
  isOffline: isOffline2,
  getConnectionStatus: getConnectionStatus2,
  getConnectionInfo: getConnectionInfo2,
  getState: getState2,
  queueAction: queueAction2,
  removeAction: removeAction2,
  getPendingActions: getPendingActions2,
  getPendingCount: getPendingCount2,
  clearPending: clearPending2,
  syncPending: syncPending2,
  getSyncStatus: getSyncStatus2,
  ping: ping2,
  configure: configure2,
  getConfig: getConfig2,
  subscribe: subscribe2,
  destroy: destroy2,
  getMetrics: getMetrics2,
  healthCheck: healthCheck2,
  info: info2
};
export {
  CONNECTION_STATUS,
  MODULE_ID,
  SYNC_STATUS,
  VERSION,
  clearPending,
  configure,
  offline_manager_default as default,
  destroy,
  getConfig,
  getConnectionInfo,
  getConnectionStatus,
  getMetrics,
  getPendingActions,
  getPendingCount,
  getState,
  getSyncStatus,
  healthCheck,
  info,
  isOffline,
  isOnline,
  ping,
  queueAction,
  removeAction,
  subscribe,
  syncPending
};
