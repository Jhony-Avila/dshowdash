// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-header-admin
// PURPOSE: Panel Header Admin - Telemetry Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createTelemetryPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   tracker — exported value
//   TRACKER_EVENTS — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventKey
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createTelemetryPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-header-admin';

// P18EC: Local event constants
const TRACKER_EVENTS = Object.freeze({
    INIT: `${MODULE_ID}:init`,
    INIT_COMPLETE: `${MODULE_ID}:init:complete`,
    MOUNTED: `${MODULE_ID}:mounted`,
    UNMOUNTED: `${MODULE_ID}:unmounted`,
    LOAD_START: `${MODULE_ID}:load:start`,
    LOAD_SUCCESS: `${MODULE_ID}:load:success`,
    LOAD_ERROR: `${MODULE_ID}:load:error`,
    SAVE: `${MODULE_ID}:save`,
    DELETE: `${MODULE_ID}:delete`,
    TOGGLE: `${MODULE_ID}:toggle`,
    ACCESS_DENIED: `${MODULE_ID}:access:denied`
});

const Ports = createTelemetryPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: unknown) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

function emit(eventKey: string, data: Record<string, unknown> = {}) { _initPorts(); const eventBus = _getPort('eventBus'); if (eventBus?.emit) eventBus.emit(eventKey, Object.assign({}, data, { timestamp: Date.now() })); }

const tracker = {
    trackInit: () => emit(TRACKER_EVENTS.INIT),
    trackInitComplete: () => emit(TRACKER_EVENTS.INIT_COMPLETE),
    trackMounted: () => emit(TRACKER_EVENTS.MOUNTED),
    trackUnmounted: () => emit(TRACKER_EVENTS.UNMOUNTED),
    trackLoadStart: () => emit(TRACKER_EVENTS.LOAD_START),
    trackLoadSuccess: (data: Record<string, unknown>) => emit(TRACKER_EVENTS.LOAD_SUCCESS, data),
    trackLoadError: (error: Error) => emit(TRACKER_EVENTS.LOAD_ERROR, { error: error.message }),
    trackSave: (type: string, data: Record<string, unknown>) => emit(TRACKER_EVENTS.SAVE, Object.assign({ type }, data)),
    trackDelete: (type: string, id: string | number) => emit(TRACKER_EVENTS.DELETE, { type, id }),
    trackToggle: (id: string | number, active: boolean) => emit(TRACKER_EVENTS.TOGGLE, { id, active }),
    trackAccessDenied: (action: string) => emit(TRACKER_EVENTS.ACCESS_DENIED, { action })
};

function info() { const ps = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, portsInitialized: ps._initialized }; }
function healthCheck() { const ps = Ports.snapshot(); return { status: ps._initialized ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: ps._initialized, checks: { trackerReady: true, portsInitialized: ps._initialized } }; }

export { tracker, TRACKER_EVENTS, VERSION, MODULE_ID, info, healthCheck, injectPorts, getPorts };
export default tracker;
