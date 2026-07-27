// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.modal-manager-global.telemetry.tracker
// PURPOSE: Modal Manager Global - Telemetry Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   MODAL_TELEMETRY — exported value
//   init() — exported function
//   trackOpen() — exported function
//   trackClose() — exported function
//   trackError() — exported function
//   trackInteraction() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   global.telemetry
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'components.modal-manager-global.telemetry.tracker';
const VERSION = '2.2.0-P18EC';

const MODAL_TELEMETRY = {
  OPENED: 'modal:opened',
  CLOSED: 'modal:closed',
  ERROR: 'modal:error',
  INTERACTION: 'modal:interaction'
};

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _metrics = { tracked: 0, opens: 0, closes: 0, errors: 0 };

function _track(eventKey: string, payload: Record<string, unknown>) { _metrics.tracked++; try { const tk = _getPort('telemetry'); if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID, timestamp: Date.now() }, payload || {})); } catch (e) { _metrics.errors++; } }

function trackOpen(modalId: string, config: Record<string, unknown>, owner: string) { _metrics.opens++; _track(MODAL_TELEMETRY.OPENED, { modalId, type: config && config.type, title: config && config.title, owner: owner || null }); }
function trackClose(modalId: string, reason: string) { _metrics.closes++; _track(MODAL_TELEMETRY.CLOSED, { modalId, reason }); }
function trackError(modalId: string, error: Error | string) { _metrics.errors++; _track(MODAL_TELEMETRY.ERROR, { modalId, error: (error instanceof Error ? error.message : String(error)) }); }
function trackInteraction(modalId: string, action: string) { _track(MODAL_TELEMETRY.INTERACTION, { modalId, action }); }

function init(ctx: Record<string, unknown>) { _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); return { ok: true, version: VERSION }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { hasTelemetry: { ok: !!_getPort('telemetry'), severity: 'warn' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, MODAL_TELEMETRY, init, trackOpen, trackClose, trackError, trackInteraction, healthCheck, info };
export default { MODULE_ID, VERSION, MODAL_TELEMETRY, init, trackOpen, trackClose, trackError, trackInteraction, healthCheck, info, injectPorts, getPorts };
