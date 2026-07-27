// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: events
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   EVENTS — exported value
//   emit() — exported function
//   on() — exported function
//   off() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventName
// LISTENS (eventos):
//   eventName
// WINDOW ACCESS:
//   window.EventBus (fallback with recordViolation in non-strict mode)
// ═══════════════════════════════════════════════════════════════
// @changelog v1.3.0-STRICT-MODE - NR-FULL strict mode migration with recordViolation
// @changelog v1.2.0-P0-ENTERPRISE - Migrated to Ports pattern (no window.EventBus)
'use strict';
/**
 * Panel User Preferences - Events
 * @module panel-user-preferences/events
 * @version 1.3.0-STRICT-MODE
 */

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const MODULE_ID = 'panel-user-preferences.events';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
let _portsInitialized = false;

function _initPorts() {
    if (_portsInitialized) return;
    Ports.init();
    _portsInitialized = true;
}

function _getEventBus() {
    _initPorts();
    const bus = Ports.get('eventBus');
    if (bus) return bus;
    // Fallback via Core.windowAdapter
    if (window.Core?.windowAdapter?.get) {
        const wBus = window.Core.windowAdapter.get('EventBus');
        if (wBus) return wBus;
    }
    return null;
}

export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export const EVENTS = {
    PREFERENCE_CHANGED: 'user-preferences:changed',
    PREFERENCE_SAVED: 'user-preferences:saved',
    PREFERENCE_RESET: 'user-preferences:reset',
    THEME_CHANGED: 'user-preferences:theme-changed',
    LANGUAGE_CHANGED: 'user-preferences:language-changed',
    AVATAR_UPDATED: 'user-preferences:avatar-updated'
};

export function emit(eventName: string, data: Record<string, unknown> = {}) {
    const bus = _getEventBus();
    if (bus?.emit) {
        bus.emit(eventName, { ...data, source: MODULE_ID, timestamp: Date.now() });
    }
}

export function on(eventName: string, handler: (...args: unknown[]) => void) {
    const bus = _getEventBus();
    if (bus?.on) {
        bus.on(eventName, handler);
        return () => off(eventName, handler);
    }
    return () => {};
}

export function off(eventName: string, handler: (...args: unknown[]) => void) {
    const bus = _getEventBus();
    if (bus?.off) {
        bus.off(eventName, handler);
    }
}

export function info() {
    return { moduleId: MODULE_ID, version: VERSION, strictMode: isStrict(), p0Enterprise: true, portsInitialized: _portsInitialized };
}

export default { EVENTS, emit, on, off, injectPorts, getPorts, info, MODULE_ID, VERSION };
