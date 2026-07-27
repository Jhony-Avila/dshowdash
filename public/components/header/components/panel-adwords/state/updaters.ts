// ═════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v8.1.0-ENTERPRISE)
// ═════════════════════════════════════════════════════════════
// MODULE: header/components/panel-adwords/state/updaters
// PURPOSE: State Updaters
// ─────────────────────────────────────────────────────────────
// PROVIDES:
//   updateField()
//   updateMultiple()
//   toggleField()
//   incrementField()
//   pushToArray()
//   removeFromArray()
//   getMetrics()
//   resetMetrics()
// ═════════════════════════════════════════════════════════════
// panel-adwords - State Updaters (Enterprise)
// @version 8.1.0-ENTERPRISE
'use strict';

import { VERSION } from '/core/version.js'; export { VERSION };
export const MODULE_ID = 'header/components/panel-adwords/state/updaters';

const _metrics = { updates: 0, lastUpdateAt: (null as unknown|null) };

export function updateField(state: Record<string,unknown>, field: unknown, value: unknown) {
  _metrics.updates++;
  _metrics.lastUpdateAt = Date.now();
  // @ts-expect-error TS migration - TS2464
  return { ...state, [field]: value };
}

export function updateMultiple(state: Record<string,unknown>, updates: Record<string,unknown>) {
  _metrics.updates++;
  _metrics.lastUpdateAt = Date.now();
  return { ...state, ...updates };
}

export function toggleField(state: Record<string,unknown>, field: unknown) {
  _metrics.updates++;
  _metrics.lastUpdateAt = Date.now();
  // @ts-expect-error TS migration - TS2464, TS2538
  return { ...state, [field]: !state[field] };
}

export function incrementField(state: Record<string,unknown>, field: unknown, amount = 1) {
  _metrics.updates++;
  _metrics.lastUpdateAt = Date.now();
  // @ts-expect-error TS migration - TS2464, TS2538
  return { ...state, [field]: (state[field] || 0) + amount };
}

export function pushToArray(state: Record<string,unknown>, field: unknown, item: Record<string,unknown>) {
  _metrics.updates++;
  _metrics.lastUpdateAt = Date.now();
  // @ts-expect-error TS migration - TS2464, TS2538
  return { ...state, [field]: [...(state[field] || []), item] };
}

export function removeFromArray(state: Record<string,unknown>, field: unknown, predicate: Function) {
  _metrics.updates++;
  _metrics.lastUpdateAt = Date.now();
  // @ts-expect-error TS migration - TS2464, TS2538
  return { ...state, [field]: (state[field] || []).filter((item: Record<string,unknown>, idx: unknown) => !predicate(item, idx)) };
}

export function getMetrics() { return { ..._metrics }; }
export function resetMetrics() { _metrics.updates = 0; _metrics.lastUpdateAt = null; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { ready: true } }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, metrics: getMetrics() }; }
export default { updateField, updateMultiple, toggleField, incrementField, pushToArray, removeFromArray };
