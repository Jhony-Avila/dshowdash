// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-P2-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.main.ui.navigation-fallback
// PURPOSE: Main UI - Navigation Fallback
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   ROUTER_EVENTS from /core/runtime/events/catalog/router.events.js
//   UI_EVENTS from /core/runtime/events/catalog/ui.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   navigateFallback() — exported function
//   getCurrentHash() — exported function
//   init() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   ROUTER_EVENTS.NAVIGATE
//   UI_EVENTS.HARD_NAV
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.location
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';

export const VERSION = '2.0.0-P2-HARDNAV';
export const MODULE_ID = 'components.main.ui.navigation-fallback';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _metrics = {
    fallbacks: 0,
    hashChanges: 0,
    routerNavigations: 0,
    errors: 0,
    lastNavigation: null as Record<string, unknown> | null
};

function _log(level: string, msg: string, data?: Record<string, unknown>) {
    const logger = _getPort('logger');
    if (!logger) return;
    const prefix = `[${MODULE_ID}]`;
    if (level === 'error' && logger.error) logger.error(prefix, msg, data || '');
    else if (level === 'warn' && logger.warn) logger.warn(prefix, msg, data || '');
    else if (level === 'info' && logger.info) logger.info(prefix, msg, data || '');
}

function _emitHardNav(path: string, reason: string) {
    const eb = _getPort('eventBus');
    if (eb && eb.emit) {
        eb.emit(UI_EVENTS.HARD_NAV, {
            path,
            reason: reason || 'navigation-fallback',
            source: MODULE_ID,
            timestamp: Date.now()
        });
    }
    _metrics.fallbacks++;
}

export function navigateFallback(path: string, options?: Record<string, unknown>) {
    _metrics.fallbacks++;
    options = options || {};

    if (typeof window === 'undefined') {
        return { ok: false, reason: 'No window' };
    }

    // Try RouterGlobal first
    const router = _getPort('routerGlobal');
    if (router && router.navigate) {
        router.navigate(path, { source: MODULE_ID });
        _metrics.routerNavigations++;
        _metrics.lastNavigation = { path, method: 'router', timestamp: Date.now() };
        _log('info', 'Navigation via RouterGlobal', { path });
        return { ok: true, method: 'router' };
    }

    // Try EventBus NAVIGATE
    const eb = _getPort('eventBus');
    if (eb && eb.emit) {
        eb.emit(ROUTER_EVENTS.NAVIGATE, {
            path,
            options: { source: MODULE_ID },
            source: MODULE_ID,
            timestamp: Date.now()
        });
        _metrics.routerNavigations++;
        _metrics.lastNavigation = { path, method: 'eventBus', timestamp: Date.now() };
        _log('info', 'Navigation via EventBus NAVIGATE', { path });
        return { ok: true, method: 'eventBus' };
    }

    // Fallback to hash - emit HARD_NAV first
    const hash = path.charAt(0) === '#' ? path : `#${path.charAt(0) === '/' ? path : `/${path}`}`;
    
    _emitHardNav(path, 'No RouterGlobal or EventBus available');
    
    if (options.replace) {
        window.location.replace(hash);
    } else {
        window.location.hash = hash;
    }
    
    _metrics.hashChanges++;
    _metrics.lastNavigation = { path, method: 'hash', timestamp: Date.now() };
    _log('warn', 'Navigation via hash fallback', { path, hash });
    
    return { ok: true, hash, method: 'hash-fallback' };
}

export function getCurrentHash() {
    if (typeof window !== 'undefined' && window.location) {
        return window.location.hash || '#/';
    }
    return '#/';
}

export function init(ctx?: Record<string, unknown>) {
    _initPorts();
    if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>);

    _log('info', 'NavigationFallback initialized');
    return { ok: true, version: VERSION };
}

export function getMetrics() {
    return Object.assign({}, _metrics);
}

export function resetMetrics() {
    _metrics.fallbacks = 0;
    _metrics.hashChanges = 0;
    _metrics.routerNavigations = 0;
    _metrics.errors = 0;
    _metrics.lastNavigation = null;
}

export function healthCheck() {
    const hasRouter = !!_getPort('routerGlobal');
    const hasEventBus = !!_getPort('eventBus');
    const hasWindow = typeof window !== 'undefined';

    const checks = {
        hasRouter,
        hasEventBus,
        hasWindow,
        lowErrorRate: _metrics.errors < 5,
        portsInitialized: Ports.isInitialized()
    };

    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;

    let status = 'HEALTHY';
    if (!hasRouter && !hasEventBus) status = 'DEGRADED';
    if (!hasWindow) status = 'UNHEALTHY';

    return {
        status,
        score: passed,
        maxScore: total,
        scoreDisplay: `${passed}/${total}`,
        checks,
        metrics: _metrics,
        version: VERSION,
        moduleId: MODULE_ID,
        p2Compliant: true,
        timestamp: Date.now()
    };
}

export function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        p2Compliant: true,
        currentHash: getCurrentHash(),
        metrics: getMetrics(),
        portsInitialized: Ports.isInitialized()
    };
}

export default {
    VERSION,
    MODULE_ID,
    init,
    navigateFallback,
    getCurrentHash,
    getMetrics,
    resetMetrics,
    healthCheck,
    info,
    injectPorts,
    getPorts
};
