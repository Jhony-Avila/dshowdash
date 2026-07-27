// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.charts.executions-timeline
// PURPOSE: Charts - Executions Timeline
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   TIMELINE_TELEMETRY — exported value
//   init() — exported function
//   cleanup() — exported function
//   setData() — exported function
//   getData() — exported function
//   render() — exported function
//   update() — exported function
//   destroy() — exported function
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

const MODULE_ID = 'components.charts.executions-timeline';
const VERSION = '2.2.0-P18EC';

const TIMELINE_TELEMETRY = {
  INIT: 'chart:timeline:init',
  RENDER: 'chart:timeline:render'
};

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state: { initialized: boolean; data: unknown[]; container: HTMLElement | null; chart: unknown } = { initialized: false, data: [], container: null, chart: null };
const _metrics = { renders: 0, updates: 0 };

function _track(eventKey: string, payload?: Record<string, unknown>) { try { const tk = _getPort('telemetry'); if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID }, payload || {})); } catch (e) { } }

function setData(data: unknown[]) { _state.data = data || []; return { ok: true, count: _state.data.length }; }
function getData() { return _state.data.slice(); }

function render(container?: HTMLElement) { _metrics.renders++; _state.container = container || _state.container; if (!_state.container) return { ok: false, reason: 'No container' }; _track(TIMELINE_TELEMETRY.RENDER, { dataPoints: _state.data.length }); return { ok: true }; }

function update(newData: unknown[]) { _metrics.updates++; if (newData) _state.data = newData; return render(); }

function destroy() { _state.chart = null; _state.data = []; return { ok: true }; }

function init(ctx: { ports?: Record<string, unknown>; container?: HTMLElement; data?: unknown[] }) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports); if (ctx && ctx.container) _state.container = ctx.container; if (ctx && ctx.data) _state.data = ctx.data; _state.initialized = true; _track(TIMELINE_TELEMETRY.INIT, { version: VERSION }); return { ok: true, version: VERSION }; }
function cleanup() { destroy(); _state.initialized = false; return { ok: true }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'info' }, hasContainer: { ok: !!_state.container, severity: 'warn' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, dataPoints: _state.data.length, hasContainer: !!_state.container, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, TIMELINE_TELEMETRY, init, cleanup, setData, getData, render, update, destroy, healthCheck, info };
export default { MODULE_ID, VERSION, TIMELINE_TELEMETRY, init, cleanup, setData, getData, render, update, destroy, healthCheck, info, injectPorts, getPorts };
