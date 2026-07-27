// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.3.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: security.csrf-token-manager.utils.logger
// PURPOSE: CSRF Token Manager - Logger v3.3.0-P17WI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   initLogger() — exported function
//   log() — exported function
//   logInfo() — exported function
//   warn() — exported function
//   logWarn() — exported function
//   error() — exported function
//   logError() — exported function
//   debug() — exported function
//   healthCheck() — exported function
//   info() — exported function
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
import { createCorePorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '3.3.0-P17WI';
export const MODULE_ID = 'security.csrf-token-manager.utils.logger';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
let _config = { debug: false, namespace: 'CSRF' };
let _initialized = false;
function _debug() { if (_config.debug) return true; const cfg = _getPort('config'); if (cfg && cfg.app && cfg.app.debug) return true; return false; }
function _logGlobal(level: string, prefix: string, message: string, data?: unknown) { const logger = _getPort('logger'); if (!logger) return; const fn = logger[level] || logger.info; if (typeof fn !== 'function') return; if (data !== undefined && data !== null) fn(prefix, message, data); else fn(prefix, message); }
export function initLogger(config: { security?: { csrfDebug?: boolean }; debug?: boolean; namespace?: string } = {}) {
  const securityConfig = config.security || {};_config = { debug: config.debug !== undefined ? config.debug : (securityConfig.csrfDebug !== undefined ? securityConfig.csrfDebug : false), namespace: config.namespace || 'CSRF' };_initialized = true;
}

export function log() { if (_debug()) { const args = Array.prototype.slice.call(arguments); const prefix = `[${_config.namespace}]`; _logGlobal('info', prefix, args.join(' ')); } }
export function logInfo(context: string, message: string, data?: unknown) { if (_debug()) { const prefix = `[${_config.namespace}:${context}]`; _logGlobal('info', prefix, message, data); } }

export function warn() { const args = Array.prototype.slice.call(arguments); const prefix = `[${_config.namespace}]`; _logGlobal('warn', prefix, args.join(' ')); }
export function logWarn(context: string, message: string, data?: unknown) { const prefix = `[${_config.namespace}:${context}]`; _logGlobal('warn', prefix, message, data); }

export function error() { const args = Array.prototype.slice.call(arguments); const prefix = `[${_config.namespace}]`; _logGlobal('error', prefix, args.join(' ')); }
export function logError(context: string, message: string, err?: unknown) { const prefix = `[${_config.namespace}:${context}]`; _logGlobal('error', prefix, message, err); }

export function debug() { if (_debug()) { const args = Array.prototype.slice.call(arguments); const prefix = `[${_config.namespace}]`; _logGlobal('debug', prefix, args.join(' ')); } }
export function healthCheck() { const checks = { available: true, initialized: _initialized, loggerReady: !!_getPort('logger'), portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, debugEnabled: _debug(), version: VERSION, moduleId: MODULE_ID, loggerAvailable: !!_getPort('logger'), portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _initialized, debugEnabled: _debug(), namespace: _config.namespace, loggerReady: !!_getPort('logger'), portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }
export default { initLogger, log, logInfo, warn, logWarn, error, logError, debug, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
