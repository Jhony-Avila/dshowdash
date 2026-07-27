// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/panel-calendar/ui/notifications
// PURPOSE: panel-calendar - UI Notifications (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   show() — exported function
//   hide() — exported function
//   getActive() — exported function
//   clearAll() — exported function
//   setDebug() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION } from '/core/version.js'; export { VERSION };
export const MODULE_ID = 'header/components/panel-calendar/ui/notifications';

let _debug = false;
// @ts-expect-error strict migration — TS7034
const _notifications = [];
const _metrics = { shown: 0, hidden: 0, lastShownAt: (null as unknown|null) };

export function show(message: string, options: Record<string, unknown> = {}) {
  const notification = { id: `notif-${Date.now()}`, message, type: options.type || 'info', duration: options.duration || 3000, timestamp: Date.now() };
  _notifications.push(notification);
  _metrics.shown++;
  _metrics.lastShownAt = Date.now();
  if (Number(notification.duration) > 0) setTimeout(() => hide(notification.id), Number(notification.duration));
  return notification;
}

export function hide(id: string) {
  // @ts-expect-error strict migration — TS7005
  const idx = _notifications.findIndex(n => n.id === id);
  // @ts-expect-error strict migration — TS7005
  if (idx !== -1) { _notifications.splice(idx, 1); _metrics.hidden++; return true; }
  return false;
}

// @ts-expect-error strict migration — TS7005
export function getActive() { return [..._notifications]; }
export function clearAll() { _notifications.length = 0; }
export function setDebug(enabled: boolean) { _debug = !!enabled; }
export function getMetrics() { return { ..._metrics, active: _notifications.length }; }
export function resetMetrics() { _metrics.shown = 0; _metrics.hidden = 0; _metrics.lastShownAt = null; }

export function healthCheck() {
  const checks = { ready: true, noOverflow: _notifications.length < 50 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 2, checks, version: VERSION, moduleId: MODULE_ID };
}

export function info() { return { version: VERSION, moduleId: MODULE_ID, active: _notifications.length, metrics: getMetrics() }; }
export default { show, hide, getActive, clearAll };
