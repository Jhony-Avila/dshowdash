// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: header.email-integration.telemetry.logger
// PURPOSE: Logger adapter using Ports for telemetry
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   MODULE_ID, VERSION — module metadata
//   injectPorts(p) — inject external ports
//   getPorts() — get ports snapshot
//   Logger — structured logging class via ports
//   getMetrics() — retrieve logging metrics
//   info() — module info
//   healthCheck() — module health status
// ═══════════════════════════════════════════════════════════════
// Logger - Enterprise P17WI
// @version 2.2.0-P17WI
// @changelog P17WI - Migração para PortsFactory/PortsProfiles
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const MODULE_ID = 'header.email-integration.telemetry.logger';
export const VERSION = '2.2.0-P17WI';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
let _metrics = { logs: 0, warns: 0, errors: 0 };
export class Logger {
  [key: string]: any;
  // @ts-expect-error TS2322: debug boolean conflicts with index signature method type
  constructor(options: { prefix?: string; debug?: boolean } = {}) { this.prefix = options.prefix || '[email-integration]'; this.debug = options.debug || false; }
  info(...args: unknown[]) { if (!this.debug) return; _metrics.logs++; const L = _getPort('logger'); if (L?.info) L.info(this.prefix, ...args); else if (L?.debug) L.debug(this.prefix, ...args); }
  warn(...args: unknown[]) { _metrics.warns++; const L = _getPort('logger'); if (L?.warn) L.warn(this.prefix, ...args); }
  error(...args: unknown[]) { _metrics.errors++; const L = _getPort('logger'); if (L?.error) L.error(this.prefix, ...args); }
  debug(...args: unknown[]) { if (!this.debug) return; _metrics.logs++; const L = _getPort('logger'); if (L?.debug) L.debug(this.prefix, ...args); }
  getMetrics() { return { ..._metrics }; }
  healthCheck() { const ps = Ports.snapshot(); return { status: ps._initialized ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { loggerReady: !!_getPort('logger'), portsInitialized: ps._initialized }, metrics: this.getMetrics(), portsInitialized: ps._initialized, timestamp: Date.now() }; }
}
export function getMetrics() { return { ..._metrics }; }
export function info() { const ps = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, portsInitialized: ps._initialized, timestamp: Date.now() }; }
export function healthCheck() { const ps = Ports.snapshot(); return { status: ps._initialized ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { loggerReady: !!_getPort('logger'), portsInitialized: ps._initialized }, portsInitialized: ps._initialized, timestamp: Date.now() }; }
