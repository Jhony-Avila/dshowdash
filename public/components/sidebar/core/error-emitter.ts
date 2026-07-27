// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.9.0-P02-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-error-emitter
// PURPOSE: Sidebar Core - Error Emitter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   SIDEBAR_EVENTS from /core/runtime/events/catalog/sidebar.events.js
//   MODULE_ID as SIDEBAR_MODULE_ID from ./constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   setDependencies() — exported function
//   emitDegraded() — exported function
//   emitError() — exported function
//   getStatus() — exported function
//   setStatus() — exported function
//   getDegradedComponents() — exported function
//   getLastError() — exported function
//   resetErrorState() — exported function
//   isDegraded() — exported function
//   isError() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   SIDEBAR_EVENTS.DEGRADED
//   SIDEBAR_EVENTS.ERROR
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { MODULE_ID as SIDEBAR_MODULE_ID } from './constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '5.9.0-P02-UNIFIED-BUS';
export const MODULE_ID = 'sidebar-error-emitter';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _degradedComponents: DynObj[] = [];
let _lastError: Error | null = null;
let _status = 'idle';
let _logger: DynObj | null = null;
let _tracker: DynObj | null = null;
let _metrics = { degradedEmits: 0, errorEmits: 0, resets: 0, busSource: null as DynObj };

export function setDependencies(logger: DynObj, tracker: DynObj) {
    _logger = logger;
    _tracker = tracker;
}

// P0.2: Unified EventBus accessor - eventBus primary, eventBusGlobal fallback
function _getEventBus() {
    const bus = _getPort('eventBus') || _getPort('eventBusGlobal');
    if (bus) {
        _metrics.busSource = _getPort('eventBus') ? 'eventBus' : 'eventBusGlobal';
    }
    return bus;
}

export function emitDegraded(component: DynObj, error: Error) {
    _metrics.degradedEmits++;
    try {
        if (!_degradedComponents.includes(component)) {
            _degradedComponents.push(component);
        }
        _status = 'degraded';
        _lastError = error;

        const bus = _getEventBus();
        if (bus?.emit) {
            bus.emit(SIDEBAR_EVENTS.DEGRADED, {
                source: SIDEBAR_MODULE_ID,
                component,
                error,
                degradedComponents: _degradedComponents,
                timestamp: Date.now()
            });
        }

        _logger?.warn?.(`Component degraded: ${component}`, { error });
        _tracker?.trackError?.(error, { component, phase: 'degraded' });
    } catch {
        // emit silent
    }
}

export function emitError(error: Error, context = {}) {
    _metrics.errorEmits++;
    try {
        _status = 'error';
        _lastError = error;

        const bus = _getEventBus();
        if (bus?.emit) {
            bus.emit(SIDEBAR_EVENTS.ERROR, {
                source: SIDEBAR_MODULE_ID,
                error: error?.message || error,
                context,
                timestamp: Date.now()
            });
        }

        _logger?.error?.('Sidebar error:', { error, context });
        _tracker?.trackError?.(error, context);
    } catch {
        // emit silent
    }
}

export function getStatus() {
    return _status;
}

export function setStatus(status: string) {
    _status = status;
}

export function getDegradedComponents() {
    return [..._degradedComponents];
}

export function getLastError() {
    return _lastError;
}

export function resetErrorState() {
    _metrics.resets++;
    _degradedComponents = [];
    _lastError = null;
    _status = 'idle';
}

export function isDegraded() {
    return _status === 'degraded' || _degradedComponents.length > 0;
}

export function isError() {
    return _status === 'error';
}

export function getMetrics() {
    return {
        ..._metrics,
        degradedCount: _degradedComponents.length,
        currentStatus: _status,
        hasError: !!_lastError
    };
}

export function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        portsInitialized: Ports.isInitialized(),
        status: _status,
        degradedComponents: [..._degradedComponents],
        lastError: _lastError,
        metrics: getMetrics(),
        busSource: _metrics.busSource
    };
}

export function healthCheck() {
    const bus = _getEventBus();

    return {
        status: _status === 'error' ? 'ERROR' : _status === 'degraded' ? 'DEGRADED' : 'HEALTHY',
        version: VERSION,
        moduleId: MODULE_ID,
        portsInitialized: Ports.isInitialized(),
        checks: {
            currentStatus: _status,
            degradedCount: _degradedComponents.length,
            hasError: !!_lastError,
            hasEventBus: !!bus
        },
        metrics: getMetrics(),
        busSource: _metrics.busSource
    };
}

export default {
    setDependencies,
    emitDegraded,
    emitError,
    getStatus,
    setStatus,
    getDegradedComponents,
    getLastError,
    resetErrorState,
    isDegraded,
    isError,
    healthCheck,
    info,
    getMetrics,
    VERSION,
    MODULE_ID
};
