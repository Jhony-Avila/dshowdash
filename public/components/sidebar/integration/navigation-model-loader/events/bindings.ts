// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: bindings
// PURPOSE: navigation-model-loader/events/bindings.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   EVENTS from ../core/contracts.js
//   MODULE_ID from ../core/constants.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   emit() — exported function
//   on() — exported function
//   emitLoadStart() — exported function
//   emitLoadSuccess() — exported function
//   emitLoadError — exported value
//   emitLoadFallback — exported value
//   emitModelReady — exported value
//   emitCacheHit — exported value
//   emitCacheMiss() — exported function
//   emitCacheInvalidate() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   event
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { EVENTS } from '../core/contracts.js';
import { MODULE_ID } from '../core/constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '2.4.0-ES6';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const getEventBus = () => {
    _initPorts();
    return _getPort('eventBus');
};

export const emit = (event: string, data?: DynObj) => {
    if (!data) data = {};
    const bus = getEventBus();
    if (!bus || !bus.emit) return false;
    try {
        bus.emit(event, Object.assign({
            source: MODULE_ID,
            timestamp: Date.now()
        }, data));
        return true;
    } catch (e) {
        return false;
    }
};

export const on = (event: string, handler: DynObj) => {
    const bus = getEventBus();
    if (!bus || !bus.on) return () => {};
    try {
        bus.on(event, handler);
        return () => { if (bus.off) bus.off(event, handler); };
    } catch (e) {
        return () => {};
    }
};

export const emitLoadStart = () => emit(EVENTS.LOAD_START);
export const emitLoadSuccess = (model: DynObj, source: DynObj) => emit(EVENTS.LOAD_SUCCESS, { model, source });
export const emitLoadError = (error: Error) => emit(EVENTS.LOAD_ERROR, { error });
export const emitLoadFallback = (reason: string) => emit(EVENTS.LOAD_FALLBACK, { reason });
export const emitModelReady = (model: DynObj) => emit(EVENTS.MODEL_READY, { model });
export const emitCacheHit = (source: DynObj) => emit(EVENTS.CACHE_HIT, { source });
export const emitCacheMiss = () => emit(EVENTS.CACHE_MISS);
export const emitCacheInvalidate = () => emit(EVENTS.CACHE_INVALIDATE);

export function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        p03PortsOnly: true,
        portsInitialized: Ports.isInitialized()
    };
}

export function healthCheck() {
    const hasEventBus = !!getEventBus();
    return {
        status: hasEventBus ? 'HEALTHY' : 'DEGRADED',
        version: VERSION,
        moduleId: MODULE_ID,
        p03PortsOnly: true,
        checks: { hasEventBus, portsInitialized: Ports.isInitialized() }
    };
}

export default { emit, on, emitLoadStart, emitLoadSuccess, emitLoadError, emitLoadFallback, emitModelReady, emitCacheHit, emitCacheMiss, emitCacheInvalidate, info, healthCheck, injectPorts, getPorts, VERSION };
