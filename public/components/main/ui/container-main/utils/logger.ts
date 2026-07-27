
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.8.0-CONSOLE-CHANNEL)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:logger
// PURPOSE: Container-Main Logger - Sistema de logging centralizado
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TELEMETRY_EVENT_NAMES from /core/runtime/constants/event-names.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   LOG_LEVELS — exported value
//   configure() — exported function
//   setLevel() — exported function
//   setConsoleLevel() — exported function
//   setEnabled() — exported function
//   setPrefix() — exported function
//   injectEventBus() — exported function
//   debug() — exported function
//   logInfo() — exported function
//   warn() — exported function
//   error() — exported function
//   critical() — exported function
//   logError() — exported function
//   getHistory() — exported function
//   clearHistory() — exported function
//   getErrorLogs() — exported function
//   addListener() — exported function
//   removeListener() — exported function
//   createLogger() — exported function
//   ... and 5 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   TELEMETRY_EVENT_NAMES.ENTRY
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Logger (with recordViolation in non-strict mode)
// ═══════════════════════════════════════════════════════════════
// @version 2.8.0-CONSOLE-CHANNEL
// @changelog v2.8.0-CONSOLE-CHANNEL - Canal de console independente (consoleLevel separado de level)
// @changelog v2.6.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v2.5.1-LOGGER-GLOBAL - Logger Global bridge
'use strict';

import { TELEMETRY_EVENT_NAMES } from '/core/runtime/constants/event-names.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '2.8.0-CONSOLE-CHANNEL';
export const MODULE_ID = 'container-main:logger';

export const LOG_LEVELS = Object.freeze({
  DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, CRITICAL: 4, NONE: 99
});

const LEVEL_NAMES = Object.freeze({ 0: 'DEBUG', 1: 'INFO', 2: 'WARN', 3: 'ERROR', 4: 'CRITICAL' });

const LEVEL_COLORS = Object.freeze({
  0: '#6b7280', 1: '#3b82f6', 2: '#f59e0b', 3: '#ef4444', 4: '#dc2626'
});

// ═══════════════════════════════════════════════════════════════
// LOGGER GLOBAL BRIDGE (STRICT MODE AWARE)
// v2.6.0: Strict mode aware with recordViolation
// v2.5.0: Resolve window.Logger (Logger Global v4.1.0) para output
// Fallback para console.log se indisponível
// ═══════════════════════════════════════════════════════════════

function _getGlobalLogger() {
  // 1. Try Core.windowAdapter first (preferred)
  if (typeof window !== 'undefined' && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get('Logger');
    if (waLogger && typeof waLogger.info === 'function') return waLogger;
  }

  return null;
}

// Map LOG_LEVELS numerico → nome de metodo do Logger Global
const _LEVEL_TO_METHOD = Object.freeze({
  0: 'debug',
  1: 'info',
  2: 'warn',
  3: 'error',
  4: 'critical'
});

let _config = {
  level: LOG_LEVELS.INFO, consoleLevel: LOG_LEVELS.WARN, enabled: true, prefix: '[ContainerMain]',
  includeTimestamp: true, includeModuleId: true, maxLogHistory: 500,
  persistLogs: false, colorize: true
};

let _logHistory: unknown[] = [];
let _listeners: Set<any> = new Set();
let _eventBus: Record<string, unknown> | null = null;

// ═══════════════════════════════════════════════════════════════
// REENTRANCY GUARD — v2.5.1
// Prevents infinite recursion: _log → _storeLog → EventBus.emit
// → listener error → logger.error → _log → ∞
// Also prevents: _log → globalLogger → EventBus → error → _log → ∞
// ═══════════════════════════════════════════════════════════════

let _isLogging = false;

// ═══════════════════════════════════════════════════════════════
// ARGS NORMALIZATION — Enterprise defensive layer
// ═══════════════════════════════════════════════════════════════
// Many consumers (cards, loaders, panels) call Logger methods with the pattern:
//   logger.error('[moduleId]', 'Human message', { error: ... })
// But the Logger contract expects:
//   logger.error(message, errorOrData, moduleId)
// This causes the 3rd arg (object) to land in moduleId position,
// producing [[object Object]] in console output.
//
// _normalizeArgs detects this pattern and restructures arguments:
//   ('[card-03]', 'Erro ao carregar', {error:'...'}) →
//   { message: '[card-03] Erro ao carregar', data: {error:'...'}, moduleId: 'card-03' }
// ═══════════════════════════════════════════════════════════════

const _MODULE_PREFIX_REGEX = /^\[([^\]]+)\]$/;

function _normalizeArgs(message: string, dataOrError: unknown, moduleId: string) {
  // Case 1: Standard correct call — moduleId is string or null
  if (moduleId === null || moduleId === undefined || typeof moduleId === 'string') {
    return { message, data: dataOrError, moduleId };
  }

  // Case 2: moduleId is an object — indicates shifted args pattern
  if (typeof moduleId === 'object') {
    const prefixMatch = typeof message === 'string' ? message.match(_MODULE_PREFIX_REGEX) : null;
    const extractedModuleId = prefixMatch ? prefixMatch[1] : null;

    if (typeof dataOrError === 'string') {
      return {
        message: extractedModuleId ? `[${extractedModuleId}] ${dataOrError}` : `${message} ${dataOrError}`,
        data: moduleId,
        moduleId: extractedModuleId
      };
    }

    if (dataOrError instanceof Error) {
      return {
        message: extractedModuleId ? `[${extractedModuleId}] ${dataOrError.message}` : `${message} ${dataOrError.message}`,
        data: moduleId,
        moduleId: extractedModuleId
      };
    }

    return {
      message: extractedModuleId ? `[${extractedModuleId}]` : message,
      data: typeof dataOrError === 'object' && dataOrError !== null ? { ...(dataOrError as Record<string, unknown>), ...(moduleId as Record<string, unknown>) } : moduleId,
      moduleId: extractedModuleId
    };
  }

  // Case 3: moduleId is something unexpected (number, boolean, etc.)
  return {
    message: `${message} ${String(moduleId)}`,
    data: dataOrError,
    moduleId: null
  };
}

function _formatTimestamp() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 23);
}

function _formatMessage(level: string, moduleId: string, message: string, data: Record<string, unknown>) {
  const parts = [];
  if (_config.includeTimestamp) parts.push(`[${_formatTimestamp()}]`);
  parts.push(`[${(LEVEL_NAMES as Record<string, unknown>)[level]}]`);
  if (_config.includeModuleId && moduleId) parts.push(`[${moduleId}]`);
  parts.push(message);
  return parts.join(' ');
}

function _createLogEntry(level: string, moduleId: string, message: string, data: Record<string, unknown> | null = null, error: Record<string, unknown> | null = null) {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: Date.now(), level, levelName: (LEVEL_NAMES as Record<string, unknown>)[level],
    moduleId: moduleId || MODULE_ID, message,
    data: data ? JSON.parse(JSON.stringify(data)) : null,
    // @ts-expect-error TS migration - TS2339
    error: error ? { name: error.name, message: error.message, stack: error.stack?.substring(0, 500) } : null
  };
}

function _storeLog(entry: Record<string, unknown>) {
  _logHistory.push(entry);
  if (_logHistory.length > _config.maxLogHistory) _logHistory.shift();
  _listeners.forEach(fn => { try { fn(entry); } catch (e) { /* ignore */ } });
  if (_eventBus?.emit) {
    try {
      (_eventBus.emit as (...args: unknown[]) => unknown)(TELEMETRY_EVENT_NAMES.ENTRY, { entry, source: MODULE_ID });
    } catch (e) {
      // v2.5.1: Silently absorb EventBus errors to prevent recursion
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// CONSOLE OUTPUT — v2.8.0
// Outputs formatted log to DevTools console (or Logger Global).
// Only called when level >= _config.consoleLevel.
// ═══════════════════════════════════════════════════════════════

function _outputToConsole(level: string, formattedMessage: unknown, data: Record<string, unknown>, error: Record<string, unknown>) {
  // v2.5.0: Try Logger Global first (enterprise pipeline)
  const globalLogger = _getGlobalLogger();
  if (globalLogger) {
    const methodName = (_LEVEL_TO_METHOD as Record<string, unknown>)[level] || 'info';
    const logMethod = globalLogger[methodName as string] || globalLogger.info;
    if (typeof logMethod === 'function') {
      const context: any = { component: MODULE_ID, moduleId: MODULE_ID };
      if (data) { context.data = data; }
      if (error) { context.error = { name: error.name, message: error.message }; }
      logMethod.call(globalLogger, formattedMessage, context);
      return;
    }
  }

  // Fallback: console.log direto (preservado para ambientes sem Logger Global)
  if (_config.colorize && typeof window !== 'undefined') {
    // @ts-expect-error TS migration - TS2352
    const style = `color: ${(LEVEL_COLORS as unknown as Record<string, unknown>)[level]}; font-weight: ${(level as number) >= LOG_LEVELS.ERROR ? 'bold' : 'normal'}`;
    console.log(
      `%c${formattedMessage}`, style, ...(data ? [data] : []), ...(error ? [error] : [])
    );
  } else {
    const consoleArgs = [formattedMessage];
    if (data) consoleArgs.push(data);
    if (error) consoleArgs.push(error);
    console.log(...consoleArgs);
  }
}

// ═══════════════════════════════════════════════════════════════
// CORE LOG — v2.8.0: Console channel independent from internal level
// v2.5.1: Reentrancy-safe delegation to window.Logger
// ═══════════════════════════════════════════════════════════════

function _log(level: string, moduleId: string, message: string, data: Record<string, unknown> | null = null, error: Record<string, unknown> | null = null) {
  if (!_config.enabled || (level as unknown as number) < _config.level) return;

  // v2.5.1: Reentrancy guard — if already inside _log(), fall through to console.log only
  if (_isLogging) {
    if ((level as unknown as number) >= _config.consoleLevel) {
      // @ts-expect-error strict migration — TS2345
      const emergencyMsg = _formatMessage(level, moduleId, message, data);
      if (_config.colorize && typeof window !== 'undefined') {
        // @ts-expect-error TS migration - TS2352
        const style = `color: ${(LEVEL_COLORS as unknown as Record<string, unknown>)[level] || '#6b7280'}; font-weight: ${(level as number) >= LOG_LEVELS.ERROR ? 'bold' : 'normal'}`;
        console.log(`%c${emergencyMsg}`, style, ...(data ? [data] : []), ...(error ? [error] : []));
      } else {
        console.log(emergencyMsg, ...(data ? [data] : []), ...(error ? [error] : []));
      }
    }
    return;
  }

  _isLogging = true;
  try {
    // v2.8.0: Internal registration always happens (history, listeners, EventBus)
    const entry = _createLogEntry(level, moduleId, message, data, error);
    _storeLog(entry);

    // v2.8.0: Console output only if level >= consoleLevel
    if ((level as unknown as number) >= _config.consoleLevel) {
      // @ts-expect-error strict migration — TS2345
      const formattedMessage = _formatMessage(level, moduleId, message, data);
      // @ts-expect-error strict migration — TS2345
      _outputToConsole(level, formattedMessage, data, error);
    }

    return entry;
  } finally {
    _isLogging = false;
  }
}

export function configure(options = {}) { Object.assign(_config, options); return { ..._config }; }
// @ts-expect-error TS migration - TS2322
export function setLevel(level: string | number) { if (typeof level === 'string') level = ((LOG_LEVELS as Record<string, unknown>)[level.toUpperCase()] ?? LOG_LEVELS.INFO) as number; _config.level = level as number; }
// @ts-expect-error TS migration - TS2322
export function setConsoleLevel(level: string | number) { if (typeof level === 'string') level = ((LOG_LEVELS as Record<string, unknown>)[level.toUpperCase()] ?? LOG_LEVELS.WARN) as number; _config.consoleLevel = level as number; }
export function setEnabled(enabled: boolean) { _config.enabled = enabled; }
export function setPrefix(prefix: string) { _config.prefix = prefix; }
export function injectEventBus(eventBus: unknown) { _eventBus = eventBus as Record<string, unknown>; }

export function debug(message: string, data: Record<string, unknown> | null = null, moduleId: string | null = null) {
  // @ts-expect-error strict migration — TS2345
  const norm = _normalizeArgs(message, data, moduleId);
  // @ts-expect-error TS migration - TS2345
  return _log(LOG_LEVELS.DEBUG, norm.moduleId, norm.message, norm.data);
}

export function logInfo(message: string, data: Record<string, unknown> | null = null, moduleId: string | null = null) {
  // @ts-expect-error strict migration — TS2345
  const norm = _normalizeArgs(message, data, moduleId);
  // @ts-expect-error TS migration - TS2345
  return _log(LOG_LEVELS.INFO, norm.moduleId, norm.message, norm.data);
}

export function warn(message: string, data: Record<string, unknown> | null = null, moduleId: string | null = null) {
  // @ts-expect-error strict migration — TS2345
  const norm = _normalizeArgs(message, data, moduleId);
  // @ts-expect-error TS migration - TS2345
  return _log(LOG_LEVELS.WARN, norm.moduleId, norm.message, norm.data);
}

export function error(message: string, errorOrData: unknown = null, moduleId: string | null = null) {
  // @ts-expect-error strict migration — TS2345
  const norm = _normalizeArgs(message, errorOrData, moduleId);
  const isError = norm.data instanceof Error;
  // @ts-expect-error TS migration - TS2345
  return _log(LOG_LEVELS.ERROR, norm.moduleId, norm.message, isError ? null : norm.data, isError ? norm.data : null);
}

export function critical(message: string, errorOrData: unknown = null, moduleId: string | null = null) {
  // @ts-expect-error strict migration — TS2345
  const norm = _normalizeArgs(message, errorOrData, moduleId);
  const isError = norm.data instanceof Error;
  // @ts-expect-error TS migration - TS2345
  return _log(LOG_LEVELS.CRITICAL, norm.moduleId, norm.message, isError ? null : norm.data, isError ? norm.data : null);
}

export function logError(err: Record<string, unknown>, context = {}, moduleId: string | null = null) {
  const safeModuleId = (typeof moduleId === 'object' && moduleId !== null) ? null : moduleId;
  // @ts-expect-error TS migration - TS2345
  return _log(LOG_LEVELS.ERROR, safeModuleId, err.message || String(err), context, err instanceof Error ? err : null);
}

export function getHistory(options: Record<string, unknown> = {}) {
  const { level = null, moduleId = null, limit = 100, since = null } = options;
  let filtered = [..._logHistory];
  // @ts-expect-error strict migration — TS2571
  if (level !== null) filtered = filtered.filter(e => (e as Record<string, unknown>).level >= level!);
  // @ts-expect-error TS migration - TS2339
  if (moduleId) filtered = filtered.filter(e => (e as Record<string, unknown>).moduleId === moduleId || e.moduleId?.includes(moduleId));
  // @ts-expect-error strict migration — TS2571
  if (since) filtered = filtered.filter(e => (e as Record<string, unknown>).timestamp >= since);
  // @ts-expect-error strict migration — TS18046
  return filtered.slice(-limit);
}

export function clearHistory() { const count = _logHistory.length; _logHistory = []; return count; }
export function getErrorLogs(limit = 50) { return getHistory({ level: LOG_LEVELS.ERROR, limit }); }

export function addListener(callback: (...args: unknown[]) => void) { _listeners.add(callback); return () => _listeners.delete(callback); }
export function removeListener(callback: (...args: unknown[]) => void) { _listeners.delete(callback); }

export function createLogger(moduleId: string, options: Record<string, unknown> = {}) {
  const prefix = options.prefix || moduleId;
  return {
    debug: (msg: string, data?: Record<string, unknown>) => debug(msg, data as Record<string, unknown>, moduleId as string),
    info: (msg: string, data?: Record<string, unknown>) => logInfo(msg, data as Record<string, unknown>, moduleId as string),
    warn: (msg: string, data?: Record<string, unknown>) => warn(msg, data as Record<string, unknown>, moduleId as string),
    error: (msg: string, errOrData?: unknown) => error(msg, errOrData, moduleId as string),
    critical: (msg: string, errOrData?: unknown) => critical(msg, errOrData, moduleId as string),
    logError: (err: Record<string, unknown>, ctx?: Record<string, unknown>) => logError(err, ctx as Record<string, unknown>, moduleId as string),
    time: (label: string) => { const start = performance.now(); return () => { const duration = performance.now() - start; debug(`${label}: ${duration.toFixed(2)}ms`, { duration }, moduleId); return duration; }; },
    group: (label: string, fn: (...args: unknown[]) => void) => { console.group(label); try { return fn(); } finally { console.groupEnd(); } },
    assert: (condition: Record<string, unknown>, msg: string, data: Record<string, unknown>) => { if (!condition) error(`Assertion failed: ${msg}`, data, moduleId); }
  };
}

export function logFromErrorHandler(errorInfo: Record<string, unknown>) {
  const level = errorInfo.severity === 'critical' ? LOG_LEVELS.CRITICAL : LOG_LEVELS.ERROR;
  // @ts-expect-error TS migration - TS2345, TS2339
  _log(level, errorInfo.context?.moduleId || 'error-handler', errorInfo.message, errorInfo.context, {
    name: errorInfo.name, message: errorInfo.message, stack: errorInfo.stack
  });
}

export function healthCheck() {
  const globalLogger = _getGlobalLogger();
  return {
    status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID,
    strictMode: isStrict(),
    config: { level: LEVEL_NAMES[_config.level], consoleLevel: LEVEL_NAMES[_config.consoleLevel], enabled: _config.enabled },
    historySize: _logHistory.length, listenerCount: _listeners.size,
    // @ts-expect-error TS migration - TS2365
    errorCount: _logHistory.filter(e => (e as Record<string, unknown>).level >= LOG_LEVELS.ERROR).length,
    globalLoggerConnected: !!globalLogger
  };
}

export function info() {
  const globalLogger = _getGlobalLogger();
  return {
    moduleId: MODULE_ID, version: VERSION,
    strictMode: isStrict(),
    levels: Object.keys(LOG_LEVELS),
    historySize: _logHistory.length,
    config: { ..._config, maxLogHistory: _config.maxLogHistory },
    globalLoggerConnected: !!globalLogger
  };
}

export function init(options: Record<string, unknown> = {}) {
  if (options.eventBus) _eventBus = options.eventBus as Record<string, unknown>;
  if (options.level !== undefined) setLevel((options.level as string));
  if (options.consoleLevel !== undefined) setConsoleLevel((options.consoleLevel as string));
  if (options.enabled !== undefined) setEnabled((options.enabled as boolean));
  if (options.prefix) setPrefix((options.prefix as string));
  return { ok: true, version: VERSION };
}

export const Logger = {
  debug, info: logInfo, warn, error, critical, logError,
  setLevel, setConsoleLevel, setEnabled, configure,
  getHistory, clearHistory, getErrorLogs,
  addListener, removeListener, createLogger
};

export default {
  VERSION, MODULE_ID, LOG_LEVELS, Logger,
  debug, info: logInfo, warn, error, critical, logError,
  setLevel, setConsoleLevel, setEnabled, setPrefix, configure,
  injectEventBus, init,
  getHistory, clearHistory, getErrorLogs,
  addListener, removeListener,
  createLogger, logFromErrorHandler, healthCheck, moduleInfo: info
};
