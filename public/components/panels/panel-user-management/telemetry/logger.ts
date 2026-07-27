// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-management.telemetry.logger
// PURPOSE: Logger - Enterprise Telemetry
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   createLogger() — exported function
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

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const MODULE_ID = 'panel-user-management.telemetry.logger';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _getPort = (name: string) => Ports.get(name);

export class Logger {
  [key: string]: any;
  // @ts-expect-error TS2322: options properties are unknown, assigned to dynamic index signature
  constructor(options: Record<string, unknown> = {}) { this.prefix = options.prefix || '[Logger]'; this.debug = options.debug || false; this._metrics = { logs: 0, errors: 0, warns: 0 }; Ports.init(); }
  // @ts-expect-error strict migration — TS2774
  _log(level: string, ...args: unknown[]) { this._metrics.logs++; const logger = _getPort('logger'); if (logger && logger[level]) { logger[level](this.prefix, ...args); } else if (this.debug) { (console as unknown as Record<string, (...a: unknown[]) => void>)[level]?.(this.prefix, ...args); } }
  info(...args: unknown[]) { this._log('info', ...args); }
  warn(...args: unknown[]) { this._metrics.warns++; this._log('warn', ...args); }
  error(...args: unknown[]) { this._metrics.errors++; this._log('error', ...args); }
  // @ts-expect-error strict migration — TS2774
  debug(...args: unknown[]) { if (this.debug) this._log('debug', ...args); }
  getMetrics() { return { ...this._metrics }; }
  healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, metrics: this._metrics }; }
  getInfo() { return { moduleId: MODULE_ID, version: VERSION, prefix: this.prefix, debug: this.debug }; }
}

export function createLogger(options: Record<string, unknown>) { return new Logger(options); }
export default { Logger, createLogger, MODULE_ID, VERSION };
