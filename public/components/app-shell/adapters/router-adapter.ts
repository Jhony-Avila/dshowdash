// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.8.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: adapters/router-adapter
// PURPOSE: Adapter para integração com sistema de rotas
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   ROUTER_EVENTS from /core/runtime/events/index.js
// EXPORTS:
//   VERSION, MODULE_ID — Identificadores
//   injectPorts, getPorts — Gestão de ports
//   connect — Conecta ao sistema de rotas
//   disconnect — Desconecta do sistema
//   navigate — Navega para uma rota
//   getCurrentRoute — Retorna rota atual
//   isConnected — Verifica conexão
//   getMetrics — Retorna métricas
//   healthCheck — Diagnóstico de saúde
//   info — Informações do módulo
// EVENTS CONSUMED:
//   ROUTER_EVENTS.ROUTE_CHANGED, ROUTER_EVENTS.READY
// EVENTS EMITTED:
//   ROUTER_EVENTS.NAVIGATE (via navigate)
// ═══════════════════════════════════════════════════════════════
/**
 * @module RouterAdapter
 * @description Adapter para sistema de rotas com PortsFactory
 * @version 1.8.0-P18EC-AAA
 * @since 2025-02-02
 * @changelog
 *   v1.8.0-P18EC (2025-01) - Events Contracts Migration
 *   v1.7.0-P17WI (2025-01) - PortsFactory Migration
 */
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.8.0-P18EC-AAA';
export const MODULE_ID = 'app-shell-router-adapter';

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

let _cleanups: DynObj[] = [];
let _connected = false;
let _currentRoute: DynObj = null;

const _metrics = {
    connects: 0,
    disconnects: 0,
    navigations: 0,
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

function _getPathname() {
    if (typeof window !== 'undefined' && window.location) {
        return window.location.pathname;
    }
    return '/';
}

/**
 * Conecta ao sistema de rotas
 * @param {Object} callbacks - Callbacks para eventos
 * @returns {boolean} Sucesso da conexão
 */
export function connect(callbacks: DynObj) {
    if (!callbacks) callbacks = {};
    if (_connected) return true;
    
    const eventBus = _getPort('eventBus');
    if (!eventBus) {
        _metrics.errors++;
        _trackEvent('no-eventbus');
        return false;
    }
    
    try {
        const navHandler = (data: DynObj) => {
            _currentRoute = (data && (data.route || data.path)) 
                ? (data.route || data.path) 
                : _getPathname();
            _metrics.navigations++;
            _trackEvent('navigation', { route: _currentRoute });
            if (callbacks.onNavigate) callbacks.onNavigate(_currentRoute, data);
        };
        
        const readyHandler = (data: DynObj) => {
            _trackEvent('router-ready', { router: !!(data && data.router) });
            if (callbacks.onReady) callbacks.onReady(data);
        };
        
        eventBus.on(ROUTER_EVENTS.ROUTE_CHANGED, navHandler);
        eventBus.on(ROUTER_EVENTS.READY, readyHandler);
        
        _cleanups = [
            () => { eventBus.off(ROUTER_EVENTS.ROUTE_CHANGED, navHandler); },
            () => { eventBus.off(ROUTER_EVENTS.READY, readyHandler); }
        ];
        
        _currentRoute = _getPathname();
        _connected = true;
        _metrics.connects++;
        _trackEvent('connected', { initialRoute: _currentRoute });
        return true;
    } catch (error: any) {
        _metrics.errors++;
        _trackEvent('connect-error', { error: error.message });
        return false;
    }
}

/**
 * Desconecta do sistema de rotas
 */
export function disconnect() {
    _cleanups.forEach(fn => {
        try { fn(); } catch (e) {}
    });
    _cleanups = [];
    _connected = false;
    _metrics.disconnects++;
    _trackEvent('disconnected');
}

/**
 * Navega para uma rota
 * @param {string} path - Caminho da rota
 * @param {Object} options - Opções de navegação
 * @returns {boolean} Sucesso
 */
export function navigate(path: DynObj, options: DynObj) {
    if (!options) options = {};
    
    const routerGlobal = _getPort('router');
    if (routerGlobal && routerGlobal.navigate) {
        routerGlobal.navigate(path, options);
        return true;
    }
    
    const eventBus = _getPort('eventBus');
    if (eventBus && eventBus.emit) {
        eventBus.emit(ROUTER_EVENTS.NAVIGATE, Object.assign({ 
            path, 
            source: MODULE_ID 
        }, options));
        return true;
    }
    
    return false;
}

/**
 * Retorna a rota atual
 * @returns {string|null}
 */
export function getCurrentRoute() {
    return _currentRoute || _getPathname();
}

/**
 * Verifica se está conectado
 * @returns {boolean}
 */
export function isConnected() {
    return _connected;
}

/**
 * Retorna métricas de uso
 * @returns {Object}
 */
export function getMetrics() {
    return Object.assign({}, _metrics);
}

/**
 * Diagnóstico de saúde
 * @returns {Object}
 */
export function healthCheck() {
    const ps = Ports.snapshot();
    const routerGlobal = _getPort('router');
    
    const checks = {
        connected: _connected,
        hasRoute: !!_currentRoute,
        routerExists: !!routerGlobal,
        portsInitialized: ps._initialized
    };
    
    const passed = Object.values(checks).filter(Boolean).length;
    const status = passed === 4 ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY');
    
    return {
        status,
        score: `${passed}/4`,
        checks,
        currentRoute: _currentRoute,
        metrics: getMetrics(),
        version: VERSION,
        moduleId: MODULE_ID,
        portsInitialized: ps._initialized,
        timestamp: Date.now()
    };
}

/**
 * Informações do módulo
 * @returns {Object}
 */
export function info() {
    const ps = Ports.snapshot();
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        connected: _connected,
        currentRoute: _currentRoute,
        routerEvents: Object.keys(ROUTER_EVENTS),
        portsInitialized: ps._initialized,
        metrics: getMetrics(),
        timestamp: Date.now()
    };
}

export default {
    connect,
    disconnect,
    navigate,
    getCurrentRoute,
    isConnected,
    getMetrics,
    healthCheck,
    info,
    VERSION,
    MODULE_ID,
    injectPorts,
    getPorts
};
