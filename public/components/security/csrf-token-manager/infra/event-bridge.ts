// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: security.csrf-token-manager.infra.event-bridge
// PURPOSE: CSRF Token Manager - Event Bridge v2.4.0-P18EC
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   SECURITY_EVENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   on() — exported function
//   off() — exported function
//   emit() — exported function
//   connectEventBus() — exported function
//   disconnectEventBus() — exported function
//   connectGlobalState() — exported function
//   disconnectGlobalState() — exported function
//   cleanup() — exported function
//   getBridgeInfo() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   event
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { SECURITY_EVENTS } from '/core/runtime/events/catalog/security.events.js';
const VERSION = '2.4.0-P18EC';
const MODULE_ID = 'security.csrf-token-manager.infra.event-bridge';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }
let _listeners: Array<{ event: string; handler: (...args: unknown[]) => void }> = [];
let _eventBusConnected = false;
let _globalStateConnected = false;
let _subscriptions: Array<() => void> = [];
function on(event: string, handler: (...args: unknown[]) => void) { const eb = _getPort('eventBus'); if (eb && eb.on) eb.on(event, handler); _listeners.push({ event, handler }); }
function off(event: string, handler: (...args: unknown[]) => void) { const eb = _getPort('eventBus'); if (eb && eb.off) eb.off(event, handler); _listeners = _listeners.filter(l => !(l.event === event && l.handler === handler)); }
function emit(event: string, data: unknown) { const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(event, data); }
function connectEventBus(eventBus: Record<string, unknown>) { if (_eventBusConnected) return true; if (eventBus) Ports.inject({ eventBus }); const eb = _getPort('eventBus'); if (eb) { _eventBusConnected = true; return true; } return false; }
function disconnectEventBus() { if (!_eventBusConnected) return true; const eb = _getPort('eventBus'); _listeners.forEach(item => { if (eb && eb.off) eb.off(item.event, item.handler); }); _listeners = []; _eventBusConnected = false; return true; }
function connectGlobalState(globalState: Record<string, unknown>) { if (_globalStateConnected) return true; if (globalState) Ports.inject({ globalState }); const gs = _getPort('globalState'); if (gs) { _globalStateConnected = true; if (typeof gs.subscribe === 'function') { const unsubscribe = gs.subscribe((state: Record<string, unknown>) => { if (state && state.session) { emit(SECURITY_EVENTS.SESSION_CHANGED, { session: state.session }); } }); _subscriptions.push(unsubscribe); } return true; } return false; }
function disconnectGlobalState() { if (!_globalStateConnected) return true; _subscriptions.forEach(unsub => { if (typeof unsub === 'function') unsub(); }); _subscriptions = []; _globalStateConnected = false; return true; }
function cleanup() { disconnectEventBus(); disconnectGlobalState(); }
function getBridgeInfo() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), eventBusConnected: _eventBusConnected, globalStateConnected: _globalStateConnected, hasEventBus: !!_getPort('eventBus'), hasGlobalState: !!_getPort('globalState'), listenerCount: _listeners.length, subscriptionCount: _subscriptions.length, timestamp: Date.now() }; }
function healthCheck() { const checks = { eventBusAvailable: !!_getPort('eventBus'), eventBusConnected: _eventBusConnected, globalStateAvailable: !!_getPort('globalState'), globalStateConnected: _globalStateConnected, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; const status = passed >= 3 ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'; return { status, score: `${passed}/${total}`, checks, portsInitialized: Ports.isInitialized(), listenerCount: _listeners.length, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), eventBusConnected: _eventBusConnected, globalStateConnected: _globalStateConnected, listenerCount: _listeners.length, timestamp: Date.now() }; }
export { VERSION, MODULE_ID, on, off, emit, connectEventBus, disconnectEventBus, connectGlobalState, disconnectGlobalState, cleanup, getBridgeInfo, healthCheck, info, injectPorts, getPorts };
export default { on, off, emit, connectEventBus, disconnectEventBus, connectGlobalState, disconnectGlobalState, cleanup, getBridgeInfo, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
