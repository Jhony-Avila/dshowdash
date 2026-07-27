// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: adapters/notification-adapter
// PURPOSE: Adapter para integração com sistema de notificações/toast
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
// EXPORTS:
//   VERSION, MODULE_ID — Identificadores
//   NOTIFICATION_EVENTS — Eventos locais (não do catálogo global)
//   injectPorts, getPorts — Gestão de ports
//   connect — Conecta ao sistema de notificações
//   disconnect — Desconecta do sistema
//   show — Exibe notificação
//   clearAll — Limpa todas as notificações
//   isConnected — Verifica conexão
//   getToastRegion — Retorna região de toast
//   getMetrics — Retorna métricas
//   healthCheck — Diagnóstico de saúde
//   info — Informações do módulo
// EVENTS CONSUMED:
//   NOTIFICATION_EVENTS.SHOW, HIDE, COUNT_CHANGED
// EVENTS EMITTED:
//   NOTIFICATION_EVENTS.SHOW, CLEAR_ALL
// ═══════════════════════════════════════════════════════════════
/**
 * @module NotificationAdapter
 * @description Adapter para sistema de toast/notificações
 * @version 1.2.0-P18EC-AAA
 * @since 2025-02-02
 * @changelog
 *   v1.2.0-P18EC (2025-01) - Local NOTIFICATION_EVENTS
 *   v1.1.0-P17WI (2025-01) - PortsFactory Migration
 */
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.2.0-P18EC-AAA';
export const MODULE_ID = 'app-shell-notification-adapter';

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

// Eventos locais (não do catálogo global P18EC)
const NOTIFICATION_EVENTS = Object.freeze({
    SHOW: 'notification:show',
    HIDE: 'notification:hide',
    CLEAR_ALL: 'notification:clear-all',
    COUNT_CHANGED: 'notification:count-changed'
});

let _cleanups: DynObj[] = [];
let _connected = false;
let _toastRegion: DynObj = null;

const _metrics = {
    connects: 0,
    disconnects: 0,
    shows: 0,
    hides: 0,
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

/**
 * Conecta ao sistema de notificações
 * @param {string} toastRegionId - ID da região de toast
 * @param {Object} callbacks - Callbacks para eventos
 * @returns {boolean} Sucesso da conexão
 */
export function connect(toastRegionId: string, callbacks: DynObj) {
    if (!toastRegionId) toastRegionId = 'shell-toast-region';
    if (!callbacks) callbacks = {};
    if (_connected) return true;
    
    _toastRegion = document.getElementById(toastRegionId);
    
    const eventBus = _getPort('eventBus');
    if (!eventBus) {
        _trackEvent('no-eventbus');
        return false;
    }
    
    try {
        const showHandler = (data: DynObj) => {
            _metrics.shows++;
            if (callbacks.onShow) callbacks.onShow(data);
        };
        
        const hideHandler = (data: DynObj) => {
            _metrics.hides++;
            if (callbacks.onHide) callbacks.onHide(data);
        };
        
        const countHandler = (data: DynObj) => {
            if (callbacks.onCountChange) {
                callbacks.onCountChange((data && data.count) ? data.count : 0);
            }
        };
        
        eventBus.on(NOTIFICATION_EVENTS.SHOW, showHandler);
        eventBus.on(NOTIFICATION_EVENTS.HIDE, hideHandler);
        eventBus.on(NOTIFICATION_EVENTS.COUNT_CHANGED, countHandler);
        
        _cleanups = [
            () => { eventBus.off(NOTIFICATION_EVENTS.SHOW, showHandler); },
            () => { eventBus.off(NOTIFICATION_EVENTS.HIDE, hideHandler); },
            () => { eventBus.off(NOTIFICATION_EVENTS.COUNT_CHANGED, countHandler); }
        ];
        
        _connected = true;
        _metrics.connects++;
        _trackEvent('connected', { hasToastRegion: !!_toastRegion });
        return true;
    } catch (error: any) {
        _metrics.errors++;
        _trackEvent('connect-error', { error: error.message });
        return false;
    }
}

/**
 * Desconecta do sistema
 */
export function disconnect() {
    _cleanups.forEach(fn => {
        try { fn(); } catch (e) {}
    });
    _cleanups = [];
    _toastRegion = null;
    _connected = false;
    _metrics.disconnects++;
    _trackEvent('disconnected');
}

/**
 * Exibe uma notificação
 * @param {string} message - Mensagem
 * @param {string} type - Tipo (info, success, warning, error)
 * @param {Object} options - Opções adicionais
 * @returns {boolean} Sucesso
 */
export function show(message: string, type: DynObj, options: DynObj) {
    if (!type) type = 'info';
    if (!options) options = {};
    
    const toast = _getPort('toast');
    if (toast && toast.show) {
        return toast.show(message, type, options);
    }
    
    const eventBus = _getPort('eventBus');
    if (eventBus && eventBus.emit) {
        eventBus.emit(NOTIFICATION_EVENTS.SHOW, Object.assign({
            message,
            type,
            source: MODULE_ID
        }, options));
        return true;
    }
    
    return false;
}

/**
 * Limpa todas as notificações
 * @returns {boolean} Sucesso
 */
export function clearAll() {
    const toast = _getPort('toast');
    if (toast && toast.clearAll) {
        return toast.clearAll();
    }
    
    const eventBus = _getPort('eventBus');
    if (eventBus && eventBus.emit) {
        eventBus.emit(NOTIFICATION_EVENTS.CLEAR_ALL, { source: MODULE_ID });
        return true;
    }
    
    return false;
}

export function isConnected() {
    return _connected;
}

export function getToastRegion() {
    return _toastRegion;
}

export function getMetrics() {
    return Object.assign({}, _metrics);
}

export function healthCheck() {
    const ps = Ports.snapshot();
    const toast = _getPort('toast');
    
    const checks = {
        connected: _connected,
        hasToastRegion: !!_toastRegion,
        toastServiceExists: !!toast,
        portsInitialized: ps._initialized
    };
    
    const passed = Object.values(checks).filter(Boolean).length;
    const status = passed >= 2 ? 'HEALTHY' : (passed >= 1 ? 'DEGRADED' : 'UNHEALTHY');
    
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
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        connected: _connected,
        hasToastRegion: !!_toastRegion,
        events: NOTIFICATION_EVENTS,
        portsInitialized: ps._initialized,
        metrics: getMetrics(),
        timestamp: Date.now()
    };
}

export default {
    connect,
    disconnect,
    show,
    clearAll,
    isConnected,
    getToastRegion,
    getMetrics,
    healthCheck,
    info,
    NOTIFICATION_EVENTS,
    VERSION,
    MODULE_ID,
    injectPorts,
    getPorts
};
