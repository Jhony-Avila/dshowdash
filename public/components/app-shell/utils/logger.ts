/**
 * @file App Shell Logger
 * @version 1.4.0-STRICT-MODE
 * @module app-shell/utils/logger
 *
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires /core/runtime/enterprise/strict-mode.js (isStrict, recordViolation)
 *
 * @provides VERSION, MODULE_ID, LOG_LEVELS
 * @provides debug, logInfo (alias: info), warn, error, createLogger
 * @provides setLevel, getLevel, configure, getConfig
 * @provides enableModule, disableModule, enableOnlyModules, enableAllModules
 * @provides getHistory, clearHistory, subscribe
 * @provides getMetrics, healthCheck, moduleInfo
 *
 * @browserAPI console.log (with color styling)
 *
 * WINDOW ACCESS (controlado por strict-mode):
 *   window.Logger — delegação para Logger Global (bloqueado em strict mode)
 *
 * @description
 * Structured logging with module filtering and history.
 * v1.4.0: Migração para strict-mode NR-FULL
 * v1.3.1: Fixed duplicate 'info' export (renamed metadata function to moduleInfo).
 * v1.3.0: Delegates to window.Logger (Logger Global v4.1.0) when available.
 * v1.2.0: All levels use console.log with color styling (no stacktrace pollution).
 *
 * @example
 * import { debug, logInfo, error, createLogger } from './logger.js';
 * const log = createLogger('my-module');
 * log.info('Message', { data: 123 });
 * ============================================================================
 */
'use strict';

import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell-logger';

const hasWindow = typeof window !== 'undefined';

export const LOG_LEVELS = Object.freeze({ DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, SILENT: 4 });

const _config = { level: LOG_LEVELS.INFO, enabledModules: [] as DynObj, disabledModules: [] as DynObj, showTimestamp: true, showModule: true, showLevel: true, colorize: true, maxHistory: 500, persistToStorage: false };

const _history: DynObj[] = [];
const _subscribers: DynObj[] = [];
const _metrics = { debug: 0, info: 0, warn: 0, error: 0, delegated: 0 };

const COLORS = { DEBUG: '#9E9E9E', INFO: '#2196F3', WARN: '#FF9800', ERROR: '#F44336' };

/**
 * NR-FULL: Resolução de Logger Global
 * 1. Core.windowAdapter.get() primeiro
 * 2. Fase B: window.Logger bloqueado — registra violação, retorna null
 */
function _resolveLoggerGlobal() {
  // 1. Tentar via Core.windowAdapter
  if (hasWindow && window.Core && window.Core.windowAdapter) {
    // @ts-expect-error strict migration — TS2722, TS18048
    const fromAdapter = window.Core.windowAdapter.get('Logger');
    if (fromAdapter) return fromAdapter;
  }


  return null;
}

function _shouldLog(level: DynObj, module: DynObj) {
  if (level < _config.level) return false;
  if (_config.enabledModules.length > 0 && _config.enabledModules.indexOf(module) < 0 && _config.enabledModules.indexOf('*') < 0) return false;
  if (_config.disabledModules.indexOf(module) >= 0) return false;
  return true;
}

function _formatMessage(level: DynObj, module: DynObj, message: string) {
  const parts = [];
  if (_config.showTimestamp) parts.push(`[${new Date().toISOString().substr(11, 12)}]`);
  if (_config.showLevel) parts.push(`[${level}]`);
  if (_config.showModule && module) parts.push(`[${module}]`);
  parts.push(message);
  return parts.join(' ');
}

function _addToHistory(entry: DynObj) {
  _history.push(entry);
  if (_history.length > _config.maxHistory) _history.shift();
  _subscribers.forEach(cb => { try { cb(entry); } catch (e) {} });
}

function _tryDelegateToGlobal(level: DynObj, module: DynObj, message: string, data: DynObj) {
  // NR-FULL: Usar resolução controlada
  const logger = _resolveLoggerGlobal();
  if (logger && logger[level.toLowerCase()]) {
    try {
      logger[level.toLowerCase()](message, data, module);
      _metrics.delegated++;
      return true;
    } catch (e) {}
  }
  return false;
}

function _log(level: DynObj, levelName: string, module: DynObj, message: string, data: DynObj) {
  (_metrics as DynObj)[levelName.toLowerCase()]++;
  if (!_shouldLog(level, module)) return;

  const entry = { level, levelName, module, message, data, timestamp: Date.now(), formatted: _formatMessage(levelName, module, message) };
  _addToHistory(entry);

  if (_tryDelegateToGlobal(levelName, module, message, data)) return;

  const formatted = entry.formatted;
  if (_config.colorize && typeof console !== 'undefined') {
    const color = (COLORS as DynObj)[levelName] || COLORS.INFO;
    if (data !== undefined) console.log(`%c${formatted}`, `color:${color}`, data);
    else console.log(`%c${formatted}`, `color:${color}`);
  } else {
    if (data !== undefined) console.log(formatted, data);
    else console.log(formatted);
  }
}

export function debug(message: string, data: DynObj, module: DynObj) { _log(LOG_LEVELS.DEBUG, 'DEBUG', module || MODULE_ID, message, data); }
export function logInfo(message: string, data: DynObj, module: DynObj) { _log(LOG_LEVELS.INFO, 'INFO', module || MODULE_ID, message, data); }
export const info = logInfo;
export function warn(message: string, data: DynObj, module: DynObj) { _log(LOG_LEVELS.WARN, 'WARN', module || MODULE_ID, message, data); }
export function error(message: string, data: DynObj, module: DynObj) { _log(LOG_LEVELS.ERROR, 'ERROR', module || MODULE_ID, message, data); }

export function createLogger(moduleId: string) {
  return {
    debug(msg: string, data: DynObj) { debug(msg, data, moduleId); },
    info(msg: string, data: DynObj) { logInfo(msg, data, moduleId); },
    warn(msg: string, data: DynObj) { warn(msg, data, moduleId); },
    error(msg: string, data: DynObj) { error(msg, data, moduleId); }
  };
}

export function setLevel(level: DynObj) { _config.level = typeof level === 'number' ? level : ((LOG_LEVELS as DynObj)[level.toUpperCase()] || LOG_LEVELS.INFO); }
export function getLevel() { return _config.level; }
export function getLevelName() { const names = Object.keys(LOG_LEVELS); for (let i = 0; i < names.length; i++) { if ((LOG_LEVELS as DynObj)[names[i]] === _config.level) return names[i]; } return 'UNKNOWN'; }
export function getInfo() { return moduleInfo(); }

export function configure(options: DynObj) {
  if (options.level !== undefined) setLevel(options.level);
  if (options.showTimestamp !== undefined) _config.showTimestamp = !!options.showTimestamp;
  if (options.showModule !== undefined) _config.showModule = !!options.showModule;
  if (options.showLevel !== undefined) _config.showLevel = !!options.showLevel;
  if (options.colorize !== undefined) _config.colorize = !!options.colorize;
  if (options.maxHistory !== undefined) _config.maxHistory = Math.max(0, options.maxHistory);
}

export function getConfig() { return Object.assign({}, _config); }
export function enableModule(module: DynObj) { if (_config.enabledModules.indexOf(module) < 0) _config.enabledModules.push(module); }
export function disableModule(module: DynObj) { if (_config.disabledModules.indexOf(module) < 0) _config.disabledModules.push(module); }
export function enableOnlyModules(modules: DynObj) { _config.enabledModules = modules.slice(); }
export function enableAllModules() { _config.enabledModules = ['*']; _config.disabledModules = []; }

export function getHistory(filter: DynObj) {
  if (!filter) return _history.slice();
  return _history.filter(e => {
    if (filter.level !== undefined && e.level < filter.level) return false;
    if (filter.module && e.module !== filter.module) return false;
    return true;
  });
}

export function clearHistory() { _history.length = 0; }
export function subscribe(callback: DynObj) { if (typeof callback === 'function') _subscribers.push(callback); return () => { const idx = _subscribers.indexOf(callback); if (idx >= 0) _subscribers.splice(idx, 1); }; }

export function getMetrics() { return Object.assign({}, _metrics, { historySize: _history.length, subscriberCount: _subscribers.length }); }

export function healthCheck() {
  const checks = { operational: true, historyNotFull: _history.length < _config.maxHistory * 0.9, lowErrorRate: _metrics.info + _metrics.debug === 0 || _metrics.error / (_metrics.info + _metrics.debug + _metrics.error) < 0.3, strictModeCompliant: true };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 4 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/4`, checks, metrics: getMetrics(), strictMode: isStrict(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function moduleInfo() {
  const loggerGlobal = _resolveLoggerGlobal();
  return { moduleId: MODULE_ID, version: VERSION, config: getConfig(), metrics: getMetrics(), historySize: _history.length, delegatingToGlobal: !!loggerGlobal, strictMode: isStrict(), timestamp: Date.now() };
}

const AppShellLogger = {
  VERSION,
  MODULE_ID,
  LOG_LEVELS,
  debug,
  info: logInfo,
  logInfo,
  warn,
  error,
  createLogger,
  setLevel,
  getLevel,
  getLevelName,
  getInfo,
  configure,
  getConfig,
  enableModule,
  disableModule,
  enableOnlyModules,
  enableAllModules,
  getHistory,
  clearHistory,
  subscribe,
  getMetrics,
  healthCheck,
  moduleInfo
};

// Strict Mode: Controle de exposição global
if (hasWindow) {
  // DevTools sempre permitido
  if (typeof (window as any).__DEVTOOLS__ !== 'undefined') {
    (window as any).__DEVTOOLS__.AppShellLogger = AppShellLogger;
  }
}

export default AppShellLogger;
