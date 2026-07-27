// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.3.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: notification-manager-dispatcher
// PURPOSE: Notification Manager - Dispatcher v2.3.0-P18EC
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   NOTIFICATION_EVENTS — exported value
//   dispatch() — exported function
//   dismiss() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   NOTIFICATION_EVENTS.SHOW
//   NOTIFICATION_EVENTS.HIDE
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const VERSION = '2.3.0-P18EC';
const MODULE_ID = 'notification-manager-dispatcher';

const NOTIFICATION_EVENTS = { SHOW: 'notification:show', HIDE: 'notification:hide' };

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

const _metrics = { dispatched: 0 };

function dispatch(notification: Record<string, unknown>) {
  _initPorts();
  _metrics.dispatched++;
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(NOTIFICATION_EVENTS.SHOW, notification);
  return true;
}

function dismiss(id: string | number) {
  _initPorts();
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(NOTIFICATION_EVENTS.HIDE, { id });
  return true;
}

function getMetrics() { return Object.assign({}, _metrics); }

function healthCheck() {
  const portsSnapshot = Ports.snapshot();
  const eb = _getPort('eventBus');
  const checks: Record<string, boolean> = { eventBusAvailable: !!eb, portsInitialized: portsSnapshot._initialized };
  let passed = 0; let total = 0;
  for (const k in checks) { if (checks.hasOwnProperty(k)) { total++; if (checks[k]) passed++; } }
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, portsInitialized: portsSnapshot._initialized, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

function info() {
  const portsSnapshot = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: portsSnapshot._initialized, metrics: getMetrics(), timestamp: Date.now() };
}

export { VERSION, MODULE_ID, NOTIFICATION_EVENTS, dispatch, dismiss, getMetrics, healthCheck, info, injectPorts, getPorts };
export default { dispatch, dismiss, NOTIFICATION_EVENTS, getMetrics, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
