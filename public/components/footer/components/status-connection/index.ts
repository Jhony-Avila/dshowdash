// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.3.0-P18EC-CATALOG)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.footer.status-connection
// PURPOSE: Footer - Status Connection
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   NETWORK_EVENTS from /core/runtime/events/catalog/network.events.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   STATES — exported value
//   CONNECTION_EVENTS — exported value
//   init() — exported function
//   cleanup() — exported function
//   checkConnection() — exported function
//   getStatus() — exported function
//   isOnline() — exported function
//   setLatency() — exported function
//   render() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   eventName
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { NETWORK_EVENTS } from '/core/runtime/events/catalog/network.events.js';

const MODULE_ID = 'components.footer.status-connection';
const VERSION = '2.3.0-P18EC-CATALOG';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const STATES = { ONLINE: 'online', OFFLINE: 'offline', SLOW: 'slow', UNKNOWN: 'unknown' };
const _state = { initialized: false, status: STATES.UNKNOWN, latency: (null as unknown|null) };
let _cleanup: unknown = null;
const _metrics = { checks: 0, offlineEvents: 0, onlineEvents: 0 };

function _emit(eventName: string, data: Record<string,unknown>) {
  const eb = _getPort('eventBus');
  if (eb && eb.emit) {
    eb.emit(eventName, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data || {}));
    return true;
  }
  return false;
}

function _handleOnline() {
  _state.status = STATES.ONLINE;
  _metrics.onlineEvents++;
  _emit(NETWORK_EVENTS.ONLINE, { status: STATES.ONLINE });
}

function _handleOffline() {
  _state.status = STATES.OFFLINE;
  _metrics.offlineEvents++;
  _emit(NETWORK_EVENTS.OFFLINE, { status: STATES.OFFLINE });
}

function checkConnection() {
  _metrics.checks++;
  if (typeof navigator !== 'undefined') {
    _state.status = navigator.onLine ? STATES.ONLINE : STATES.OFFLINE;
  }
  return { ok: true, status: _state.status };
}

function getStatus() { return _state.status; }
function isOnline() { return _state.status === STATES.ONLINE; }

function setLatency(ms: unknown) {
  _state.latency = ms;
  // @ts-expect-error TS migration - TS2365
  if (ms > 1000) _state.status = STATES.SLOW;
  // @ts-expect-error TS migration - TS2365
  _emit(NETWORK_EVENTS.LATENCY_MEASURED, { latency: ms, slow: ms > 1000 });
  return { ok: true };
}

function render() {
  return `<span class="footer-connection footer-connection--${_state.status}"></span>`;
}

function init(ctx: Record<string,unknown>) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  // @ts-expect-error TS migration - TS2345
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (typeof window !== 'undefined') {
    window.addEventListener('online', _handleOnline);
    window.addEventListener('offline', _handleOffline);
    _cleanup = () => {
      window.removeEventListener('online', _handleOnline);
      window.removeEventListener('offline', _handleOffline);
    };
  }
  checkConnection();
  _state.initialized = true;
  _emit(NETWORK_EVENTS.INIT, { status: _state.status });
  return { ok: true, version: VERSION };
}

function cleanup() {
  if (_cleanup) {
    // @ts-expect-error TS migration - TS2349
    _cleanup();
    _cleanup = null;
  }
  _state.initialized = false;
  _emit(NETWORK_EVENTS.SHUTDOWN, {});
  return { ok: true };
}

function healthCheck() {
  const ps = Ports.snapshot();
  return {
    status: isOnline() ? 'HEALTHY' : 'DEGRADED',
    score: isOnline() ? 100 : 50,
    moduleId: MODULE_ID,
    version: VERSION,
    p18ecCatalog: true,
    checks: {
      initialized: { ok: _state.initialized, severity: 'info' },
      isOnline: { ok: isOnline(), severity: 'warn' },
      portsInitialized: { ok: ps._initialized, severity: 'info' }
    },
    metrics: _metrics
  };
}

function info() {
  const ps = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    p18ecCatalog: true,
    usesNetworkEvents: true,
    initialized: _state.initialized,
    status: _state.status,
    latency: _state.latency,
    metrics: _metrics,
    portsInitialized: ps._initialized
  };
}

// Export NETWORK_EVENTS mapping for backward compatibility
const CONNECTION_EVENTS = {
  ONLINE: NETWORK_EVENTS.ONLINE,
  OFFLINE: NETWORK_EVENTS.OFFLINE
};

export { MODULE_ID, VERSION, STATES, CONNECTION_EVENTS, init, cleanup, checkConnection, getStatus, isOnline, setLatency, render, healthCheck, info };
export default { MODULE_ID, VERSION, STATES, CONNECTION_EVENTS, init, cleanup, checkConnection, getStatus, isOnline, setLatency, render, healthCheck, info, injectPorts, getPorts };
