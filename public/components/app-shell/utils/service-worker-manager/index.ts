// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.1-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: service-worker-manager
// PURPOSE: Entry point do Service Worker Manager
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM:
//   ./constants.js — VERSION, MODULE_ID, SW_STATES, UPDATE_STRATEGIES
//   ./state.js — getMetrics, getConfig
//   ./registration/manager.js — register, unregister, isSupported
//   ./updates/manager.js — checkForUpdates, applyUpdate, skipWaiting, hasUpdate
//   ./messaging/manager.js — postMessage, onMessage
//   ./cache/manager.js — clearCache, precache, getCacheNames, getCacheSize
//   ./sync/manager.js — registerSync, getSyncTags
//   ./push/manager.js — requestPushPermission, getPushSubscription, subscribePush
//   ./periodic/manager.js — startPeriodicCheck, stopPeriodicCheck
//   ./api.js — isRegistered, isControlling, getState, getRegistration, configure, subscribe, healthCheck, info
// SIDE EFFECTS: Auto-init, controller change listener
// ═══════════════════════════════════════════════════════════════
/**
 * @module ServiceWorkerManager
 * @description Service Workers Integration
 * @version 1.0.1-FIX-AAA
 * @since 2025-02-02
 */
'use strict';

export { VERSION, MODULE_ID, SW_STATES, UPDATE_STRATEGIES } from './constants.js';
export { getMetrics } from './state.js';

// Registration
export { register, unregister, isSupported } from './registration/manager.js';

// Updates
export { checkForUpdates, applyUpdate, skipWaiting, hasUpdate } from './updates/manager.js';

// Messaging
export { postMessage, onMessage } from './messaging/manager.js';

// Cache
export { clearCache, precache, getCacheNames, getCacheSize } from './cache/manager.js';

// Sync
export { registerSync, getSyncTags } from './sync/manager.js';

// Push
export { requestPushPermission, getPushSubscription, subscribePush } from './push/manager.js';

// Periodic
export { startPeriodicCheck, stopPeriodicCheck } from './periodic/manager.js';

// API
export {
    isRegistered,
    isControlling,
    getState,
    getRegistration,
    configure,
    getConfig,
    subscribe,
    healthCheck,
    info
} from './api.js';

// Auto-init
import { notifySubscribers } from './helpers/notify.js';
import { isSupported, register } from './registration/manager.js';
import { getConfig } from './state.js';

if (typeof window !== 'undefined') {
    isSupported();
    
    if (navigator.serviceWorker) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            notifySubscribers({
                type: 'controller-changed',
                timestamp: Date.now()
            });
        });
    }
    
    const config = getConfig();
    if (config.autoRegister) {
        register();
    }
}

// Default export
import { VERSION, MODULE_ID, SW_STATES, UPDATE_STRATEGIES } from './constants.js';
import { register as _register, unregister, isSupported as _isSupported } from './registration/manager.js';
import { checkForUpdates, applyUpdate, skipWaiting, hasUpdate } from './updates/manager.js';
import { postMessage, onMessage } from './messaging/manager.js';
import { clearCache, precache, getCacheNames, getCacheSize } from './cache/manager.js';
import { registerSync, getSyncTags } from './sync/manager.js';
import { requestPushPermission, getPushSubscription, subscribePush } from './push/manager.js';
import { startPeriodicCheck, stopPeriodicCheck } from './periodic/manager.js';
import {
    isRegistered,
    isControlling,
    getState,
    getRegistration,
    configure,
    subscribe,
    healthCheck,
    info
} from './api.js';
import { getMetrics } from './state.js';

export default {
    VERSION, MODULE_ID, SW_STATES, UPDATE_STRATEGIES,
    register: _register, unregister, checkForUpdates, applyUpdate, skipWaiting, hasUpdate,
    postMessage, onMessage, clearCache, precache, getCacheNames, getCacheSize,
    registerSync, getSyncTags, requestPushPermission, getPushSubscription, subscribePush,
    isSupported: _isSupported, isRegistered, isControlling, getState, getRegistration,
    startPeriodicCheck, stopPeriodicCheck, configure, getConfig, subscribe, getMetrics, healthCheck, info
};
