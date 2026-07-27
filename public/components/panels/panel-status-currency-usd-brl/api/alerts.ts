// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-status-currency-usd-brl/api/alerts
// PURPOSE: Status  - API Alerts
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   add() — exported function
//   remove() — exported function
//   getAll() — exported function
//   getByType() — exported function
//   clear() — exported function
//   setMaxAlerts() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels/panel-status-currency-usd-brl/api/alerts';

const _alerts: Record<string, unknown>[] = [];
let _maxAlerts = 100;

export function add(alert: Record<string, unknown>) {
  const entry = { id: Date.now(), timestamp: new Date().toISOString(), ...alert };
  _alerts.unshift(entry);
  if (_alerts.length > _maxAlerts) _alerts.pop();
  return entry;
}

export function remove(id: number) {
  const index = _alerts.findIndex(a => a.id === id);
  if (index > -1) return _alerts.splice(index, 1)[0];
  return null;
}

export function getAll() { return [..._alerts]; }
export function getByType(type: string) { return _alerts.filter(a => a.type === type); }
export function clear() { _alerts.length = 0; }
export function setMaxAlerts(max: number) { _maxAlerts = max; }

export function healthCheck() {
  return { status: 'healthy', version: VERSION, moduleId: MODULE_ID, alertCount: _alerts.length };
}

export function info() {
  return { version: VERSION, moduleId: MODULE_ID, alertCount: _alerts.length, maxAlerts: _maxAlerts, healthCheck: healthCheck() };
}

export default { add, remove, getAll, getByType, clear, setMaxAlerts, healthCheck, info, VERSION, MODULE_ID };
