// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.9.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-integration-alfinete/telemetry/logger
// PURPOSE: Integration Alfinete - Logger
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createTelemetryPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
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
export const MODULE_ID = 'panels/panel-integration-alfinete/telemetry/logger';
const Ports = createTelemetryPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();
export class Logger {
  [key: string]: any;
  constructor(options: { prefix?: string; level?: string; enabled?: boolean } = {}) { this.prefix = options.prefix || '[integration-alfinete]'; this.level = options.level || 'info'; this.enabled = options.enabled !== false; this.levels = { debug: 0, info: 1, warn: 2, error: 3 }; this._metrics = { debugCount: 0, infoCount: 0, warnCount: 0, errorCount: 0, lastLogAt: null }; _initPorts(); }
  debug(...args: unknown[]) { this._log('debug', args); }
  info(...args: unknown[]) { this._log('info', args); }
  warn(...args: unknown[]) { this._log('warn', args); }
  error(...args: unknown[]) { this._log('error', args); }
  _log(level: string, args: unknown[]) { if (!this.enabled || this.levels[level] < this.levels[this.level]) return; const globalLogger = _getPort('logger'); globalLogger?.[level]?.(this.prefix, ...args); this._metrics[`${level}Count`]++; this._metrics.lastLogAt = Date.now(); }
  setLevel(level: string) { if (this.levels[level] !== undefined) this.level = level; }
  enable() { this.enabled = true; }
  disable() { this.enabled = false; }
  healthCheck() { const ps = Ports.snapshot(); const checks = { enabled: this.enabled, validLevel: this.levels[this.level] !== undefined, portsInitialized: ps._initialized }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 3 ? 'HEALTHY' : 'DEGRADED', checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
  info2() { return { version: VERSION, moduleId: MODULE_ID, enabled: this.enabled, level: this.level, portsInitialized: Ports.snapshot()._initialized, metrics: this._metrics, healthCheck: this.healthCheck() }; }
  getMetrics() { return { ...this._metrics }; }
}
export function getVersion() { return VERSION; }
export { Logger as default };
