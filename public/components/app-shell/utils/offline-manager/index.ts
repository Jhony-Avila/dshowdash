// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
/**
 * @file Offline Manager - Modular Index
 * @version 1.0.0-MODULAR
 * @module app-shell/utils/offline-manager
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ./constants.js (VERSION, MODULE_ID, CONNECTION_STATUS, SYNC_STATUS)
 * @requires ./queue/manager.js (queue operations)
 * @requires ./sync/manager.js (sync operations)
 * @requires ./api.js (public API)
 * @requires ./connection/detection.js (updateConnectionInfo)
 * @requires ./connection/handlers.js (event handlers)
 * @requires ./storage/queue.js (loadQueue)
 * 
 * @provides VERSION, MODULE_ID, CONNECTION_STATUS, SYNC_STATUS
 * @provides Queue: queueAction, removeAction, getPendingActions, getPendingCount, clearPending
 * @provides Sync: syncPending, getSyncStatus
 * @provides API: isOnline, isOffline, getConnectionStatus, getConnectionInfo, getState
 * @provides API: ping, configure, getConfig, subscribe, healthCheck, info, destroy, getMetrics
 * 
 * @browserAPI window.addEventListener('online'/'offline'), (navigator as any).connection
 * 
 * @description
 * Orchestrator for offline functionality. Re-exports from modular structure
 * and auto-initializes connection detection and event handlers.
 * 
 * @example
 * import OfflineManager from './index.js';
 * if (OfflineManager.isOffline()) {
 *   OfflineManager.queueAction({ type: 'SAVE', payload: data });
 * }
 * ============================================================================
 */
'use strict';

export { VERSION, MODULE_ID, CONNECTION_STATUS, SYNC_STATUS } from './constants.js';

// Queue
export { queueAction, removeAction, getPendingActions, getPendingCount, clearPending } from './queue/manager.js';

// Sync
export { syncPending, getSyncStatus } from './sync/manager.js';

// API
export {
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
} from './api.js';

// Auto-init
import { updateConnectionInfo } from './connection/detection.js';
import { handleOnline, handleOffline, handleConnectionChange } from './connection/handlers.js';
import { loadQueue } from './storage/queue.js';

if (typeof window !== 'undefined') {
  updateConnectionInfo();
  loadQueue();
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  if (typeof navigator !== 'undefined' && (navigator as any).connection) {
    (navigator as any).connection.addEventListener('change', handleConnectionChange);
  }
}

// Default export
import { VERSION, MODULE_ID, CONNECTION_STATUS, SYNC_STATUS } from './constants.js';
import { queueAction, removeAction, getPendingActions, getPendingCount, clearPending } from './queue/manager.js';
import { syncPending, getSyncStatus } from './sync/manager.js';
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
} from './api.js';

export default {
  VERSION,
  MODULE_ID,
  CONNECTION_STATUS,
  SYNC_STATUS,
  isOnline,
  isOffline,
  getConnectionStatus,
  getConnectionInfo,
  getState,
  queueAction,
  removeAction,
  getPendingActions,
  getPendingCount,
  clearPending,
  syncPending,
  getSyncStatus,
  ping,
  configure,
  getConfig,
  subscribe,
  destroy,
  getMetrics,
  healthCheck,
  info
};
