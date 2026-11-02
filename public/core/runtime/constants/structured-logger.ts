// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.runtime.constants.structured-logger
// PURPOSE: Logger estruturado com níveis, contexto e formatação
// ───────────────────────────────────────────────────────────────
// PROVIDES: createStructuredLogger, LOG_LEVELS
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.9.0-STRICT-MODE' as const;
export const MODULE_ID = 'core.runtime.constants.structured-logger' as const;

/**
 * LOG_LEVELS
 * Niveis de log com prioridade numerica
 */
export const LOG_LEVELS = {
  SILENT: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4,
  TRACE: 5
} as const;
export type LogLevelName = keyof typeof LOG_LEVELS;
export type LogLevelValue = typeof LOG_LEVELS[LogLevelName];

interface LogEntry {
  level: string;
  module: string;
  message: string;
  data: unknown;
  timestamp: number;
  time: string;
}

interface HistoryOptions {
  level?: string | number;
  module?: string;
  limit?: number;
}

export interface ModuleLogger {
  error: (msg: string, data?: unknown) => void;
  warn: (msg: string, data?: unknown) => void;
  info: (msg: string, data?: unknown) => void;
  debug: (msg: string, data?: unknown) => void;
  trace: (msg: string, data?: unknown) => void;
  moduleId: string;
}

interface StructuredLoggerInfo {
  moduleId: string;
  version: string;
  currentLevel: number;
  levelName: string;
  historySize: number;
  maxHistory: number;
}

let _currentLevel: number = LOG_LEVELS.INFO;
let _history: LogEntry[] = [];
const _maxHistory: number = 50;

/**
 * Configura nivel de log
 */
export function setLevel(level: number | string): void {
  if (typeof level === 'string') {
    level = LOG_LEVELS[level.toUpperCase() as LogLevelName] || LOG_LEVELS.INFO;
  }
  _currentLevel = level as number;
}

/**
 * Obter nivel atual
 */
export function getLevel(): number {
  return _currentLevel;
}

/**
 * Cria entrada de log estruturada
 */
function _createEntry(level: string, moduleId: string, msg: string, data?: unknown): LogEntry {
  return {
    level,
    module: moduleId || 'unknown',
    message: msg,
    data: data || null,
    timestamp: Date.now(),
    time: new Date().toISOString()
  };
}

/**
 * Registra entrada no historico
 */
function _record(entry: LogEntry): void {
  _history.push(entry);
  if (_history.length > _maxHistory) {
    _history.shift();
  }
}

/**
 * Formata saida para console
 */
function _format(entry: LogEntry): string {
  const tag = `[${entry.module}]`;
  return `${tag} ${entry.message}`;
}

/**
 * Emite log no console se nivel permitir
 */
function _emit(levelNum: number, levelName: string, moduleId: string, msg: string, data?: unknown): void {
  const entry = _createEntry(levelName, moduleId, msg, data);
  _record(entry);

  if (levelNum > _currentLevel) return;

  const formatted = _format(entry);

  switch (levelName) {
    case 'ERROR':
      if (data) console.error(formatted, data);
      else console.error(formatted);
      break;
    case 'WARN':
      if (data) console.warn(formatted, data);
      else console.warn(formatted);
      break;
    case 'INFO':
      if (data) console.info(formatted, data);
      else console.info(formatted);
      break;
    case 'DEBUG':
      if (data) console.log(formatted, data);
      else console.log(formatted);
      break;
    case 'TRACE':
      if (data) console.log(formatted, data);
      else console.log(formatted);
      break;
  }
}

/**
 * Cria instancia de logger para um modulo especifico
 */
export function createModuleLogger(moduleId: string): ModuleLogger {
  return {
    error(msg: string, data?: unknown): void { _emit(LOG_LEVELS.ERROR, 'ERROR', moduleId, msg, data); },
    warn(msg: string, data?: unknown): void { _emit(LOG_LEVELS.WARN, 'WARN', moduleId, msg, data); },
    info(msg: string, data?: unknown): void { _emit(LOG_LEVELS.INFO, 'INFO', moduleId, msg, data); },
    debug(msg: string, data?: unknown): void { _emit(LOG_LEVELS.DEBUG, 'DEBUG', moduleId, msg, data); },
    trace(msg: string, data?: unknown): void { _emit(LOG_LEVELS.TRACE, 'TRACE', moduleId, msg, data); },
    moduleId
  };
}

/**
 * Obter historico de logs
 */
export function getHistory(options?: HistoryOptions): LogEntry[] {
  options = options || {};
  let result: LogEntry[] = _history;

  if (options.level) {
    const minLevel: number = typeof options.level === 'string' ? LOG_LEVELS[options.level.toUpperCase() as LogLevelName] : options.level;
    result = result.filter((entry: LogEntry) => LOG_LEVELS[entry.level as LogLevelName] <= minLevel);
  }

  if (options.module) {
    result = result.filter((entry: LogEntry) => entry.module === options!.module);
  }

  if (options.limit) {
    result = result.slice(-options.limit);
  }

  return result;
}

/**
 * Limpar historico
 */
export function clearHistory(): void {
  _history = [];
}

/**
 * Diagnostics
 */
export function info(): StructuredLoggerInfo {
  return {
    moduleId: 'structured-logger',
    version: '1.0.0',
    currentLevel: _currentLevel,
    levelName: Object.keys(LOG_LEVELS).filter((k: string) => LOG_LEVELS[k as LogLevelName] === _currentLevel)[0] || 'UNKNOWN',
    historySize: _history.length,
    maxHistory: _maxHistory
  };
}

export default {
  LOG_LEVELS,
  setLevel,
  getLevel,
  createModuleLogger,
  getHistory,
  clearHistory,
  info
};
