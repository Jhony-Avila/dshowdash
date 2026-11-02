// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.1-ENTERPRISE-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: debug-logger
// PURPOSE: DebugLogger - Controle centralizado de console.log
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   logger — exported value
//   createLogger() — exported function
//   isDebugEnabled() — exported function
//   enable() — exported function
//   disable() — exported function
//   toggle() — exported function
//   getStatus() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   localStorage
//   window.APP_CONFIG
//   (window as any).DebugLogger
//   (window as any).Environment
//   window.__dev
//   (window as any).toggleDebug
// ═══════════════════════════════════════════════════════════════
'use strict';

import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

var VERSION = '1.2.1-ENTERPRISE-STRICT-MODE';
var MODULE_ID = 'debug-logger';

var _debugEnabled: boolean | null = null;
var _loggers: Record<string, Record<string, (...args: unknown[]) => void>> = {};

function isDebugEnabled() {
  if (_debugEnabled !== null) return _debugEnabled;
  try {
    if (window.APP_CONFIG && window.APP_CONFIG.app && window.APP_CONFIG.app.debug === true) { _debugEnabled = true; return true; }
    if ((window as any).Environment && typeof (window as any).Environment.isDebug === 'function' && (window as any).Environment.isDebug() === true) { _debugEnabled = true; return true; }
    if (localStorage.getItem('debug') === 'true') { _debugEnabled = true; return true; }
    if (window.location && window.location.search && window.location.search.indexOf('debug=true') !== -1) { _debugEnabled = true; return true; }
  } catch (e) {}
  _debugEnabled = false;
  return false;
}

function invalidateCache() { _debugEnabled = null; }

function getTimestamp() { var now = new Date(); return now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0') + ':' + now.getSeconds().toString().padStart(2,'0') + '.' + now.getMilliseconds().toString().padStart(3,'0'); }

function createLogger(component: string) {
  if (_loggers[component]) return _loggers[component];
  var prefix = '[' + getTimestamp() + '][' + component + ']';
  var logger = {
    log: function() { if (isDebugEnabled()) console.log.apply(console, [prefix].concat(Array.prototype.slice.call(arguments))); },
    info: function() { if (isDebugEnabled()) console.info.apply(console, [prefix].concat(Array.prototype.slice.call(arguments))); },
    debug: function() { if (isDebugEnabled()) console.debug.apply(console, [prefix].concat(Array.prototype.slice.call(arguments))); },
    warn: function() { console.warn.apply(console, [prefix].concat(Array.prototype.slice.call(arguments))); },
    error: function() { console.error.apply(console, [prefix].concat(Array.prototype.slice.call(arguments))); },
    // @ts-expect-error strict migration — TS2345
    table: function() { if (isDebugEnabled()) console.table.apply(console, arguments); },
    group: function(label: string) { if (isDebugEnabled()) console.group(prefix + ' ' + label); },
    groupCollapsed: function(label: string) { if (isDebugEnabled()) console.groupCollapsed(prefix + ' ' + label); },
    groupEnd: function() { if (isDebugEnabled()) console.groupEnd(); },
    time: function(label: string) { if (isDebugEnabled()) console.time(component + ':' + label); },
    timeEnd: function(label: string) { if (isDebugEnabled()) console.timeEnd(component + ':' + label); },
    trace: function() { if (isDebugEnabled()) console.trace.apply(console, [prefix].concat(Array.prototype.slice.call(arguments))); },
    dir: function(obj: unknown) { if (isDebugEnabled()) console.dir(obj); },
    count: function(label: string) { if (isDebugEnabled()) console.count(component + ':' + label); },
    countReset: function(label: string) { if (isDebugEnabled()) console.countReset(component + ':' + label); },
    // @ts-expect-error strict migration — TS2345
    assert: function(condition: boolean) { if (isDebugEnabled()) console.assert.apply(console, [condition, prefix].concat(Array.prototype.slice.call(arguments, 1))); },
    clear: function() { if (isDebugEnabled()) console.clear(); }
  };
  // @ts-expect-error strict migration — TS2322
  _loggers[component] = logger;
  return logger;
}

var globalLogger = {
  // @ts-expect-error strict migration — TS2345
  log: function() { if (isDebugEnabled()) console.log.apply(console, arguments); },
  // @ts-expect-error strict migration — TS2345
  info: function() { if (isDebugEnabled()) console.info.apply(console, arguments); },
  // @ts-expect-error strict migration — TS2345
  debug: function() { if (isDebugEnabled()) console.debug.apply(console, arguments); },
  // @ts-expect-error strict migration — TS2345
  warn: function() { console.warn.apply(console, arguments); },
  // @ts-expect-error strict migration — TS2345
  error: function() { console.error.apply(console, arguments); },
  // @ts-expect-error strict migration — TS2345
  table: function() { if (isDebugEnabled()) console.table.apply(console, arguments); },
  group: function(label: string) { if (isDebugEnabled()) console.group(label); },
  groupCollapsed: function(label: string) { if (isDebugEnabled()) console.groupCollapsed(label); },
  groupEnd: function() { if (isDebugEnabled()) console.groupEnd(); },
  time: function(label: string) { if (isDebugEnabled()) console.time(label); },
  timeEnd: function(label: string) { if (isDebugEnabled()) console.timeEnd(label); },
  // @ts-expect-error strict migration — TS2345
  trace: function() { if (isDebugEnabled()) console.trace.apply(console, arguments); },
  dir: function(obj: unknown) { if (isDebugEnabled()) console.dir(obj); },
  count: function(label: string) { if (isDebugEnabled()) console.count(label); },
  countReset: function(label: string) { if (isDebugEnabled()) console.countReset(label); },
  // @ts-expect-error strict migration — TS2345
  assert: function(condition: boolean) { if (isDebugEnabled()) console.assert.apply(console, arguments); },
  clear: function() { if (isDebugEnabled()) console.clear(); },
  create: function(component: string) { return createLogger(component); }
};

function enable() { localStorage.setItem('debug', 'true'); invalidateCache(); console.log('[DebugLogger] Debug ENABLED'); }
function disable() { localStorage.removeItem('debug'); invalidateCache(); console.log('[DebugLogger] Debug DISABLED'); }
function toggle() { if (isDebugEnabled()) disable(); else enable(); return isDebugEnabled(); }
function getStatus() { return { version: VERSION, moduleId: MODULE_ID, enabled: isDebugEnabled(), loggersCount: Object.keys(_loggers).length, loggers: Object.keys(_loggers) }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, enabled: isDebugEnabled() }; }
function healthCheck() { var ready = typeof createLogger === 'function' && _debugEnabled !== undefined; return { status: ready ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { createLoggerReady: typeof createLogger === 'function', debugFlagReady: _debugEnabled !== undefined } }; }

if (typeof window !== 'undefined') {
  // DevTools always allowed
  window.__dev = window.__dev || {};
  window.__dev.debugLogger = { log: globalLogger.log, debug: globalLogger.debug, warn: globalLogger.warn, error: globalLogger.error, table: globalLogger.table, group: globalLogger.group, groupCollapsed: globalLogger.groupCollapsed, groupEnd: globalLogger.groupEnd, time: globalLogger.time, timeEnd: globalLogger.timeEnd, trace: globalLogger.trace, dir: globalLogger.dir, count: globalLogger.count, countReset: globalLogger.countReset, assert: globalLogger.assert, clear: globalLogger.clear, create: createLogger, enable: enable, disable: disable, toggle: toggle, isEnabled: isDebugEnabled, getStatus: getStatus, VERSION: VERSION, info: info, healthCheck: healthCheck };
  // Legacy globals only in non-strict mode
  if (!isStrict()) {
    (window as any).DebugLogger = { log: globalLogger.log, debug: globalLogger.debug, warn: globalLogger.warn, error: globalLogger.error, table: globalLogger.table, group: globalLogger.group, groupCollapsed: globalLogger.groupCollapsed, groupEnd: globalLogger.groupEnd, time: globalLogger.time, timeEnd: globalLogger.timeEnd, trace: globalLogger.trace, dir: globalLogger.dir, count: globalLogger.count, countReset: globalLogger.countReset, assert: globalLogger.assert, clear: globalLogger.clear, create: createLogger, enable: enable, disable: disable, toggle: toggle, isEnabled: isDebugEnabled, getStatus: getStatus, VERSION: VERSION, info: info, healthCheck: healthCheck };
    (window as any).toggleDebug = toggle;
  } else {
    recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, global: 'DebugLogger' });
    recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, global: 'toggleDebug' });
  }
}

export var logger = globalLogger;
export { createLogger, isDebugEnabled, enable, disable, toggle, getStatus, VERSION, MODULE_ID, info, healthCheck };
export default globalLogger;
