// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.3.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: adapters/layout-adapter
// PURPOSE: Adapter para mudanças de layout baseadas em rota
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   ROUTER_EVENTS from /core/runtime/events/index.js
// EXPORTS:
//   VERSION, MODULE_ID — Identificadores
//   injectPorts, getPorts — Gestão de ports
//   connect — Conecta ao EventBus
//   disconnect — Desconecta do sistema
//   requestLayout — Solicita mudança de layout
//   isConnected — Verifica conexão
//   getMetrics — Retorna métricas
//   getLayoutEvents — Retorna eventos de layout
//   healthCheck — Diagnóstico de saúde
//   info — Informações do módulo
// EVENTS CONSUMED: ROUTER_EVENTS.LAYOUT_CHANGED
// EVENTS EMITTED: LAYOUT_EVENTS.REQUEST, LAYOUT_EVENTS.FULLSCREEN_REQUEST
// ═══════════════════════════════════════════════════════════════
/**
 * @module LayoutAdapter
 * @description Adapter para layout responsivo baseado em rota
 * @version 1.3.0-P18EC-AAA
 * @since 2025-02-02
 * @changelog
 *   v1.3.0-P18EC - Migrated ROUTER_EVENTS to central catalog
 *   v1.2.0-P17WI - PortsFactory Migration
 */
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.3.0-P18EC-AAA';
export const MODULE_ID = 'app-shell-layout-adapter';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _getPort(name: string) {
    return Ports.get(name);
}

export function injectPorts(p: DynObj) {
    return Ports.inject(p);
}

export function getPorts() {
    return Ports.snapshot();
}

const LAYOUT_EVENTS = Object.freeze({
    REQUEST: 'layout:request',
    FULLSCREEN_REQUEST: 'layout:fullscreen:request'
});

let _cleanup: DynObj = null;
let _connected = false;

const _metrics = {
    connects: 0,
    disconnects: 0,
    layoutChanges: 0,
    requestsEmitted: 0,
    errors: 0
};

function _trackEvent(event: string, data?: DynObj) {
    if (!data) data = {};
    try {
        const telemetry = _getPort('telemetry');
        if (telemetry && telemetry.event) {
            telemetry.event(`${MODULE_ID}:${event}`, data);
        }
    } catch (e) {
        // Silently ignore
    }
}

function _emitLayoutRequest(mode: DynObj, options: DynObj) {
    if (!options) options = {};
    const eventBus = _getPort('eventBus');
    if (!eventBus || !eventBus.emit) {
        _trackEvent('emit-failed-no-eventbus', { mode });
        return false;
    }
    eventBus.emit(LAYOUT_EVENTS.REQUEST, Object.assign({
        mode,
        source: MODULE_ID,
        timestamp: Date.now()
    }, options));
    _metrics.requestsEmitted++;
    _trackEvent('request-emitted', { mode, options });
    return true;
}

function _getRegionElement(selectors: DynObj) {
    for (let i = 0; i < selectors.length; i++) {
        const el = document.querySelector(selectors[i]);
        if (el) return el;
    }
    return null;
}

/**
 * Conecta ao EventBus para mudanças de layout
 * @param {Object} callbacks - Callbacks { onFullscreen, onDefault }
 * @returns {boolean} Sucesso
 */
export function connect(callbacks: DynObj) {
    if (!callbacks) callbacks = {};
    if (_connected) return true;
    
    const eventBus = _getPort('eventBus');
    if (!eventBus) {
        _trackEvent('no-eventbus');
        return false;
    }
    
    try {
        const handler = (data: DynObj) => {
            const hideNav = data && data.hideNav === true;
            const route = data ? data.route : null;
            
            const sidebar = _getRegionElement([
                '.dsd-sidebar', '.app-sidebar', '#sidebar',
                '#shell-sidebar-region', '[data-region="sidebar"]',
                '[data-shell-region="sidebar"]'
            ]);
            const header = _getRegionElement([
                '.dsd-header', '.app-header', '#shell-header-region',
                '[data-region="header"]', '[data-shell-region="header"]'
            ]);
            const main = _getRegionElement([
                '.dsd-main', '.app-main', '#shell-main-region',
                '[data-region="main"]', '[data-shell-region="main"]'
            ]);
            
            _metrics.layoutChanges++;
            
            if (hideNav) {
                if (sidebar) sidebar.classList.add('hidden');
                if (header) header.classList.add('hidden');
                if (main) main.classList.add('full-screen-mode');
                _emitLayoutRequest('fullscreen', { route, hideNav: true });
                if (callbacks.onFullscreen) callbacks.onFullscreen(route, main);
            } else {
                if (sidebar) sidebar.classList.remove('hidden');
                if (header) header.classList.remove('hidden');
                if (main) main.classList.remove('full-screen-mode');
                _emitLayoutRequest('default', { route, hideNav: false });
                if (callbacks.onDefault) callbacks.onDefault(route, main);
            }
        };
        
        eventBus.on(ROUTER_EVENTS.LAYOUT_CHANGED, handler);
        _cleanup = () => {
            eventBus.off(ROUTER_EVENTS.LAYOUT_CHANGED, handler);
        };
        
        _connected = true;
        _metrics.connects++;
        _trackEvent('connected');
        return true;
    } catch (error: any) {
        _metrics.errors++;
        _trackEvent('connect-error', { error: error.message });
        return false;
    }
}

export function disconnect() {
    if (_cleanup) {
        _cleanup();
        _cleanup = null;
    }
    _connected = false;
    _metrics.disconnects++;
    _trackEvent('disconnected');
}

export function requestLayout(mode: DynObj, options: DynObj) {
    return _emitLayoutRequest(mode, options);
}

export function isConnected() {
    return _connected;
}

export function getMetrics() {
    return Object.assign({}, _metrics);
}

export function getLayoutEvents() {
    return Object.assign({}, LAYOUT_EVENTS);
}

export function healthCheck() {
    const ps = Ports.snapshot();
    const eventBus = _getPort('eventBus');
    const layoutManager = _getPort('layoutManager');
    
    const checks = {
        eventBusExists: !!eventBus,
        connected: _connected,
        layoutManagerExists: !!layoutManager,
        portsInitialized: ps._initialized
    };
    
    const passed = Object.values(checks).filter(Boolean).length;
    const status = passed === 4 ? 'HEALTHY' : (passed >= 1 ? 'DEGRADED' : 'UNHEALTHY');
    
    return {
        status,
        score: `${passed}/4`,
        checks,
        metrics: getMetrics(),
        version: VERSION,
        moduleId: MODULE_ID,
        portsInitialized: ps._initialized,
        timestamp: Date.now()
    };
}

export function info() {
    const ps = Ports.snapshot();
    const layoutManager = _getPort('layoutManager');
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        connected: _connected,
        hasLayoutManager: !!layoutManager,
        layoutEvents: LAYOUT_EVENTS,
        portsInitialized: ps._initialized,
        metrics: getMetrics(),
        timestamp: Date.now()
    };
}

export default {
    connect,
    disconnect,
    requestLayout,
    isConnected,
    getMetrics,
    getLayoutEvents,
    healthCheck,
    info,
    VERSION,
    MODULE_ID,
    injectPorts,
    getPorts
};
