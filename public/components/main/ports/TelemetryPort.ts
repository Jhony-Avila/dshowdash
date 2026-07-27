// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.main.ports.telemetry
// PURPOSE: Main - Telemetry Port
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   createTelemetryPort() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   track() — exported function
//   trackError() — exported function
//   trackNavigation() — exported function
//   trackPanelLoad() — exported function
//   flushBuffer() — exported function
//   getBuffer() — exported function
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

const MODULE_ID = 'components.main.ports.telemetry';
const VERSION = '2.2.0-P18EC';

interface TelemetryAdapterPort {
  track?(event: string, data: Record<string, unknown>): void;
  [key: string]: unknown;
}

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts(): void { Ports.init(); }
function _getPort(name: 'telemetry'): TelemetryAdapterPort | null;
function _getPort(name: string): Record<string, unknown> | null;
function _getPort(name: string): Record<string, unknown> | null { return Ports.get(name) as Record<string, unknown> | null; }
export function injectPorts(p: Record<string, unknown>): boolean { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _metrics = { tracked: 0, errors: 0 };
const _buffer: Array<{ event: string; payload: Record<string, unknown>; timestamp: number }> = [];
const _maxBuffer = 100;

function track(eventName: string, payload: Record<string, unknown> = {}) { _metrics.tracked++; const telemetry = _getPort('telemetry'); if (telemetry && telemetry.track) { telemetry.track(eventName, Object.assign({ source: 'main', timestamp: Date.now() }, payload || {})); return { ok: true }; } _buffer.push({ event: eventName, payload, timestamp: Date.now() }); if (_buffer.length > _maxBuffer) _buffer.shift(); return { ok: true, buffered: true }; }

function trackError(error: Error | string, context: Record<string, unknown> = {}) { _metrics.errors++; const errorMsg = error instanceof Error ? error.message : String(error); const errorStack = error instanceof Error ? error.stack : undefined; return track('main:error', { error: errorMsg, stack: errorStack, context }); }

function trackNavigation(from: string, to: string) { return track('main:navigation', { from, to }); }

function trackPanelLoad(panelId: string, loadTimeMs: number) { return track('main:panel:load', { panelId, loadTimeMs }); }

function flushBuffer() { const telemetry = _getPort('telemetry'); if (!telemetry || !telemetry.track) return { ok: false, reason: 'No telemetry' }; let flushed = 0; while (_buffer.length > 0) { const entry = _buffer.shift(); telemetry.track(entry!.event, entry!.payload); flushed++; } return { ok: true, flushed }; }

function getBuffer() { return _buffer.slice(); }

function init(ctx: Record<string, unknown> & { ports?: Record<string, unknown> }) { _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports); flushBuffer(); return { ok: true, version: VERSION }; }
function healthCheck() { const hasTelemetry = !!_getPort('telemetry'); return { status: hasTelemetry ? 'HEALTHY' : 'DEGRADED', score: hasTelemetry ? 100 : 70, moduleId: MODULE_ID, version: VERSION, checks: { hasTelemetry: { ok: hasTelemetry, severity: 'warn' }, bufferSize: { ok: _buffer.length < _maxBuffer * 0.8, severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, bufferSize: _buffer.length, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export function createTelemetryPort(options: Record<string, unknown> & { ports?: Record<string, unknown> }) { options = options || {}; init(options); return { track, trackError, trackNavigation, trackPanelLoad, flushBuffer, getBuffer, healthCheck, info, VERSION, MODULE_ID }; }

export { MODULE_ID, VERSION, init, track, trackError, trackNavigation, trackPanelLoad, flushBuffer, getBuffer, healthCheck, info };
export default { MODULE_ID, VERSION, createTelemetryPort, init, track, trackError, trackNavigation, trackPanelLoad, flushBuffer, getBuffer, healthCheck, info, injectPorts, getPorts };
