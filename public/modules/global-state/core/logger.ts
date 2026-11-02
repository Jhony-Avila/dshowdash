// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.4.0-PORTSFACTORY)
// ═══════════════════════════════════════════════════════════════
// MODULE: global-state:logger
// PURPOSE: Global State - Logger via Ports pattern
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   MODULE_ID, VERSION, _debug, _log, logError, logWarn, logDebug, logInfo
//   injectPorts, getPorts, isLoggerAvailable, info, healthCheck
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'global-state';
const VERSION = '4.4.0-PORTSFACTORY';

const _Ports = createCorePorts({ moduleId: `${MODULE_ID}:logger` });

function _getPort(name: string) {
  return _Ports.get(name);
}

function injectPorts(ports: Record<string, unknown>) { return _Ports.inject(ports); }
function getPorts() { return _Ports.snapshot(); }

const _debug = () => typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.app && window.APP_CONFIG.app.debug ? true : false;

const _log = function(level: string) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === 'error') { if (logger.error) logger.error(...[prefix].concat(args)); return; }
  if (level === 'warn') { if (logger.warn) logger.warn(...[prefix].concat(args)); return; }
  if (_debug() && logger.debug) logger.debug(...[prefix].concat(args));
};


// @ts-expect-error TS migration - TS2556
function logError() { const args = Array.prototype.slice.call(arguments); _log(...['error'].concat(args)); }

// @ts-expect-error TS migration - TS2556
function logWarn() { const args = Array.prototype.slice.call(arguments); _log(...['warn'].concat(args)); }

// @ts-expect-error TS migration - TS2556
function logDebug() { const args = Array.prototype.slice.call(arguments); _log(...['debug'].concat(args)); }

// @ts-expect-error TS migration - TS2556
function logInfo() { const args = Array.prototype.slice.call(arguments); _log(...['info'].concat(args)); }

function isLoggerAvailable() { return !!_getPort('logger'); }

function info() { return { moduleId: MODULE_ID, version: VERSION, loggerAvailable: isLoggerAvailable(), portsInitialized: _Ports.isInitialized() }; }

function healthCheck() {
  return { status: _Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { portsInitialized: _Ports.isInitialized(), loggerAvailable: isLoggerAvailable() } };
}

export { MODULE_ID, VERSION, _debug, _log, logError, logWarn, logDebug, logInfo, injectPorts, getPorts, isLoggerAvailable, info, healthCheck };
export default { MODULE_ID, VERSION, _debug, _log, logError, logWarn, logDebug, logInfo, injectPorts, getPorts, isLoggerAvailable, info, healthCheck };
