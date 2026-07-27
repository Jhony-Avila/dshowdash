// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: toast.telemetry.tracker
// PURPOSE: Toast Telemetry Tracker v2.1.0-P18EC
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   TOAST_EVENTS from ../toast-catalog.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   track() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { TOAST_EVENTS } from '../toast-catalog.js';

export const VERSION = '2.1.0-P18EC';
export const MODULE_ID = 'toast.telemetry.tracker';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _metrics: { shown: number; dismissed: number; dismissedByUser: number; dismissedByTimeout: number; actionsClicked: number; byType: Record<string, number>; errors: number } = { shown: 0, dismissed: 0, dismissedByUser: 0, dismissedByTimeout: 0, actionsClicked: 0, byType: { success: 0, info: 0, warning: 0, error: 0, critical: 0 }, errors: 0 };

export function init(options: Record<string, unknown>) { if (options === undefined) options = {}; if (options.eventBus) Ports.inject({ eventBus: options.eventBus }); return { success: true, hasEventBus: !!_getPort('eventBus') }; }

export function track(event: string, data: Record<string, unknown>) {
  if (data === undefined) data = {};
  const payload = Object.assign({}, data, { module: MODULE_ID, timestamp: Date.now() });
  
  // P18EC: Match against catalog constants
  switch (event) {
    case TOAST_EVENTS.SHOWN:
      _metrics.shown++;
      if (data.type && _metrics.byType[data.type as string] !== undefined) _metrics.byType[data.type as string]++;
      break;
    case TOAST_EVENTS.DISMISSED:
      _metrics.dismissed++;
      if (data.source === 'user') _metrics.dismissedByUser++;
      if (data.source === 'timeout') _metrics.dismissedByTimeout++;
      break;
    case TOAST_EVENTS.ACTION_CLICKED:
      _metrics.actionsClicked++;
      break;
    case TOAST_EVENTS.ERROR:
      _metrics.errors++;
      break;
  }
  
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(event, payload);
  return payload;
}

export function getMetrics() { return Object.assign({}, _metrics); }
export function resetMetrics() { _metrics = { shown: 0, dismissed: 0, dismissedByUser: 0, dismissedByTimeout: 0, actionsClicked: 0, byType: { success: 0, info: 0, warning: 0, error: 0, critical: 0 } as Record<string, number>, errors: 0 }; }

export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), hasEventBus: !!_getPort('eventBus'), portsInitialized: Ports.isInitialized(), catalogVersion: 'TOAST_EVENTS' }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, hasEventBus: !!_getPort('eventBus'), metrics: getMetrics(), portsInitialized: Ports.isInitialized() }; }

export default { init, track, getMetrics, resetMetrics, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID, TOAST_EVENTS };
