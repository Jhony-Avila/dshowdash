// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: lazy-loader
// PURPOSE: Entry point do Lazy Loader
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM:
//   ./constants.js — VERSION, MODULE_ID, LOAD_STATES
//   ./state.js — getConfig, updateConfig, getSubscribers
//   ./core/loader.js — load
//   ./core/registry.js — register, unregister, loadMany, preload
//   ./queries/module-queries.js — isLoaded, getState, getModule, getModuleInfo, listModules
//   ./cache/invalidation.js — invalidate, invalidateAll
//   ./diagnostics/health.js — getMetrics, healthCheck, info
// ═══════════════════════════════════════════════════════════════
/**
 * @module LazyLoader
 * @description Lazy Loading de módulos UI
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { VERSION, MODULE_ID, LOAD_STATES } from './constants.js';
import { getConfig as _getConfig, updateConfig, getSubscribers } from './state.js';

import { load } from './core/loader.js';
import { register, unregister, loadMany, preload } from './core/registry.js';
import { isLoaded, getState, getModule, getModuleInfo, listModules } from './queries/module-queries.js';
import { invalidate, invalidateAll } from './cache/invalidation.js';
import { getMetrics, healthCheck, info } from './diagnostics/health.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

/**
 * Configura opções do lazy loader
 * @param {Object} options - Opções de configuração
 */
export function configure(options: DynObj) {
    updateConfig(options);
}

/**
 * Retorna configuração atual
 * @returns {Object}
 */
export function getConfig() {
    const config = _getConfig();
    return {
        timeout: config.timeout,
        retryAttempts: config.retryAttempts,
        retryDelay: config.retryDelay,
        preloadOnIdle: config.preloadOnIdle,
        cacheModules: config.cacheModules
    };
}

/**
 * Registra subscriber para eventos
 * @param {function} callback - Callback de eventos
 * @returns {function} Unsubscribe
 */
export function subscribe(callback: DynObj) {
    if (typeof callback !== 'function') return () => {};
    
    const subscribers = getSubscribers();
    subscribers.push(callback);
    
    return () => {
        const idx = subscribers.indexOf(callback);
        if (idx >= 0) subscribers.splice(idx, 1);
    };
}

// Re-exports
export { VERSION, MODULE_ID, LOAD_STATES };
export { register, unregister, load, loadMany, preload };
export { isLoaded, getState, getModule, getModuleInfo, listModules };
export { invalidate, invalidateAll };
export { getMetrics, healthCheck, info };


export default {
    VERSION, MODULE_ID, LOAD_STATES,
    register, unregister, load, loadMany, preload,
    isLoaded, getState, getModule, getModuleInfo, listModules,
    invalidate, invalidateAll,
    configure, getConfig, subscribe,
    getMetrics, healthCheck, info
};
