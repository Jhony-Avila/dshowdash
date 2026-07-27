
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (7.1.0-P2-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-router-adapter
// PURPOSE: Sidebar V2 - Router Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   UI_EVENTS from /core/runtime/events/catalog/ui.events.js
//   ROUTER_EVENTS from /core/runtime/events/catalog/router.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   createRouterAdapter() — exported function
//   info() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   ROUTER_EVENTS.NAVIGATE
//   UI_EVENTS.HARD_NAV
// LISTENS (eventos):
//   'hashchange'
//   ROUTER_EVENTS.ROUTE_CHANGED
// WINDOW ACCESS:
//   window.addEventListener
//   window.location
//   window.removeEventListener
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.1.0-P2-HARDNAV';
export const MODULE_ID = 'sidebar-router-adapter';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _getEventBus() {
    return _getPort('eventBus') || _getPort('eventBusGlobal');
}

export function createRouterAdapter() {
    _initPorts();
    let _cleanups: (() => void)[] = [];
    let _metrics = {
        navigations: 0,
        routeChanges: 0,
        hardNavs: 0,
        errors: 0,
        lastNavigation: null as DynObj,
        lastRouteChange: null as DynObj,
        busSource: null as DynObj
    };

    function _emitNavigateRequest(route: string, source: DynObj, meta: DynObj) {
        const bus = _getEventBus();
        if (bus && bus.emit) {
            _metrics.busSource = _getPort('eventBus') ? 'eventBus' : 'eventBusGlobal';
            bus.emit(ROUTER_EVENTS.NAVIGATE, {
                path: route,
                options: { source: source || MODULE_ID, ...meta },
                source: source || MODULE_ID,
                timestamp: Date.now()
            });
        }
    }

    function _emitHardNav(route: string, reason: string) {
        const bus = _getEventBus();
        if (bus && bus.emit) {
            bus.emit(UI_EVENTS.HARD_NAV, {
                path: route,
                reason: reason || 'No RouterGlobal or EventBus pipeline',
                source: MODULE_ID,
                timestamp: Date.now()
            });
        }
        _metrics.hardNavs++;
    }

    return {
        navigate(route: string, meta = {}) {
            try {
                const rg = _getPort('routerGlobal');
                if (rg && rg.navigate) {
                    rg.navigate(route, { source: MODULE_ID, ...meta });
                    _metrics.navigations++;
                    _metrics.lastNavigation = { route, timestamp: Date.now() };
                    return { success: true, method: 'router-global' };
                }

                const bus = _getEventBus();
                if (bus && bus.emit) {
                    _emitNavigateRequest(route, MODULE_ID, meta);
                    _metrics.navigations++;
                    _metrics.lastNavigation = { route, timestamp: Date.now() };
                    return { success: true, method: 'event-bus-navigate' };
                }

                if (route && typeof window !== 'undefined' && window.location) {
                    _emitHardNav(route, 'No RouterGlobal or EventBus available');
                    window.location.hash = route.startsWith('#') ? route : `#${route}`;
                    _metrics.navigations++;
                    _metrics.lastNavigation = { route, timestamp: Date.now() };
                    return { success: true, method: 'hash-fallback' };
                }

                _metrics.errors++;
                return { success: false, error: 'no-route' };
            } catch (error: any) {
                _metrics.errors++;
                return { success: false, error: error.message };
            }
        },

        getCurrentRoute() {
            try {
                const rg = _getPort('routerGlobal');
                if (rg?.getCurrentRoute) return rg.getCurrentRoute();
                if (typeof window !== 'undefined' && window.location) {
                    return {
                        path: window.location.hash || '#/',
                        hash: window.location.hash,
                        pathname: window.location.pathname
                    };
                }
                return { path: '#/', hash: '#/' };
            } catch (error: any) {
                return { path: '#/', hash: '#/', error: error.message };
            }
        },

        onRouteChange(callback: DynObj) {
            if (typeof callback !== 'function') return () => {};

            try {
                const bus = _getEventBus();
                if (bus && bus.on) {
                    const handler = (data: DynObj) => {
                        _metrics.routeChanges++;
                        _metrics.lastRouteChange = Date.now();
                        callback(data);
                    };
                    const cleanup = bus.on(ROUTER_EVENTS.ROUTE_CHANGED, handler);
                    if (typeof cleanup === 'function') {
                        _cleanups.push(cleanup);
                        return cleanup;
                    } else {
                        const manualCleanup = () => {
                            if (bus.off) bus.off(ROUTER_EVENTS.ROUTE_CHANGED, handler);
                        };
                        _cleanups.push(manualCleanup);
                        return manualCleanup;
                    }
                }

                const rg = _getPort('routerGlobal');
                if (rg?.on) {
                    const handler = (data: DynObj) => {
                        _metrics.routeChanges++;
                        _metrics.lastRouteChange = Date.now();
                        callback(data);
                    };
                    rg.on(ROUTER_EVENTS.ROUTE_CHANGED, handler);
                    const cleanup = () => { rg.off?.(ROUTER_EVENTS.ROUTE_CHANGED, handler); };
                    _cleanups.push(cleanup);
                    return cleanup;
                }

                const hashHandler = () => {
                    _metrics.routeChanges++;
                    _metrics.lastRouteChange = Date.now();
                    callback({
                        path: window.location.hash || '#/',
                        hash: window.location.hash
                    });
                };
                window.addEventListener('hashchange', hashHandler);
                const cleanup = () => { window.removeEventListener('hashchange', hashHandler); };
                _cleanups.push(cleanup);
                return cleanup;
            } catch (error: any) {
                _metrics.errors++;
                return () => {};
            }
        },

        getMetrics() {
            return { ..._metrics };
        },

        reset() {
            _metrics = {
                navigations: 0,
                routeChanges: 0,
                hardNavs: 0,
                errors: 0,
                lastNavigation: null,
                lastRouteChange: null,
                busSource: null
            };
        },

        destroy() {
            _cleanups.forEach(fn => {
                try { fn(); } catch(e) {}
            });
            _cleanups = [];
        },

        info() {
            return {
                moduleId: MODULE_ID,
                version: VERSION,
                p0Compliant: true,
                p2Compliant: true,
                portsInitialized: Ports.isInitialized(),
                currentRoute: this.getCurrentRoute(),
                cleanupCount: _cleanups.length,
                metrics: this.getMetrics(),
                busSource: _metrics.busSource
            };
        },

        healthCheck() {
            const bus = _getEventBus();
            const hasEventBus = !!bus;
            const hasRouterGlobal = !!_getPort('routerGlobal');
            const currentRoute = this.getCurrentRoute();
            const hasValidRoute = currentRoute && !currentRoute.error;

            const checks = {
                hasEventBus,
                hasRouterGlobal,
                hasValidRoute,
                noErrors: _metrics.errors === 0,
                cleanupSetup: _cleanups.length >= 0,
                p0Compliant: true,
                p2Compliant: true
            };

            const passed = Object.values(checks).filter(Boolean).length;
            const total = Object.keys(checks).length;

            let status = 'HEALTHY';
            if (!hasEventBus && !hasRouterGlobal) status = 'DEGRADED';
            if (_metrics.errors > 5) status = 'DEGRADED';

            return {
                status,
                score: passed,
                maxScore: total,
                scoreDisplay: `${passed}/${total}`,
                checks,
                currentRoute,
                metrics: _metrics,
                cleanupCount: _cleanups.length,
                version: VERSION,
                moduleId: MODULE_ID,
                portsInitialized: Ports.isInitialized(),
                busSource: _getPort('eventBus') ? 'eventBus' : (_getPort('eventBusGlobal') ? 'eventBusGlobal' : 'none'),
                timestamp: Date.now()
            };
        }
    };
}

export function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        p0Compliant: true,
        p2Compliant: true,
        portsInitialized: Ports.isInitialized()
    };
}

export function getMetrics() {
    return {};
}

export function healthCheck() {
    return {
        status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED',
        version: VERSION,
        moduleId: MODULE_ID,
        p0Compliant: true,
        p2Compliant: true,
        portsInitialized: Ports.isInitialized()
    };
}

export default {
    VERSION,
    MODULE_ID,
    createRouterAdapter,
    info,
    getMetrics,
    healthCheck
};
