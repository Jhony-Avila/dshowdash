
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (7.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-adapters-factory
// PURPOSE: Sidebar Core - Adapters Factory
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   ROUTER_EVENTS from /core/runtime/events/catalog/router.events.js
//   UI_EVENTS from /core/runtime/events/catalog/ui.events.js
//   NAV_INTENTS from /core/runtime/events/catalog/nav.events.js
//   createRouterAdapter from ../adapters/router-adapter.js
//   createTelemetryAdapter from ../adapters/telemetry-adapter.js
//   createPermissionsAdapter from ../adapters/permissions-adapter.js
//   createUIAdapter from ../adapters/ui-adapter.js
//   emitDegraded from ./error-emitter.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   createAdapters() — exported function
//   createPorts() — exported function
//   destroy() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   NAV_INTENTS.NAVIGATE
//   UI_EVENTS.HARD_NAV
//   event
// LISTENS (eventos):
//   'hashchange'
//   ROUTER_EVENTS.NAVIGATED
//   ROUTER_EVENTS.ROUTE_CHANGED
//   event
// WINDOW ACCESS:
//   window.addEventListener
//   window.location
//   window.removeEventListener
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';
import { NAV_INTENTS } from '/core/runtime/events/catalog/nav.events.js';
import { createRouterAdapter } from '../adapters/router-adapter.js';
import { createTelemetryAdapter } from '../adapters/telemetry-adapter.js';
import { createPermissionsAdapter } from '../adapters/permissions-adapter.js';
import { createUIAdapter } from '../adapters/ui-adapter.js';
import { emitDegraded } from './error-emitter.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.1.0-ES6';
export const MODULE_ID = 'sidebar-adapters-factory';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _metrics = { adapterCreations: 0, fallbacksUsed: 0, intentNavigations: 0 };
let _lastAdapters: DynObj | null = null;
let _routeChangeCleanup: (() => void) | null = null;

function createFallbackRouterAdapter() {
    _metrics.fallbacksUsed++;
    return {
        navigate(route: string) {
            _metrics.intentNavigations++;
            const router = _getPort('router');
            const eb = _getPort('eventBus');

            if (router && router.navigate) {
                router.navigate(route, { source: 'sidebar-fallback' });
                return;
            }

            if (eb && eb.emit) {
                eb.emit(NAV_INTENTS.NAVIGATE, {
                    intentId: 'NAVIGATE',
                    target: { type: 'route', value: route },
                    meta: { source: 'sidebar-fallback', reason: 'fallback-navigation', timestamp: Date.now() },
                    options: { replace: false }
                });
                return;
            }

            if (typeof window !== 'undefined' && window.location) {
                if (eb && eb.emit) {
                    eb.emit(UI_EVENTS.HARD_NAV, {
                        path: route,
                        reason: 'No RouterGlobal or EventBus pipeline',
                        source: 'sidebar-fallback',
                        timestamp: Date.now()
                    });
                }
                window.location.hash = route;
            }
        },

        getCurrentRoute() {
            const router = _getPort('router');
            if (router && router.getCurrentRoute) return router.getCurrentRoute();
            if (router && router.current) return router.current;
            if (typeof window !== 'undefined' && window.location) {
                const hash = window.location.hash || '#/';
                return { path: hash, hash };
            }
            return { path: '#/', hash: '#/' };
        },

        onRouteChange(callback: DynObj) {
            const eb = _getPort('eventBus');
            if (eb && eb.on) {
                const handler = (data: DynObj) => {
                    const path = (data && data.path)
                        ? data.path
                        : ((typeof window !== 'undefined' && window.location) ? window.location.hash : '#/');
                    callback(data || { path, hash: path });
                };

                const unsub1 = eb.on(ROUTER_EVENTS.ROUTE_CHANGED, handler);
                const unsub2 = eb.on(ROUTER_EVENTS.NAVIGATED, handler);

                const cleanup = () => {
                    if (typeof unsub1 === 'function') unsub1();
                    else if (eb.off) eb.off(ROUTER_EVENTS.ROUTE_CHANGED, handler);

                    if (typeof unsub2 === 'function') unsub2();
                    else if (eb.off) eb.off(ROUTER_EVENTS.NAVIGATED, handler);
                };

                _routeChangeCleanup = cleanup;
                return cleanup;
            }

            if (typeof window !== 'undefined') {
                const hashHandler = () => {
                    const hash = window.location.hash || '#/';
                    callback({ path: hash, hash });
                };
                window.addEventListener('hashchange', hashHandler);
                const hashCleanup = () => { window.removeEventListener('hashchange', hashHandler); };
                _routeChangeCleanup = hashCleanup;
                return hashCleanup;
            }

            return () => {};
        },

        healthCheck() {
            return { status: 'DEGRADED', score: 1, maxScore: 3, scoreDisplay: '1/3', fallback: true, intentBased: true };
        }
    };
}

function createFallbackUIAdapter() {
    _metrics.fallbacksUsed++;
    return {
        getContainer() {
            return document.querySelector('[data-shell-region="sidebar"]') || document.getElementById('sidebar');
        },
        healthCheck() {
            return { status: 'DEGRADED', score: 1, maxScore: 3, scoreDisplay: '1/3', fallback: true };
        }
    };
}

function createFallbackTelemetryAdapter() {
    _metrics.fallbacksUsed++;
    return {
        log() {},
        track() {},
        error() {},
        healthCheck() {
            return { status: 'DEGRADED', fallback: true };
        }
    };
}

function createFallbackPermissionsAdapter() {
    _metrics.fallbacksUsed++;
    return {
        getUserLevel() { return 0; },
        getUserPermissions(): DynObj[] { return []; },
        canAccess() { return false; },
        filterItems(items: DynObj[]) { return Array.isArray(items) ? items : []; },
        isAuthenticated() { return false; },
        healthCheck() {
            return { status: 'DEGRADED', fallback: true };
        }
    };
}

export function createAdapters(config: { containerSelector?: string } = {}) {
    _metrics.adapterCreations++;
    const adapters: DynObj = {};

    try {
        adapters.router = createRouterAdapter();
    } catch (error: any) {
        emitDegraded('router-adapter', error.message);
        adapters.router = createFallbackRouterAdapter();
    }

    try {
        adapters.telemetry = createTelemetryAdapter();
    } catch (error: any) {
        emitDegraded('telemetry-adapter', error.message);
        adapters.telemetry = createFallbackTelemetryAdapter();
    }

    try {
        adapters.permissions = createPermissionsAdapter();
    } catch (error: any) {
        emitDegraded('permissions-adapter', error.message);
        adapters.permissions = createFallbackPermissionsAdapter();
    }

    try {
        adapters.ui = createUIAdapter({ containerSelector: config.containerSelector || '[data-shell-region="sidebar"]' });
    } catch (error: any) {
        emitDegraded('ui-adapter', error.message);
        adapters.ui = createFallbackUIAdapter();
    }

    _lastAdapters = adapters;
    return adapters;
}

export function createPorts(adapters: DynObj) {
    return {
        navigation: adapters.router,
        telemetry: adapters.telemetry,
        permissions: adapters.permissions,
        ui: adapters.ui,
        events: createEventsPort()
    };
}

function createEventsPort() {
    return {
        emit(event: string, data: DynObj) {
            try {
                const eb = _getPort('eventBus');
                if (eb && eb.emit) {
                    eb.emit(event, Object.assign({ source: 'sidebar', timestamp: Date.now() }, data || {}));
                }
            } catch (e) {}
        },
        on(event: string, callback: DynObj) {
            try {
                const eb = _getPort('eventBus');
                if (eb && eb.on) {
                    const unsub = eb.on(event, callback);
                    if (typeof unsub === 'function') return unsub;
                    return () => { if (eb.off) eb.off(event, callback); };
                }
            } catch (e) {}
            return () => {};
        },
        off(event: string, callback: DynObj) {
            try {
                const eb = _getPort('eventBus');
                if (eb && eb.off) eb.off(event, callback);
            } catch (e) {}
        }
    };
}

export function destroy() {
    if (_routeChangeCleanup) {
        try { _routeChangeCleanup(); } catch (e) { /* silent */ }
        _routeChangeCleanup = null;
    }
    _lastAdapters = null;
}

export function getMetrics() {
    return Object.assign({}, _metrics, { hasAdapters: !!_lastAdapters, hasRouteChangeCleanup: !!_routeChangeCleanup });
}

export function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        portsInitialized: Ports.isInitialized(),
        hasAdapters: !!_lastAdapters,
        hasRouteChangeCleanup: !!_routeChangeCleanup,
        metrics: getMetrics(),
        p24Compliant: true
    };
}

export function healthCheck() {
    return {
        status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED',
        version: VERSION,
        moduleId: MODULE_ID,
        portsInitialized: Ports.isInitialized(),
        checks: { fallbacksAvailable: true, hasAdapters: !!_lastAdapters, intentBased: true, noOrphanListeners: true },
        metrics: getMetrics(),
        p24Compliant: true
    };
}

export default {
    createAdapters,
    createPorts,
    createFallbackRouterAdapter,
    createFallbackUIAdapter,
    createFallbackTelemetryAdapter,
    createFallbackPermissionsAdapter,
    destroy,
    healthCheck,
    info,
    getMetrics,
    VERSION,
    MODULE_ID,
    injectPorts,
    getPorts
};
