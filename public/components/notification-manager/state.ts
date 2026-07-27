// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: notification-manager-state
// PURPOSE: Notification Manager - State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getState() — exported function
//   setNotifications() — exported function
//   getUnreadCount() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '2.1.0-P17WI';
export const MODULE_ID = 'notification-manager-state';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state: { notifications: Record<string, unknown>[]; unreadCount: number } = { notifications: [], unreadCount: 0 };

export function getState() { return Object.assign({}, _state, { notifications: _state.notifications.slice() }); }

export function setNotifications(list: Record<string, unknown>[]) {
  _initPorts();
  _state.notifications = list;
  _state.unreadCount = list.filter((n: Record<string, unknown>) => !n.read).length;
}

export function getUnreadCount() { return _state.unreadCount; }

export function healthCheck() {
  const checks = { hasState: true, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed === 2 ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/2`,
    checks,
    notificationCount: _state.notifications.length,
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: Ports.isInitialized(),
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    notificationCount: _state.notifications.length,
    unreadCount: _state.unreadCount,
    portsInitialized: Ports.isInitialized(),
    timestamp: Date.now()
  };
}

export default { getState, setNotifications, getUnreadCount, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
