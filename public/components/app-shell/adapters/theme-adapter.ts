// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.3.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: adapters/theme-adapter
// PURPOSE: Adapter para integração com sistema de temas
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   THEME_EVENTS from /core/runtime/events/index.js
// EXPORTS:
//   VERSION, MODULE_ID — Identificadores
//   injectPorts, getPorts — Gestão de ports
//   connect — Conecta ao sistema de temas
//   disconnect — Desconecta do sistema
//   getCurrentTheme — Retorna tema atual
//   setTheme — Define novo tema
//   isConnected — Verifica conexão
//   getMetrics — Retorna métricas
//   healthCheck — Diagnóstico de saúde
//   info — Informações do módulo
// EVENTS CONSUMED:
//   THEME_EVENTS.CHANGED, THEME_EVENTS.APPLIED
// EVENTS EMITTED:
//   THEME_EVENTS.REQUEST (via setTheme)
// ═══════════════════════════════════════════════════════════════
/**
 * @module ThemeAdapter
 * @description Adapter para sistema de temas com PortsFactory
 * @version 1.3.0-P18EC-AAA
 * @since 2025-02-02
 * @changelog
 *   v1.3.0-P18EC (2025-01) - Events Contracts Migration
 *   v1.2.0-P17WI (2025-01) - PortsFactory Migration
 */
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { THEME_EVENTS } from '/core/runtime/events/catalog/theme.events.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.3.0-P18EC-AAA';
export const MODULE_ID = 'app-shell-theme-adapter';

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

let _cleanup: DynObj = null;
let _connected = false;
let _currentTheme: DynObj = null;

const _metrics = {
    connects: 0,
    disconnects: 0,
    themeChanges: 0,
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
        // Silently ignore telemetry errors
    }
}

/**
 * Conecta ao sistema de temas
 * @param {Object} callbacks - Callbacks para eventos
 * @returns {boolean} Sucesso da conexão
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
            _currentTheme = (data && data.theme) ? data.theme : data;
            _metrics.themeChanges++;
            _trackEvent('theme-changed', { theme: _currentTheme });
            if (callbacks.onThemeChange) callbacks.onThemeChange(_currentTheme);
        };
        
        eventBus.on(THEME_EVENTS.CHANGED, handler);
        eventBus.on(THEME_EVENTS.APPLIED, handler);
        
        _cleanup = () => {
            eventBus.off(THEME_EVENTS.CHANGED, handler);
            eventBus.off(THEME_EVENTS.APPLIED, handler);
        };
        
        // Obtém tema inicial
        const themeManager = _getPort('themeManager');
        _currentTheme = (themeManager && themeManager.getCurrentTheme) 
            ? themeManager.getCurrentTheme() 
            : (document.documentElement.dataset.theme || 'dark');
        
        _connected = true;
        _metrics.connects++;
        _trackEvent('connected', { initialTheme: _currentTheme });
        return true;
    } catch (error: any) {
        _metrics.errors++;
        _trackEvent('connect-error', { error: error.message });
        return false;
    }
}

/**
 * Desconecta do sistema de temas
 */
export function disconnect() {
    if (_cleanup) {
        _cleanup();
        _cleanup = null;
    }
    _connected = false;
    _metrics.disconnects++;
    _trackEvent('disconnected');
}

/**
 * Retorna o tema atual
 * @returns {string|null} Nome do tema
 */
export function getCurrentTheme() {
    return _currentTheme;
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
 * Define um novo tema
 * @param {string} theme - Nome do tema
 * @returns {boolean} Sucesso
 */
export function setTheme(theme: DynObj) {
    const themeManager = _getPort('themeManager');
    if (themeManager && themeManager.setTheme) {
        themeManager.setTheme(theme);
        return true;
    }
    
    const eventBus = _getPort('eventBus');
    if (eventBus && eventBus.emit) {
        eventBus.emit(THEME_EVENTS.REQUEST, { theme, source: MODULE_ID });
        return true;
    }
    
    return false;
}

/**
 * Diagnóstico de saúde do módulo
 * @returns {Object} Relatório de saúde
 */
export function healthCheck() {
    const ps = Ports.snapshot();
    const themeManager = _getPort('themeManager');
    
    const checks = {
        connected: _connected,
        hasTheme: !!_currentTheme,
        themeManagerExists: !!themeManager,
        portsInitialized: ps._initialized
    };
    
    const passed = Object.values(checks).filter(Boolean).length;
    const status = passed >= 2 ? 'HEALTHY' : (passed >= 1 ? 'DEGRADED' : 'UNHEALTHY');
    
    return {
        status,
        score: `${passed}/4`,
        checks,
        currentTheme: _currentTheme,
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
        currentTheme: _currentTheme,
        portsInitialized: ps._initialized,
        metrics: getMetrics(),
        timestamp: Date.now()
    };
}

export default {
    connect,
    disconnect,
    getCurrentTheme,
    setTheme,
    isConnected,
    getMetrics,
    healthCheck,
    info,
    VERSION,
    MODULE_ID,
    injectPorts,
    getPorts
};
