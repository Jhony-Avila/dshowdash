// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.footer.core.logger
// PURPOSE: Footer Logger - Enterprise wrapper for Logger global
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract INJECT_PORTS - injectPorts() for dependency injection
// @contract GET_PORTS - getPorts() returns ports snapshot
// @contract LOG - log() logs messages with level and moduleId
// @contract SET_DEBUG - setDebug() enables/disables debug mode
// @contract CREATE_LOGGER - createLogger() creates module-specific logger
// @contract GET_METRICS - getMetrics() returns logging metrics
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   log() — exported function
//   setDebug() — exported function
//   isDebugEnabled() — exported function
//   createLogger() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ───────────────────────────────────────────────────────────────
// @changelog v10.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v10.2.1-ENTERPRISE: Fixed duplicate MODULE_ID/VERSION export
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'footer-logger';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _debug = false;
let _metrics = { logs: 0, errors: 0, warns: 0 };

export function log(level: string, moduleId: string, ...args: unknown[]) {
  _metrics.logs++;
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = `[${moduleId}]`;
  if (level === 'error') { _metrics.errors++; logger.error?.(prefix, ...args); return; }
  if (level === 'warn') { _metrics.warns++; logger.warn?.(prefix, ...args); return; }
  if (_debug) logger.debug?.(prefix, ...args);
}

export function setDebug(enabled: boolean) { _debug = Boolean(enabled); }
export function isDebugEnabled() { return _debug; }
export function createLogger(moduleId: string) { return { debug: (...args: unknown[]) => log('debug', moduleId, ...args), info: (...args: unknown[]) => log('info', moduleId, ...args), warn: (...args: unknown[]) => log('warn', moduleId, ...args), error: (...args: unknown[]) => log('error', moduleId, ...args) }; }
export function getMetrics() { return { ..._metrics, debugEnabled: _debug }; }

export function info() {
  const portsSnapshot = Ports.snapshot();
  const logger = _getPort('logger');
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), loggerReady: !!logger, portsInitialized: portsSnapshot._initialized };
}

export function healthCheck() {
  const portsSnapshot = Ports.snapshot();
  const logger = _getPort('logger');
  const loggerAvailable = !!logger;
  return { status: loggerAvailable ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { loggerAvailable, portsInitialized: portsSnapshot._initialized }, metrics: getMetrics(), portsInitialized: portsSnapshot._initialized };
}

export default { log, setDebug, isDebugEnabled, createLogger, getMetrics, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
