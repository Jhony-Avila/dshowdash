// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v8.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/panel-maps/api/alerts
// PURPOSE: Alert creation and management for maps panel
// ───────────────────────────────────────────────────────────────
// PROVIDES:
//   createAlert(type, message, options) — create a new alert
//   dismissAlert(id) — dismiss alert by id
//   getAlerts() — get all active alerts
//   clearAlerts() — clear all alerts
//   healthCheck() — module health status
//   info() — module information
// ═══════════════════════════════════════════════════════════════
// panel-maps - Alerts API (Enterprise)
// @version 8.1.0-ENTERPRISE
'use strict';

import { VERSION } from '/core/version.js'; export { VERSION };
export const MODULE_ID = 'header/components/panel-maps/api/alerts';

let _debug = false;
// @ts-expect-error strict migration — TS7034
const _alerts = [];
const _metrics = { created: 0, dismissed: 0, lastAlertAt: (null as unknown|null) };

export function createAlert(type: string, message: string, options = {}) {
  const alert = { id: `alert-${Date.now()}`, type, message, timestamp: Date.now(), ...options };
  _alerts.push(alert);
  _metrics.created++;
  _metrics.lastAlertAt = Date.now();
  return alert;
}

export function dismissAlert(id: string) {
  // @ts-expect-error strict migration — TS7005
  const idx = _alerts.findIndex(a => a.id === id);
  // @ts-expect-error strict migration — TS7005
  if (idx !== -1) { _alerts.splice(idx, 1); _metrics.dismissed++; return true; }
  return false;
}

// @ts-expect-error strict migration — TS7005
export function getAlerts() { return [..._alerts]; }
export function clearAlerts() { _alerts.length = 0; }
export function setDebug(enabled: boolean) { _debug = !!enabled; }
export function getMetrics() { return { ..._metrics, active: _alerts.length }; }
export function resetMetrics() { _metrics.created = 0; _metrics.dismissed = 0; _metrics.lastAlertAt = null; }

export function healthCheck() {
  const checks = { ready: true, noOverflow: _alerts.length < 100 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 2, checks, version: VERSION, moduleId: MODULE_ID };
}

export function info() { return { version: VERSION, moduleId: MODULE_ID, alerts: _alerts.length, metrics: getMetrics() }; }
export default { createAlert, dismissAlert, getAlerts, clearAlerts };
