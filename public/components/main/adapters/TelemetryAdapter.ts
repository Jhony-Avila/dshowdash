// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.main.adapters.telemetry
// PURPOSE: Main - Telemetry Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   createTelemetryAdapter() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   track() — exported function
//   trackError() — exported function
//   trackTiming() — exported function
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

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'components.main.adapters.telemetry';
const VERSION = '2.2.0-P18EC';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _metrics = { tracked: 0, errors: 0 };

function track(eventName: string, payload: Record<string, unknown> = {}) { _metrics.tracked++; const telemetry = _getPort('telemetry'); if (telemetry && telemetry.track) { telemetry.track(eventName, Object.assign({ adapter: 'main', timestamp: Date.now() }, payload || {})); return { ok: true }; } return { ok: false, reason: 'Telemetry not available' }; }

function trackError(error: Error | string, context: Record<string, unknown> = {}) { _metrics.errors++; return track('main:adapter:error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, context }); }

function trackTiming(name: string, durationMs: number) { return track('main:timing', { name, durationMs }); }

function init(ctx: Record<string, unknown>) { _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); return { ok: true, version: VERSION }; }
function healthCheck() { const hasTelemetry = !!_getPort('telemetry'); return { status: hasTelemetry ? 'HEALTHY' : 'DEGRADED', score: hasTelemetry ? 100 : 70, moduleId: MODULE_ID, version: VERSION, checks: { hasTelemetry: { ok: hasTelemetry, severity: 'warn' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export function createTelemetryAdapter(options: Record<string, unknown>) { options = options || {}; init(options); return { track, trackError, trackTiming, healthCheck, info, VERSION, MODULE_ID }; }

export { MODULE_ID, VERSION, init, track, trackError, trackTiming, healthCheck, info };
export default { MODULE_ID, VERSION, createTelemetryAdapter, init, track, trackError, trackTiming, healthCheck, info, injectPorts, getPorts };
