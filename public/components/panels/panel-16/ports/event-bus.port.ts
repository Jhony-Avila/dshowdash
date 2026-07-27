// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: event-bus.port
// PURPOSE: Panel module - EventBus Port
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   setEventBus() — exported function
//   getEventBus() — exported function
//   emit() — exported function
//   on() — exported function
//   off() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   event
// WINDOW ACCESS:
//   window.EventBus (fallback with recordViolation in non-strict mode)
// ═══════════════════════════════════════════════════════════════
// @changelog v1.3.0-STRICT-MODE - NR-FULL strict mode migration with recordViolation
// @changelog v1.2.0-P0-ENTERPRISE - Migrated to Ports pattern (no window.EventBus fallback)
'use strict';
/**
 * Panel 16 - Event Bus Port
 * @module panel-16/ports/event-bus.port
 * @version 1.3.0-STRICT-MODE
 */

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const MODULE_ID = 'panel-16.ports.event-bus';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
let _injectedEventBus: Record<string, unknown> | null = null;

function _initPorts() {
    if (_portsInitialized) return;
    Ports.init();
    _portsInitialized = true;
}

function _getPortEventBus() {
    _initPorts();
    return Ports.get('eventBus');
}

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export function setEventBus(bus: Record<string, unknown>) {
    _injectedEventBus = bus;
}

export function getEventBus() {
    // 1. Injected EventBus (highest priority)
    if (_injectedEventBus) return _injectedEventBus;
    // 2. Ports-based EventBus
    const bus = _getPortEventBus();
    if (bus) return bus;
    // 3. Fallback via Core.windowAdapter
    if (window.Core?.windowAdapter?.get) {
        const wBus = window.Core.windowAdapter.get('EventBus');
        if (wBus) return wBus;
    }
    return null;
}

export function emit(event: string, data: Record<string, unknown>) {
    const bus = getEventBus();
    if (bus?.emit) {
        bus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
        return true;
    }
    return false;
}

export function on(event: string, handler: (data: unknown) => void) {
    const bus = getEventBus();
    if (bus?.on) {
        const cleanup = bus.on(event, handler);
        return typeof cleanup === 'function' ? cleanup : () => off(event, handler);
    }
    return () => {};
}

export function off(event: string, handler: (data: unknown) => void) {
    const bus = getEventBus();
    if (bus?.off) {
        bus.off(event, handler);
    }
}

export function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        strictMode: isStrict(),
        p0Enterprise: true,
        portsInitialized: _portsInitialized,
        hasInjectedEventBus: !!_injectedEventBus,
        hasPortEventBus: !!_getPortEventBus()
    };
}

export function healthCheck() {
    const hasEventBus = !!getEventBus();
    return {
        status: hasEventBus ? 'HEALTHY' : 'DEGRADED',
        moduleId: MODULE_ID,
        version: VERSION,
        strictMode: isStrict(),
        p0Enterprise: true,
        checks: {
            eventBusAvailable: hasEventBus,
            portsInitialized: _portsInitialized
        }
    };
}

export default { setEventBus, getEventBus, emit, on, off, injectPorts, getPorts, info, healthCheck, MODULE_ID, VERSION };

// Alias export — satisfies: import { EventBusPort } from './event-bus.port'
export const EventBusPort = { setEventBus, getEventBus, emit, on, off, injectPorts, getPorts, info, healthCheck, MODULE_ID, VERSION };
