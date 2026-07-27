// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v8.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/mount-handler
// PURPOSE: Executes header mount sequence, error handling, and partial cleanup
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   COMPONENT_EVENTS from /core/runtime/events/catalog/component.events.js
//   log, _metrics, updateIntegrationsStatus from ./logger.js
//   getErrorMessage, ensureUARPSRegion from ./helpers.js
//   headerTemplate from ../ui/template.js
//   EnvironmentDetector from ./environment.js
//   FallbackManager from ./fallback-manager.js
//   RouterIntegration from ./router-integration.js
//   ComponentsLoader from ./components-loader.js
// PROVIDES:
//   executeMount(header, container) — execute full mount sequence
//   handleMountError(header, error) — handle mount errors with circuit breaker
//   cleanupPartialMount(header) — cleanup after partial mount failure
//   getMetrics() — return mount metrics
//   resetMetrics() — reset mount metrics
//   healthCheck() — return health status
//   info() — return module info
// ═══════════════════════════════════════════════════════════════
// Header - Mount Handler
// @version 8.1.0-ES6
// @changelog v8.1.0-ES6 - Task 10.1 B07: var → const/let
// @changelog v8.0.0-P3 - Integração com RuntimeContext handlers
'use strict';

import { COMPONENT_EVENTS } from '/core/runtime/events/catalog/component.events.js';
import { log, _metrics, updateIntegrationsStatus } from './logger.js';
import { getErrorMessage, ensureUARPSRegion } from './helpers.js';
import { headerTemplate } from '../ui/template.js';
import { EnvironmentDetector } from './environment.js';
import { FallbackManager } from './fallback-manager.js';
import { RouterIntegration } from './router-integration.js';
import { ComponentsLoader } from './components-loader.js';

export const VERSION = '8.1.0-ES6';
export const MODULE_ID = 'header/core/mount-handler';

const _localMetrics = { mountAttempts: 0, mountSuccesses: 0, mountFailures: 0, cleanupCalls: 0, avgMountTimeMs: 0, lastMountAt: (null as unknown|null), lastErrorAt: (null as unknown|null) };

export function executeMount(header: Record<string,unknown>, container: HTMLElement|null) {
    const mountStart = Date.now();
    _localMetrics.mountAttempts++;
    _metrics.mountCount++;
    _metrics.lastMountAt = Date.now();
    updateIntegrationsStatus();

    return Promise.resolve().then(() => {
        container!.innerHTML = headerTemplate;
        ensureUARPSRegion(container);
        // @ts-expect-error TS migration - TS2349
        header.initCore();
        // @ts-expect-error TS migration - TS2339
        return header.lifecycle.mount();
    }).then(() => {
        // @ts-expect-error TS migration - TS2349
        header._emitGlobalEvent(COMPONENT_EVENTS.MOUNTED, {
            componentName: 'header',
            version: header.version,
            instanceId: header.instanceId,
            sessionId: header.sessionId,
            timestamp: Date.now()
        });
        // @ts-expect-error TS migration - TS2339
        return header.initializer.loadConfig();
    }).then(() => {
        // @ts-expect-error TS migration - TS2339
        header.initializer.cacheElements(container);
        // @ts-expect-error TS migration - TS2339
        header.initializer.validateStructure();
        if (header.reducedMode) log('warn', 'Header operando em MODO REDUZIDO');
        header.fallbackManager = new FallbackManager(header);
        header.routerIntegration = (new (RouterIntegration as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(header));
        // @ts-expect-error TS migration - TS2339
        header.managers.initAPI();
        // @ts-expect-error TS migration - TS2339
        header.managers.initManagers();
        // @ts-expect-error TS migration - TS2339
        header.ui.initUI();
        // @ts-expect-error TS migration - TS2339
        header.ui.initRefresh();
        // @ts-expect-error TS migration - TS2339
        header.ui.initAccessibility();
        header.componentsLoader = (new (ComponentsLoader as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(header));
        // @ts-expect-error TS migration - TS2339
        return header.componentsLoader.loadAll();
    }).then(() => {
        // @ts-expect-error TS migration - TS2339
        header.ui.mountAll();
        // @ts-expect-error TS migration - TS2339
        header.events.setupVisibilityChange();
        // @ts-expect-error TS migration - TS2339
        header.events.setupConnectivityHandlers();
        // @ts-expect-error TS migration - TS2339
        header.events.setupRefreshEventHandlers();
        // @ts-expect-error TS migration - TS2339
        header.events.setupAuthEventHandlers();
        // @ts-expect-error TS migration - TS2339
        header.events.setupIntentsHandlers();
        // @ts-expect-error TS migration - TS2339
        header.events.setupRuntimeContextHandlers();
        // @ts-expect-error TS migration - TS2339
        header.routerIntegration.setup();
        // @ts-expect-error TS migration - TS2349
        header._setupGlobalStateIntegration();
        const environmentData = EnvironmentDetector.detect();
        // @ts-expect-error TS migration - TS2339
        header.store.setEnvironment(environmentData.environment);
        // @ts-expect-error TS migration - TS2339
        header.envChip.update(environmentData.environment);
        // @ts-expect-error TS migration - TS2339
        return header.lifecycle.ready();
    }).then(() => {
        const loadTimeMs = Date.now() - mountStart;
        _localMetrics.mountSuccesses++;
        _localMetrics.lastMountAt = Date.now();
        _localMetrics.avgMountTimeMs = ((_localMetrics.avgMountTimeMs * (_localMetrics.mountSuccesses - 1)) + loadTimeMs) / _localMetrics.mountSuccesses;
        _metrics.lastActivity = Date.now();
        // @ts-expect-error TS migration - TS2339
        header.telemetry.trackBoot(header.version, navigator.userAgent, Intl.DateTimeFormat().resolvedOptions().timeZone, navigator.language);
        // @ts-expect-error TS migration - TS2349
        header._emitGlobalEvent(COMPONENT_EVENTS.READY, {
            componentName: 'header',
            loadTimeMs,
            version: header.version,
            instanceId: header.instanceId,
            sessionId: header.sessionId,
            features: header.features,
            reducedMode: header.reducedMode,
            p0Compliant: true,
            p3RuntimeContext: true,
            timestamp: Date.now()
        });
        log('info', `Header v${header.version} montado (${loadTimeMs}ms)${header.reducedMode ? ' [REDUZIDO]' : ''}`);
        // @ts-expect-error TS migration - TS2339
        header.api.exposeGlobalAPI();
        // @ts-expect-error TS migration - TS2339
        header.events.setupComponentsReadyListener();
        // @ts-expect-error TS migration - TS2339
        header.api.initPerformanceObserver();
        header.isMounted = true;
        header.isMounting = false;
        // @ts-expect-error TS migration - TS2339
        header.circuitBreaker.reset();
        return header;
    });
}

export function handleMountError(header: Record<string,unknown>, error: unknown) {
    header.isMounting = false;
    _localMetrics.mountFailures++;
    _localMetrics.lastErrorAt = Date.now();
    _metrics.errorCount++;
    const errorMsg = getErrorMessage(error);
    // @ts-expect-error TS migration - TS2339
    const errorStack = (error && error.stack) ? error.stack.substring(0, 300) : 'Stack indisponivel';
    // @ts-expect-error TS migration - TS2339
    const isOpen = header.circuitBreaker.recordFailure();
    if (isOpen) log('error', 'Circuit breaker ABERTO - multiplas falhas de mount');
    log('error', `Erro ao montar: ${errorMsg}`);
    log('error', 'Stack:', errorStack);
    // @ts-expect-error TS migration - TS2339
    const lifecyclePromise = header.lifecycle ? header.lifecycle.error(error) : Promise.resolve();
    return lifecyclePromise.then(() => {
        // @ts-expect-error TS migration - TS2349
        header._emitGlobalEvent(COMPONENT_EVENTS.ERROR, {
            componentName: 'header',
            error: errorMsg,
            stack: errorStack,
            phase: 'mount',
            instanceId: header.instanceId,
            timestamp: Date.now()
        });
        cleanupPartialMount(header);
        throw error;
    });
}

export function cleanupPartialMount(header: Record<string,unknown>) {
    _localMetrics.cleanupCalls++;
    try {
        // @ts-expect-error TS migration - TS2339
        if (header.abortControllers.global) {
            // @ts-expect-error TS migration - TS2339
            header.abortControllers.global.abort();
            // @ts-expect-error TS migration - TS2339
            header.abortControllers.global = null;
        }
        if (header.timers) {
            // @ts-expect-error TS migration - TS2339
            header.timers.destroy();
            header.timers = null;
        }
        if (header._cleanupLocalListeners) {
            // @ts-expect-error TS migration - TS2349
            header._cleanupLocalListeners();
        }
        header.eventBus = null;
        if (header.lifecycle) {
            // @ts-expect-error TS migration - TS2339
            header.lifecycle.reset();
            header.lifecycle = null;
        }
        // @ts-expect-error TS migration - TS2339
        if (header.events && header.events.cleanup) header.events.cleanup();
    } catch (e) {
        log('error', `Erro no cleanup parcial: ${getErrorMessage(e)}`);
    }
}

export function getMetrics() { return Object.assign({}, _localMetrics); }
export function resetMetrics() { _localMetrics.mountAttempts = 0; _localMetrics.mountSuccesses = 0; _localMetrics.mountFailures = 0; _localMetrics.cleanupCalls = 0; _localMetrics.avgMountTimeMs = 0; _localMetrics.lastMountAt = null; _localMetrics.lastErrorAt = null; }

export function healthCheck() {
    const successRate = _localMetrics.mountAttempts > 0 ? _localMetrics.mountSuccesses / _localMetrics.mountAttempts : 1;
    // @ts-expect-error TS migration - TS2363
    const checks = { executeMountAvailable: typeof executeMount === 'function', handleMountErrorAvailable: typeof handleMountError === 'function', cleanupAvailable: typeof cleanupPartialMount === 'function', goodSuccessRate: successRate >= 0.8 || _localMetrics.mountAttempts === 0, noRecentErrors: !_localMetrics.lastErrorAt || (Date.now() - _localMetrics.lastErrorAt > 60000) };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, successRate, avgMountTimeMs: Math.round(_localMetrics.avgMountTimeMs), version: VERSION, moduleId: MODULE_ID, p3RuntimeContext: true, timestamp: new Date().toISOString() };
}

export function info() {
    return { version: VERSION, moduleId: MODULE_ID, p3RuntimeContext: true, metrics: getMetrics(), healthCheck: healthCheck() };
}

export default { VERSION, MODULE_ID, executeMount, handleMountError, cleanupPartialMount, getMetrics, resetMetrics, healthCheck, info };
