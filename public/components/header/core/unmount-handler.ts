// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.4.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/unmount-handler
// PURPOSE: Executes header unmount, destroys sub-managers, nullifies references
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   log, _metrics, resetIntegrations from ./logger.js
//   cleanupGlobalStateIntegration from ./global-state-integration.js
// PROVIDES:
//   executeUnmount(header) — execute full unmount and destroy sequence
//   getMetrics() — return unmount metrics
//   resetMetrics() — reset unmount metrics
//   healthCheck() — return health status
//   info() — return module info
// WINDOW ACCESS:
//   window[apiName] — deletes global header API on unmount
//   window[__apiNameInstance] — deletes global header instance on unmount
// ═══════════════════════════════════════════════════════════════
// Header - Unmount Handler
// @version 6.4.0-ES6
// @changelog v6.4.0-ES6 - Task 10.1 B06: var → const/let
// @changelog v6.3.0-ENTERPRISE - Adicionado healthCheck, info, metrics
'use strict';

import { log, _metrics, resetIntegrations } from './logger.js';
import { cleanupGlobalStateIntegration } from './global-state-integration.js';

export const VERSION = '6.4.0-ES6';
export const MODULE_ID = 'header/core/unmount-handler';

const _localMetrics = { unmountAttempts: 0, unmountSuccesses: 0, unmountFailures: 0, avgUnmountTimeMs: 0, lastUnmountAt: (null as unknown|null), lastErrorAt: (null as unknown|null) };

export function executeUnmount(header: Record<string,unknown>) {
    const unmountStart = Date.now();
    _localMetrics.unmountAttempts++;
    log('info', 'Desmontando header');
    _metrics.unmountCount++;
    _metrics.lastUnmountAt = Date.now();

    // @ts-expect-error TS migration - TS2339
    if (header.events && header.events.cleanup) header.events.cleanup();
    // @ts-expect-error TS migration - TS2345
    cleanupGlobalStateIntegration(header.globalStateCleanups);
    header.globalStateCleanups = [];

    // @ts-expect-error TS migration - TS2339
    const lifecyclePromise = header.lifecycle ? header.lifecycle.unmount() : Promise.resolve();

    return lifecyclePromise.then(() => {
        // @ts-expect-error TS migration - TS2339
        if (header.fallbackManager && header.fallbackManager.destroy) header.fallbackManager.destroy();
        // @ts-expect-error TS migration - TS2339
        return header.componentsLoader ? header.componentsLoader.unmountAll() : Promise.resolve();
    }).then(() => {
        // @ts-expect-error TS migration - TS2339
        if (header.routerIntegration && header.routerIntegration.destroy) header.routerIntegration.destroy();

        if (header.performanceObserver) {
            // @ts-expect-error TS migration - TS2339
            header.performanceObserver.disconnect();
            header.performanceObserver = null;
        }

        // @ts-expect-error strict migration — TS2769
        Object.keys(header.abortControllers).forEach(key => {
            // @ts-expect-error TS migration - TS2339
            if ((header.abortControllers as Record<string,unknown>)[key] && (header.abortControllers as Record<string,unknown>)[key].abort) {
                // @ts-expect-error TS migration - TS2339
                (header.abortControllers as Record<string,unknown>)[key].abort();
            }
            (header.abortControllers as Record<string,unknown>)[key] = null;
        });

        // @ts-expect-error TS migration - TS2339
        if (header.polling && header.polling.stop) header.polling.stop();
        // @ts-expect-error TS migration - TS2339
        if (header.shortcuts && header.shortcuts.unmount) header.shortcuts.unmount();
        // @ts-expect-error TS migration - TS2339
        if (header.announceManager && header.announceManager.unmount) header.announceManager.unmount();
        // @ts-expect-error TS migration - TS2339
        if (header.rovingTabindex && header.rovingTabindex.unmount) header.rovingTabindex.unmount();
        // @ts-expect-error TS migration - TS2339
        if (header.refreshCoordinator && header.refreshCoordinator.unmount) header.refreshCoordinator.unmount();
        // @ts-expect-error TS migration - TS2339
        if (header.fullscreenManager && header.fullscreenManager.unmount) header.fullscreenManager.unmount();
        // @ts-expect-error TS migration - TS2339
        if (header.scrollDetector && header.scrollDetector.unmount) header.scrollDetector.unmount();
        // @ts-expect-error TS migration - TS2339
        if (header.networkMonitor && header.networkMonitor.unmount) header.networkMonitor.unmount();
        // @ts-expect-error TS migration - TS2339
        if (header.rippleManager && header.rippleManager.unmount) header.rippleManager.unmount();
        // @ts-expect-error TS migration - TS2339
        if (header.currencyPanel && header.currencyPanel.unmount) header.currencyPanel.unmount();
        // @ts-expect-error TS migration - TS2339
        if (header.weatherPanel && header.weatherPanel.unmount) header.weatherPanel.unmount();
        // @ts-expect-error TS migration - TS2339
        if (header.connectivityModal && header.connectivityModal.unmount) header.connectivityModal.unmount();
        // @ts-expect-error TS migration - TS2339
        if (header.alertsPanel && header.alertsPanel.unmount) header.alertsPanel.unmount();
        // @ts-expect-error TS migration - TS2339
        if (header.healthPanel && header.healthPanel.unmount) header.healthPanel.unmount();
        // @ts-expect-error TS migration - TS2339
        if (header.notifications && header.notifications.unmount) header.notifications.unmount();

        // @ts-expect-error TS migration - TS2339
        if (header.timers && header.timers.destroy) header.timers.destroy();
        // @ts-expect-error TS migration - TS2339
        if (header.store && header.store.reset) header.store.reset();

        // @ts-expect-error TS migration - TS2339
        return header.lifecycle ? header.lifecycle.destroy() : Promise.resolve();
    }).then(() => {
        // @ts-expect-error TS migration - TS2339
        if (header.eventBus && header.eventBus.destroy) header.eventBus.destroy();

        // @ts-expect-error TS migration - TS2339
        const apiName = (header.options && header.options.globalApiName) || 'headerAPI';
        if (typeof window !== 'undefined') {
            delete window[apiName];
            // @ts-expect-error TS migration - TS2352
            delete window[`__${apiName}Instance` as number];
        }

        nullifyReferences(header);

        header.isMounted = false;
        header.isDestroyed = true;
        resetIntegrations();
        
        const unmountTimeMs = Date.now() - unmountStart;
        _localMetrics.unmountSuccesses++;
        _localMetrics.lastUnmountAt = Date.now();
        _localMetrics.avgUnmountTimeMs = ((_localMetrics.avgUnmountTimeMs * (_localMetrics.unmountSuccesses - 1)) + unmountTimeMs) / _localMetrics.unmountSuccesses;
        
        log('info', `Header desmontado e destruido (${unmountTimeMs}ms)`);
    }).catch((error: unknown) => {
        _localMetrics.unmountFailures++;
        _localMetrics.lastErrorAt = Date.now();
        // @ts-expect-error TS migration - TS2339
        log('error', 'Erro no unmount:', error.message);
        throw error;
    });
}

function nullifyReferences(header: Record<string,unknown>) {
    header.config = null;
    header.logger = null;
    header.telemetry = null;
    header.timers = null;
    header.eventBus = null;
    header.store = null;
    header.lifecycle = null;
    header.fetchClient = null;
    header.healthAPI = null;
    header.alertsAPI = null;
    header.networkMonitor = null;
    header.polling = null;
    header.statusTray = null;
    header.tooltips = null;
    header.envChip = null;
    header.infoIcons = null;
    header.scrollDetector = null;
    header.fullscreenManager = null;
    header.refreshCoordinator = null;
    header.rovingTabindex = null;
    header.announceManager = null;
    header.shortcuts = null;
    header.rippleManager = null;
    header.notifications = null;
    header.currencyPanel = null;
    header.weatherPanel = null;
    header.connectivityModal = null;
    header.alertsPanel = null;
    header.healthPanel = null;
    header.elements = {};
    header.features = null;
    header.abortControllers = {};
    header.fallbackManager = null;
    header.routerIntegration = null;
    header.componentsLoader = null;
    header.integrations = null;
}

export function getMetrics() { return Object.assign({}, _localMetrics); }
export function resetMetrics() { _localMetrics.unmountAttempts = 0; _localMetrics.unmountSuccesses = 0; _localMetrics.unmountFailures = 0; _localMetrics.avgUnmountTimeMs = 0; _localMetrics.lastUnmountAt = null; _localMetrics.lastErrorAt = null; }

export function healthCheck() {
    const successRate = _localMetrics.unmountAttempts > 0 ? _localMetrics.unmountSuccesses / _localMetrics.unmountAttempts : 1;
    // @ts-expect-error TS migration - TS2363
    const checks = { executeUnmountAvailable: typeof executeUnmount === 'function', nullifyReferencesAvailable: typeof nullifyReferences === 'function', goodSuccessRate: successRate >= 0.9 || _localMetrics.unmountAttempts === 0, noRecentErrors: !_localMetrics.lastErrorAt || (Date.now() - _localMetrics.lastErrorAt > 60000) };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, successRate, avgUnmountTimeMs: Math.round(_localMetrics.avgUnmountTimeMs), version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
}

export function info() {
    return { version: VERSION, moduleId: MODULE_ID, metrics: getMetrics(), healthCheck: healthCheck() };
}

export default { VERSION, MODULE_ID, executeUnmount, getMetrics, resetMetrics, healthCheck, info };
