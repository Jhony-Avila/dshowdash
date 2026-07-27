// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-icon-map-pin-logger
// PURPOSE: map-pin Icon - Logger
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createTelemetryPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   Logger — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createTelemetryPorts } from '/core/runtime/ports-profiles.js';
export const MODULE_ID = 'footer-icon-map-pin-logger';
export const VERSION = '1.5.0-ENTERPRISE';
const Ports = createTelemetryPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _metrics = { info: 0, warn: 0, error: 0, debug: 0 };
// @ts-expect-error TS migration - TS2356
function _log(level: string, args: unknown[]) { (_metrics as Record<string,unknown>)[level as string]++; const logger = _getPort('logger'); if (logger && typeof logger[level] === 'function') { logger[level](args.join(' '), { component: MODULE_ID }); } }
export const Logger = { info(...args: unknown[]) { _log('info', Array.prototype.slice.call(args)); }, warn(...args: unknown[]) { _log('warn', Array.prototype.slice.call(args)); }, error(...args: unknown[]) { _log('error', Array.prototype.slice.call(args)); }, debug(...args: unknown[]) { _log('debug', Array.prototype.slice.call(args)); } };
export function getMetrics() { return Object.assign({}, _metrics); }
export function info() { const ps = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), portsInitialized: ps._initialized }; }
export function healthCheck() { const ps = Ports.snapshot(); const loggerAvailable = !!_getPort('logger'); return { status: loggerAvailable ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { loggerAvailable, portsInitialized: ps._initialized }, metrics: getMetrics() }; }

export default { info: Logger.info, warn: Logger.warn, error: Logger.error, debug: Logger.debug, getMetrics, info2: info, healthCheck, MODULE_ID, VERSION };
