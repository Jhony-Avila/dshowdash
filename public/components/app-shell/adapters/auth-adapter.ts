// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.4.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: adapters/auth-adapter
// PURPOSE: Adapter para integração com sistema de autenticação
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   AUTH_EVENTS, AUTH_INTENTS, LOGIN_MODAL_EVENTS from /core/runtime/events/index.js
// EXPORTS:
//   VERSION, MODULE_ID — Identificadores
//   injectPorts, getPorts — Gestão de ports
//   connect — Conecta ao sistema de auth
//   disconnect — Desconecta do sistema
//   showLoginOverlay — Exibe overlay de login
//   hideLoginOverlay — Esconde overlay de login
//   isConnected — Verifica conexão
//   getMetrics — Retorna métricas
//   healthCheck — Diagnóstico de saúde
//   info — Informações do módulo
// EVENTS CONSUMED:
//   AUTH_INTENTS.LOGIN, AUTH_EVENTS.LOGIN_SUCCESS
//   LOGIN_MODAL_EVENTS.OPEN, LOGIN_MODAL_EVENTS.CLOSE
// ═══════════════════════════════════════════════════════════════
/**
 * @module AuthAdapter
 * @description Adapter para autenticação com retry automático
 * @version 1.4.0-P18EC-AAA
 * @since 2025-02-02
 * @changelog
 *   v1.4.0-P18EC (2025-01) - Fixed missing AUTH_INTENTS import
 */
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { AUTH_EVENTS, AUTH_INTENTS, LOGIN_MODAL_EVENTS } from '/core/runtime/events/catalog/auth.events.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.4.0-P18EC-AAA';
export const MODULE_ID = 'app-shell-auth-adapter';

const MAX_RETRIES = 5;
const RETRY_DELAY = 300;

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
let _retryCount = 0;
let _connected = false;
let _loginRegion: DynObj = null;

const _metrics = {
    connects: 0,
    disconnects: 0,
    loginShows: 0,
    loginHides: 0,
    errors: 0,
    retries: 0
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

function _showLogin() {
    if (_loginRegion) {
        _loginRegion.classList.add('login-active');
        _metrics.loginShows++;
    }
}

function _hideLogin() {
    if (_loginRegion) {
        _loginRegion.classList.remove('login-active');
        _metrics.loginHides++;
    }
}

/**
 * Conecta ao sistema de autenticação
 * @param {string} loginRegionId - ID da região de login
 * @returns {boolean} Sucesso da conexão
 */
export function connect(loginRegionId: string) {
    if (!loginRegionId) loginRegionId = 'shell-login-region';
    if (_connected) return true;
    
    _loginRegion = document.getElementById(loginRegionId);
    if (!_loginRegion) {
        _trackEvent('no-login-region', { regionId: loginRegionId });
        return false;
    }
    
    const eventBus = _getPort('eventBus');
    if (!eventBus || typeof eventBus.on !== 'function') {
        if (_retryCount < MAX_RETRIES) {
            _retryCount++;
            _metrics.retries++;
            const delay = RETRY_DELAY * _retryCount;
            _trackEvent('retry-scheduled', { attempt: _retryCount, delay });
            setTimeout(() => {
                connect(loginRegionId);
            }, delay);
            return false;
        }
        _metrics.errors++;
        _trackEvent('max-retries-reached', { attempts: _retryCount });
        return false;
    }
    
    try {
        const c1 = eventBus.on(AUTH_INTENTS.LOGIN, _showLogin);
        const c2 = eventBus.on(AUTH_EVENTS.LOGIN_SUCCESS, _hideLogin);
        const c3 = eventBus.on(LOGIN_MODAL_EVENTS.OPEN, _showLogin);
        const c4 = eventBus.on(LOGIN_MODAL_EVENTS.CLOSE, _hideLogin);
        
        if (typeof c1 === 'function') _cleanups.push(c1);
        if (typeof c2 === 'function') _cleanups.push(c2);
        if (typeof c3 === 'function') _cleanups.push(c3);
        if (typeof c4 === 'function') _cleanups.push(c4);
        
        _connected = true;
        _metrics.connects++;
        _trackEvent('connected', { listeners: _cleanups.length, retriesNeeded: _retryCount });
        return true;
    } catch (error: any) {
        _metrics.errors++;
        _trackEvent('connect-error', { error: error.message });
        return false;
    }
}

export function disconnect() {
    _cleanups.forEach(fn => {
        try { fn(); } catch (e) {}
    });
    _cleanups = [];
    _retryCount = 0;
    _connected = false;
    _loginRegion = null;
    _metrics.disconnects++;
    _trackEvent('disconnected');
}

export function showLoginOverlay() {
    _showLogin();
}

export function hideLoginOverlay() {
    _hideLogin();
}

export function isConnected() {
    return _connected;
}

export function getMetrics() {
    return Object.assign({}, _metrics);
}

export function healthCheck() {
    const ps = Ports.snapshot();
    const eventBus = _getPort('eventBus');
    
    const checks = {
        eventBusExists: !!eventBus,
        connected: _connected,
        hasLoginRegion: !!_loginRegion,
        noExcessiveRetries: _retryCount < MAX_RETRIES,
        portsInitialized: ps._initialized
    };
    
    const passed = Object.values(checks).filter(Boolean).length;
    const status = passed === 5 ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY');
    
    return {
        status,
        score: `${passed}/5`,
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
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        connected: _connected,
        hasLoginRegion: !!_loginRegion,
        listeners: _cleanups.length,
        retryCount: _retryCount,
        maxRetries: MAX_RETRIES,
        portsInitialized: ps._initialized,
        metrics: getMetrics(),
        timestamp: Date.now()
    };
}

export default {
    connect,
    disconnect,
    showLoginOverlay,
    hideLoginOverlay,
    isConnected,
    getMetrics,
    healthCheck,
    info,
    VERSION,
    MODULE_ID,
    injectPorts,
    getPorts
};
