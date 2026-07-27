// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-analytics/telemetry/logger
// PURPOSE: Analytics - Logger
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createTelemetryPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   Logger() — exported function
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
import { createTelemetryPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels/panel-analytics/telemetry/logger';
const Ports = createTelemetryPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
function Logger(this: any, options: { prefix?: string; level?: string; enabled?: boolean } = {}) { options = options || {}; (this as Record<string, unknown>).prefix = options.prefix || '[analytics]'; (this as Record<string, unknown>).level = options.level || 'info'; (this as Record<string, unknown>).enabled = options.enabled !== false; (this as Record<string, unknown>).levels = { debug: 0, info: 1, warn: 2, error: 3 }; (this as Record<string, unknown>)._metrics = { debugCount: 0, infoCount: 0, warnCount: 0, errorCount: 0, lastLogAt: null }; _initPorts(); }
Logger.prototype.debug = function(...args: unknown[]) { this._log('debug', Array.prototype.slice.call(args)); };
Logger.prototype.info = function(...args: unknown[]) { this._log('info', Array.prototype.slice.call(args)); };
Logger.prototype.warn = function(...args: unknown[]) { this._log('warn', Array.prototype.slice.call(args)); };
Logger.prototype.error = function(...args: unknown[]) { this._log('error', Array.prototype.slice.call(args)); };
Logger.prototype._log = function(level: string, args: unknown[]) { if (!this.enabled || this.levels[level] < this.levels[this.level]) return; const globalLogger = _getPort('logger'); if (globalLogger) { const fn = (globalLogger as Record<string, unknown>)[level]; if (typeof fn === 'function') (fn as (...a: unknown[]) => void).apply(globalLogger, [this.prefix, ...args]); } this._metrics[`${level}Count`]++; this._metrics.lastLogAt = Date.now(); };
Logger.prototype.setLevel = function(level: string) { if (this.levels[level] !== undefined) this.level = level; };
Logger.prototype.enable = function() { this.enabled = true; };
Logger.prototype.disable = function() { this.enabled = false; };
Logger.prototype.healthCheck = function() { const portsSnapshot = Ports.snapshot(); const checks: Record<string, boolean> = { enabled: this.enabled, validLevel: this.levels[this.level] !== undefined, portsInitialized: portsSnapshot._initialized }; let passed = 0; for (const k in checks) { if (checks[k]) passed++; } return { status: passed === 3 ? 'healthy' : 'degraded', checks, version: VERSION, moduleId: MODULE_ID }; };
Logger.prototype.info2 = function() { const portsSnapshot = Ports.snapshot(); return { version: VERSION, moduleId: MODULE_ID, enabled: this.enabled, level: this.level, metrics: this._metrics, portsInitialized: portsSnapshot._initialized, healthCheck: this.healthCheck() }; };
Logger.prototype.getMetrics = function() { return Object.assign({}, this._metrics); };
export { Logger };
export default Logger;
