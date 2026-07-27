// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: lazy-loader/diagnostics/health
// PURPOSE: Métricas, health check e informações
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, LOAD_STATES from ../constants.js
//   getConfig, getMetrics, getSubscribers, getModules from ../state.js
//   listModules from ../queries/module-queries.js
// EXPORTS:
//   getMetrics — Retorna métricas de carregamento
//   healthCheck — Diagnóstico de saúde
//   info — Informações do módulo
// ═══════════════════════════════════════════════════════════════
/**
 * @module LazyLoaderDiagnosticsHealth
 * @description Health e diagnóstico do lazy loader
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { VERSION, MODULE_ID, LOAD_STATES } from '../constants.js';
import { getConfig, getMetrics as getStateMetrics, getSubscribers, getModules } from '../state.js';
import { listModules } from '../queries/module-queries.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


/**
 * Retorna métricas de carregamento
 * @returns {Object}
 */
export function getMetrics() {
    const metrics = getStateMetrics();
    const modules = getModules();
    
    const avgLoadTime = metrics.successfulLoads > 0 ?
        Math.round(metrics.totalLoadTime / metrics.successfulLoads) : 0;
    
    let loadedCount = 0;
    modules.forEach((entry: DynObj) => {
        if (entry.state === LOAD_STATES.LOADED) loadedCount++;
    });
    
    return {
        totalLoads: metrics.totalLoads,
        successfulLoads: metrics.successfulLoads,
        failedLoads: metrics.failedLoads,
        cachedHits: metrics.cachedHits,
        avgLoadTime,
        registeredModules: modules.size,
        loadedModules: loadedCount
    };
}

/**
 * Health check do módulo
 * @returns {Object}
 */
export function healthCheck() {
    const metrics = getMetrics();
    const moduleList = listModules();
    const errorModules = moduleList.filter(m => m.state === LOAD_STATES.ERROR);
    
    const checks = {
        noErrorModules: errorModules.length === 0,
        lowFailureRate: metrics.totalLoads === 0 || (metrics.failedLoads / metrics.totalLoads) < 0.2,
        goodCacheRate: metrics.totalLoads === 0 || metrics.cachedHits > 0 || metrics.totalLoads < 5
    };
    
    let passed = 0;
    const keys = Object.keys(checks);
    for (let i = 0; i < keys.length; i++) {
        if ((checks as DynObj)[keys[i]]) passed++;
    }
    
    let status = 'UNHEALTHY';
    if (passed === keys.length) status = 'HEALTHY';
    else if (passed >= 1) status = 'DEGRADED';
    
    return {
        status,
        score: `${passed}/${keys.length}`,
        checks,
        metrics,
        errorModules: errorModules.length > 0 ? errorModules : null,
        version: VERSION,
        moduleId: MODULE_ID,
        timestamp: Date.now()
    };
}

/**
 * Informações do módulo
 * @returns {Object}
 */
export function info() {
    const config = getConfig();
    
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        config: {
            timeout: config.timeout,
            retryAttempts: config.retryAttempts,
            retryDelay: config.retryDelay,
            preloadOnIdle: config.preloadOnIdle,
            cacheModules: config.cacheModules
        },
        metrics: getMetrics(),
        modules: listModules(),
        subscriberCount: getSubscribers().length,
        timestamp: Date.now()
    };
}

export default {
    getMetrics, healthCheck, info
};
