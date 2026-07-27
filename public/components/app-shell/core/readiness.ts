// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v4.2.1-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core/readiness
// PURPOSE: Sistema de readiness com callbacks e promises
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   getState, isReady, subscribe, setPhase, getBootTime, SHELL_PHASES from ../state/store.js
// EXPORTS:
//   VERSION, MODULE_ID — Identificadores
//   injectPorts, getPorts — Gestão de ports
//   onReady — Registra callback para quando ready
//   waitForReady — Promise que resolve quando ready
//   markShellMounted — Marca shell como mounted
//   markShellReady — Marca shell como ready
//   resetReadiness — Reset do estado
//   getPendingListeners — Retorna count de pending
//   getReadinessInfo — Retorna info completa
//   healthCheck — Diagnóstico de saúde
//   info — Informações do módulo
// NOTE: Este módulo é DERIVAÇÃO do Store
// ═══════════════════════════════════════════════════════════════
/**
 * @module AppShellReadiness
 * @description Sistema de readiness do App Shell
 * @version 4.2.1-ENTERPRISE-AAA
 * @since 2024-01
 * @changelog
 *   v4.2.1-ENTERPRISE - ES5 conversion
 *   v4.1.0-P17WI - PortsFactory Migration
 */
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { getState, isReady, subscribe, setPhase, getBootTime, SHELL_PHASES } from '../state/store.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.2.1-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell-readiness';

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

let _pendingCallbacks: DynObj[] = [];
let _notifiedCount = 0;
let _storeUnsubscribe: DynObj = null;

const _metrics = {
    callbacksRegistered: 0,
    callbacksExecuted: 0,
    timeouts: 0,
    errors: 0
};

function _trackEvent(event: string, data?: DynObj) {
    if (!data) data = {};
    Ports.init();
    try {
        const telemetry = _getPort('telemetry');
        if (telemetry && telemetry.event) {
            telemetry.event(`${MODULE_ID}:${event}`, data);
        }
    } catch (e) {
        // Silently ignore
    }
}

function _isValidCallback(fn: DynObj) {
    if (typeof fn !== 'function') return false;
    const fnStr = fn.toString();
    if (fnStr.indexOf('eval(') !== -1 || fnStr.indexOf('Function(') !== -1) return false;
    return true;
}

function _safeCall(fn: DynObj, data?: DynObj) {
    const args = Array.prototype.slice.call(arguments, 1);
    try {
        return fn.apply(null, args);
    } catch (e) {
        _metrics.errors++;
        return null;
    }
}

function _notifyPending() {
    if (_pendingCallbacks.length === 0) return;
    
    const state = getState();
    const callbacks = _pendingCallbacks.splice(0);
    
    for (let i = 0; i < callbacks.length; i++) {
        _safeCall(callbacks[i], state);
        _metrics.callbacksExecuted++;
    }
    
    _notifiedCount++;
    _trackEvent('pending-notified', {
        count: callbacks.length,
        notifiedCount: _notifiedCount,
        bootTime: getBootTime()
    });
}

function _ensureStoreSubscription() {
    if (_storeUnsubscribe) return;
    
    _storeUnsubscribe = subscribe((state: DynObj) => {
        if (state.ready && _pendingCallbacks.length > 0) {
            _notifyPending();
        }
    });
}

/**
 * Registra callback para quando shell estiver ready
 * @param {Function} callback - Callback a executar
 * @returns {Function} Função de cleanup
 */
export function onReady(callback: DynObj) {
    if (!_isValidCallback(callback)) {
        _metrics.errors++;
        return () => {};
    }
    
    _metrics.callbacksRegistered++;
    
    if (isReady()) {
        _safeCall(callback, getState());
        _metrics.callbacksExecuted++;
        return () => {};
    }
    
    _pendingCallbacks.push(callback);
    _ensureStoreSubscription();
    
    return function unsubscribeOnReady() {
        const idx = _pendingCallbacks.indexOf(callback);
        if (idx >= 0) _pendingCallbacks.splice(idx, 1);
    };
}

/**
 * Promise que resolve quando shell estiver ready
 * @param {number} timeout - Timeout em ms (default: 10000)
 * @returns {Promise<Object>} Estado do shell
 */
export function waitForReady(timeout: number) {
    if (timeout === undefined) timeout = 10000;
    
    return new Promise((resolve, reject) => {
        if (isReady()) {
            resolve(getState());
            return;
        }
        
        let settled = false;
        let timer: DynObj = null;
        
        const cleanup = onReady((state: DynObj) => {
            if (settled) return;
            settled = true;
            if (timer) clearTimeout(timer);
            resolve(state);
        });
        
        timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            cleanup();
            _metrics.timeouts++;
            _trackEvent('timeout', { timeout, pending: _pendingCallbacks.length });
            reject(new Error(`Shell ready timeout after ${timeout}ms`));
        }, timeout);
    });
}

export function markShellMounted() {
    setPhase(SHELL_PHASES.MOUNTED);
}

export function markShellReady() {
    setPhase(SHELL_PHASES.READY);
    _notifyPending();
}

export function resetReadiness() {
    _pendingCallbacks = [];
    _notifiedCount = 0;
    if (_storeUnsubscribe) {
        _storeUnsubscribe();
        _storeUnsubscribe = null;
    }
    _trackEvent('reset');
}

export function getPendingListeners() {
    return _pendingCallbacks.length;
}

export function getReadinessInfo() {
    const ps = Ports.snapshot();
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        isReady: isReady(),
        pendingCallbacks: _pendingCallbacks.length,
        notifiedCount: _notifiedCount,
        hasStoreSubscription: !!_storeUnsubscribe,
        bootTime: getBootTime(),
        metrics: Object.assign({}, _metrics),
        portsStatus: { initialized: ps._initialized },
        note: 'Este módulo é DERIVAÇÃO do Store',
        timestamp: Date.now()
    };
}

export function healthCheck() {
    const ps = Ports.snapshot();
    const ready = isReady();
    
    const checks = {
        storeAccessible: true,
        noPendingIfReady: !ready || _pendingCallbacks.length === 0,
        lowErrorRate: _metrics.callbacksRegistered === 0 || (_metrics.errors / _metrics.callbacksRegistered) < 0.1,
        lowTimeoutRate: _metrics.callbacksRegistered === 0 || (_metrics.timeouts / _metrics.callbacksRegistered) < 0.1,
        portsInitialized: ps._initialized
    };
    
    const checkKeys = Object.keys(checks);
    let passed = 0;
    for (let i = 0; i < checkKeys.length; i++) {
        if ((checks as DynObj)[checkKeys[i]]) passed++;
    }
    const total = checkKeys.length;
    
    return {
        status: passed === total ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'),
        score: `${passed}/${total}`,
        checks,
        isReady: ready,
        pendingCallbacks: _pendingCallbacks.length,
        bootTime: getBootTime(),
        metrics: Object.assign({}, _metrics),
        version: VERSION,
        moduleId: MODULE_ID,
        timestamp: Date.now()
    };
}

export function info() {
    return getReadinessInfo();
}

export default {
    onReady,
    waitForReady,
    markShellMounted,
    markShellReady,
    resetReadiness,
    getPendingListeners,
    getReadinessInfo,
    healthCheck,
    info,
    injectPorts,
    getPorts,
    VERSION,
    MODULE_ID
};
