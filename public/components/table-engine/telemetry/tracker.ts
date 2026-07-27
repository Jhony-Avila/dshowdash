// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.table-engine.telemetry.tracker
// PURPOSE: Table Engine - Telemetry Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   TABLE_TELEMETRY — exported value
//   init() — exported function
//   trackRender() — exported function
//   trackSort() — exported function
//   trackFilter() — exported function
//   trackError() — exported function
//   trackScroll() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'components.table-engine.telemetry.tracker';
const VERSION = '2.2.0-P18EC';

const TABLE_TELEMETRY = {
  RENDERED: 'table:rendered',
  SORTED: 'table:sorted',
  FILTERED: 'table:filtered',
  ERROR: 'table:error',
  SCROLLED: 'table:scrolled'
};

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _metrics = { tracked: 0, renders: 0, sorts: 0, filters: 0, errors: 0 };

function _track(eventKey: string, payload: Record<string, unknown>) { _metrics.tracked++; try { const tk = _getPort('telemetry'); if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID, timestamp: Date.now() }, payload || {})); } catch (e) { _metrics.errors++; } }

function trackRender(tableId: string, rowCount: number, renderTimeMs: number) { _metrics.renders++; _track(TABLE_TELEMETRY.RENDERED, { tableId, rowCount, renderTimeMs }); }
function trackSort(tableId: string, column: string, direction: string) { _metrics.sorts++; _track(TABLE_TELEMETRY.SORTED, { tableId, column, direction }); }
function trackFilter(tableId: string, filters: Record<string, unknown>) { _metrics.filters++; _track(TABLE_TELEMETRY.FILTERED, { tableId, filterCount: Object.keys(filters || {}).length }); }
function trackError(tableId: string, error: { message?: string }) { _metrics.errors++; _track(TABLE_TELEMETRY.ERROR, { tableId, error: error.message || String(error) }); }
function trackScroll(tableId: string, scrollTop: number, visibleRows: number) { _track(TABLE_TELEMETRY.SCROLLED, { tableId, scrollTop, visibleRows }); }

function init(ctx: { ports?: Record<string, unknown>; events?: unknown } | null) { _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports); return { ok: true, version: VERSION }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { hasTelemetry: { ok: !!_getPort('telemetry'), severity: 'warn' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, TABLE_TELEMETRY, init, trackRender, trackSort, trackFilter, trackError, trackScroll, healthCheck, info };
export default { MODULE_ID, VERSION, TABLE_TELEMETRY, init, trackRender, trackSort, trackFilter, trackError, trackScroll, healthCheck, info, injectPorts, getPorts };
