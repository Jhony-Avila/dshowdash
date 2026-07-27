// App Core: Logger Wrapper
// Reexporta de public/assets/js/core/logger-global
// Versão: 1.0.0-ENTERPRISE
// Migrado para TypeScript: 2026-02-25

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
  [key: string]: unknown;
}

interface LoggerInstance {
  log: (level: LogLevel, message: string, context?: LogContext) => void;
  [key: string]: unknown;
}

declare global {
  interface Window {
    LoggerGlobal?: LoggerInstance;
  }
}

const getLoggerGlobal = (): LoggerInstance | null => window.LoggerGlobal || null;

export function getLogger(): LoggerInstance | null {
  return getLoggerGlobal();
}

export function log(level: LogLevel, message: string, context: LogContext = {}): void {
  const logger = getLoggerGlobal();
  if (logger && typeof logger.log === 'function') {
    return logger.log(level, message, context);
  }
  const consoleFn = console[level] || console.log;
  consoleFn(`[${level}]`, message, context);
}

export function info(message: string, context: LogContext = {}): void {
  return log('info', message, context);
}

export function warn(message: string, context: LogContext = {}): void {
  return log('warn', message, context);
}

export function error(message: string, context: LogContext = {}): void {
  return log('error', message, context);
}

export function debug(message: string, context: LogContext = {}): void {
  return log('debug', message, context);
}

export default { getLogger, log, info, warn, error, debug };
