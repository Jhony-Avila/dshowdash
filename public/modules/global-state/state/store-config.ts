// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: global-state-store:config
// PURPOSE: Global State Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from ../core/logger.js
//
// PROVIDES:
//   VERSION
//   MODULE_ID
//   metrics
//   isDebugEnabled
//   log
//   deepClone
//   getNestedValue
//   resetMetrics
//   info
//   healthCheck
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

import { _log, _debug as isDebugEnabled } from '../core/logger.js';

const VERSION = '1.2.0-ENTERPRISE';
const MODULE_ID = 'global-state-store:config';

const metrics = {
  dispatches: 0,
  dispatchesSucceeded: 0,
  dispatchesFailed: 0,
  notificationsSent: 0,
  notificationsSkipped: 0,
  deepCompares: 0
};


// @ts-expect-error TS migration - TS2300
function log(level: 'error' | 'warn' | 'info' | 'debug', ...args: any[]) {

  _log(...[level].concat(args));
}

function deepClone(obj: unknown) { return JSON.parse(JSON.stringify(obj)); }

function getNestedValue(obj: unknown, path: string) {
  const keys = path.split('.');
  let current: any = obj;
  for (let i = 0; i < keys.length; i++) {
    if (current === undefined || current === null) return undefined;
    current = current[keys[i]];
  }
  return current;
}

function resetMetrics() {
  const keys = Object.keys(metrics);
  for (let i = 0; i < keys.length; i++) (metrics as Record<string, number>)[keys[i]] = 0;
}

function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: Object.assign({}, metrics) }; }

function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { metricsReady: typeof metrics === 'object', loggerReady: typeof log === 'function' } };
}

export { VERSION, MODULE_ID, metrics, isDebugEnabled, log, deepClone, getNestedValue, resetMetrics, info, healthCheck };
export default { VERSION, MODULE_ID, metrics, isDebugEnabled, log, deepClone, getNestedValue, resetMetrics, info, healthCheck };
