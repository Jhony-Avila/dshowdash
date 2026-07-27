// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v8.4.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header.panel-maps.telemetry.logger
// PURPOSE: Logging facade using Ports for logger resolution
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   Logger — constructor with info(), warn(), error(), debug(), healthCheck()
//   injectPorts(p) — inject ports into module
//   getPorts() — return ports snapshot
//   getMetrics() — module-level metrics
//   info() — module information
//   healthCheck() — module health status
// ═══════════════════════════════════════════════════════════════
// Panel Maps - Logger (Enterprise)
// @version 8.4.0-ES6
// @changelog v8.4.0-ES6 - Task 10.1 B01: var → const/let
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const MODULE_ID = 'header.panel-maps.telemetry.logger';
export const VERSION = '8.4.0-ES6';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
let _metrics = { logs: 0, warns: 0, errors: 0 };
function Logger(this: any, options: Record<string,unknown>) { if (!options) options = {}; this.prefix = options.prefix || '[panel-maps]'; this.debug = options.debug || false; }
Logger.prototype.info = function() { if (!this.debug) return; _metrics.logs++; const L = _getPort('logger'); if (L && L.info) L.info.apply(L, [this.prefix].concat(Array.prototype.slice.call(arguments))); else if (L && L.debug) L.debug.apply(L, [this.prefix].concat(Array.prototype.slice.call(arguments))); };
Logger.prototype.warn = function() { _metrics.warns++; const L = _getPort('logger'); if (L && L.warn) L.warn.apply(L, [this.prefix].concat(Array.prototype.slice.call(arguments))); };
Logger.prototype.error = function() { _metrics.errors++; const L = _getPort('logger'); if (L && L.error) L.error.apply(L, [this.prefix].concat(Array.prototype.slice.call(arguments))); };
Logger.prototype.debug = function() { if (!this.debug) return; _metrics.logs++; const L = _getPort('logger'); if (L && L.debug) L.debug.apply(L, [this.prefix].concat(Array.prototype.slice.call(arguments))); };
Logger.prototype.getMetrics = () => Object.assign({}, _metrics);
Logger.prototype.healthCheck = function() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { loggerReady: !!_getPort('logger'), portsInitialized: Ports.isInitialized() }, metrics: this.getMetrics(), portsInitialized: Ports.isInitialized() }; };
export function getMetrics() { return Object.assign({}, _metrics); }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { loggerReady: !!_getPort('logger'), portsInitialized: Ports.isInitialized() }, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }
export { Logger };
