import { TELEMETRY_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "2.8.0-CONSOLE-CHANNEL";
const MODULE_ID = "container-main:logger";
const LOG_LEVELS = Object.freeze({
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4,
  NONE: 99
});
const LEVEL_NAMES = Object.freeze({ 0: "DEBUG", 1: "INFO", 2: "WARN", 3: "ERROR", 4: "CRITICAL" });
const LEVEL_COLORS = Object.freeze({
  0: "#6b7280",
  1: "#3b82f6",
  2: "#f59e0b",
  3: "#ef4444",
  4: "#dc2626"
});
function _getGlobalLogger() {
  if (typeof window !== "undefined" && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get("Logger");
    if (waLogger && typeof waLogger.info === "function") return waLogger;
  }
  return null;
}
const _LEVEL_TO_METHOD = Object.freeze({
  0: "debug",
  1: "info",
  2: "warn",
  3: "error",
  4: "critical"
});
let _config = {
  level: LOG_LEVELS.INFO,
  consoleLevel: LOG_LEVELS.WARN,
  enabled: true,
  prefix: "[ContainerMain]",
  includeTimestamp: true,
  includeModuleId: true,
  maxLogHistory: 500,
  persistLogs: false,
  colorize: true
};
let _logHistory = [];
let _listeners = /* @__PURE__ */ new Set();
let _eventBus = null;
let _isLogging = false;
const _MODULE_PREFIX_REGEX = /^\[([^\]]+)\]$/;
function _normalizeArgs(message, dataOrError, moduleId) {
  if (moduleId === null || moduleId === void 0 || typeof moduleId === "string") {
    return { message, data: dataOrError, moduleId };
  }
  if (typeof moduleId === "object") {
    const prefixMatch = typeof message === "string" ? message.match(_MODULE_PREFIX_REGEX) : null;
    const extractedModuleId = prefixMatch ? prefixMatch[1] : null;
    if (typeof dataOrError === "string") {
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
      data: typeof dataOrError === "object" && dataOrError !== null ? { ...dataOrError, ...moduleId } : moduleId,
      moduleId: extractedModuleId
    };
  }
  return {
    message: `${message} ${String(moduleId)}`,
    data: dataOrError,
    moduleId: null
  };
}
function _formatTimestamp() {
  const now = /* @__PURE__ */ new Date();
  return now.toISOString().replace("T", " ").substring(0, 23);
}
function _formatMessage(level, moduleId, message, data) {
  const parts = [];
  if (_config.includeTimestamp) parts.push(`[${_formatTimestamp()}]`);
  parts.push(`[${LEVEL_NAMES[level]}]`);
  if (_config.includeModuleId && moduleId) parts.push(`[${moduleId}]`);
  parts.push(message);
  return parts.join(" ");
}
function _createLogEntry(level, moduleId, message, data = null, error2 = null) {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: Date.now(),
    level,
    levelName: LEVEL_NAMES[level],
    moduleId: moduleId || MODULE_ID,
    message,
    data: data ? JSON.parse(JSON.stringify(data)) : null,
    // @ts-expect-error TS migration - TS2339
    error: error2 ? { name: error2.name, message: error2.message, stack: error2.stack?.substring(0, 500) } : null
  };
}
function _storeLog(entry) {
  _logHistory.push(entry);
  if (_logHistory.length > _config.maxLogHistory) _logHistory.shift();
  _listeners.forEach((fn) => {
    try {
      fn(entry);
    } catch (e) {
    }
  });
  if (_eventBus?.emit) {
    try {
      _eventBus.emit(TELEMETRY_EVENT_NAMES.ENTRY, { entry, source: MODULE_ID });
    } catch (e) {
    }
  }
}
function _outputToConsole(level, formattedMessage, data, error2) {
  const globalLogger = _getGlobalLogger();
  if (globalLogger) {
    const methodName = _LEVEL_TO_METHOD[level] || "info";
    const logMethod = globalLogger[methodName] || globalLogger.info;
    if (typeof logMethod === "function") {
      const context = { component: MODULE_ID, moduleId: MODULE_ID };
      if (data) {
        context.data = data;
      }
      if (error2) {
        context.error = { name: error2.name, message: error2.message };
      }
      logMethod.call(globalLogger, formattedMessage, context);
      return;
    }
  }
  if (_config.colorize && typeof window !== "undefined") {
    const style = `color: ${LEVEL_COLORS[level]}; font-weight: ${level >= LOG_LEVELS.ERROR ? "bold" : "normal"}`;
    console.log(
      `%c${formattedMessage}`,
      style,
      ...data ? [data] : [],
      ...error2 ? [error2] : []
    );
  } else {
    const consoleArgs = [formattedMessage];
    if (data) consoleArgs.push(data);
    if (error2) consoleArgs.push(error2);
    console.log(...consoleArgs);
  }
}
function _log(level, moduleId, message, data = null, error2 = null) {
  if (!_config.enabled || level < _config.level) return;
  if (_isLogging) {
    if (level >= _config.consoleLevel) {
      const emergencyMsg = _formatMessage(level, moduleId, message, data);
      if (_config.colorize && typeof window !== "undefined") {
        const style = `color: ${LEVEL_COLORS[level] || "#6b7280"}; font-weight: ${level >= LOG_LEVELS.ERROR ? "bold" : "normal"}`;
        console.log(`%c${emergencyMsg}`, style, ...data ? [data] : [], ...error2 ? [error2] : []);
      } else {
        console.log(emergencyMsg, ...data ? [data] : [], ...error2 ? [error2] : []);
      }
    }
    return;
  }
  _isLogging = true;
  try {
    const entry = _createLogEntry(level, moduleId, message, data, error2);
    _storeLog(entry);
    if (level >= _config.consoleLevel) {
      const formattedMessage = _formatMessage(level, moduleId, message, data);
      _outputToConsole(level, formattedMessage, data, error2);
    }
    return entry;
  } finally {
    _isLogging = false;
  }
}
function configure(options = {}) {
  Object.assign(_config, options);
  return { ..._config };
}
function setLevel(level) {
  if (typeof level === "string") level = LOG_LEVELS[level.toUpperCase()] ?? LOG_LEVELS.INFO;
  _config.level = level;
}
function setConsoleLevel(level) {
  if (typeof level === "string") level = LOG_LEVELS[level.toUpperCase()] ?? LOG_LEVELS.WARN;
  _config.consoleLevel = level;
}
function setEnabled(enabled) {
  _config.enabled = enabled;
}
function setPrefix(prefix) {
  _config.prefix = prefix;
}
function injectEventBus(eventBus) {
  _eventBus = eventBus;
}
function debug(message, data = null, moduleId = null) {
  const norm = _normalizeArgs(message, data, moduleId);
  return _log(LOG_LEVELS.DEBUG, norm.moduleId, norm.message, norm.data);
}
function logInfo(message, data = null, moduleId = null) {
  const norm = _normalizeArgs(message, data, moduleId);
  return _log(LOG_LEVELS.INFO, norm.moduleId, norm.message, norm.data);
}
function warn(message, data = null, moduleId = null) {
  const norm = _normalizeArgs(message, data, moduleId);
  return _log(LOG_LEVELS.WARN, norm.moduleId, norm.message, norm.data);
}
function error(message, errorOrData = null, moduleId = null) {
  const norm = _normalizeArgs(message, errorOrData, moduleId);
  const isError = norm.data instanceof Error;
  return _log(LOG_LEVELS.ERROR, norm.moduleId, norm.message, isError ? null : norm.data, isError ? norm.data : null);
}
function critical(message, errorOrData = null, moduleId = null) {
  const norm = _normalizeArgs(message, errorOrData, moduleId);
  const isError = norm.data instanceof Error;
  return _log(LOG_LEVELS.CRITICAL, norm.moduleId, norm.message, isError ? null : norm.data, isError ? norm.data : null);
}
function logError(err, context = {}, moduleId = null) {
  const safeModuleId = typeof moduleId === "object" && moduleId !== null ? null : moduleId;
  return _log(LOG_LEVELS.ERROR, safeModuleId, err.message || String(err), context, err instanceof Error ? err : null);
}
function getHistory(options = {}) {
  const { level = null, moduleId = null, limit = 100, since = null } = options;
  let filtered = [..._logHistory];
  if (level !== null) filtered = filtered.filter((e) => e.level >= level);
  if (moduleId) filtered = filtered.filter((e) => e.moduleId === moduleId || e.moduleId?.includes(moduleId));
  if (since) filtered = filtered.filter((e) => e.timestamp >= since);
  return filtered.slice(-limit);
}
function clearHistory() {
  const count = _logHistory.length;
  _logHistory = [];
  return count;
}
function getErrorLogs(limit = 50) {
  return getHistory({ level: LOG_LEVELS.ERROR, limit });
}
function addListener(callback) {
  _listeners.add(callback);
  return () => _listeners.delete(callback);
}
function removeListener(callback) {
  _listeners.delete(callback);
}
function createLogger(moduleId, options = {}) {
  const prefix = options.prefix || moduleId;
  return {
    debug: (msg, data) => debug(msg, data, moduleId),
    info: (msg, data) => logInfo(msg, data, moduleId),
    warn: (msg, data) => warn(msg, data, moduleId),
    error: (msg, errOrData) => error(msg, errOrData, moduleId),
    critical: (msg, errOrData) => critical(msg, errOrData, moduleId),
    logError: (err, ctx) => logError(err, ctx, moduleId),
    time: (label) => {
      const start = performance.now();
      return () => {
        const duration = performance.now() - start;
        debug(`${label}: ${duration.toFixed(2)}ms`, { duration }, moduleId);
        return duration;
      };
    },
    group: (label, fn) => {
      console.group(label);
      try {
        return fn();
      } finally {
        console.groupEnd();
      }
    },
    assert: (condition, msg, data) => {
      if (!condition) error(`Assertion failed: ${msg}`, data, moduleId);
    }
  };
}
function logFromErrorHandler(errorInfo) {
  const level = errorInfo.severity === "critical" ? LOG_LEVELS.CRITICAL : LOG_LEVELS.ERROR;
  _log(level, errorInfo.context?.moduleId || "error-handler", errorInfo.message, errorInfo.context, {
    name: errorInfo.name,
    message: errorInfo.message,
    stack: errorInfo.stack
  });
}
function healthCheck() {
  const globalLogger = _getGlobalLogger();
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    strictMode: isStrict(),
    config: { level: LEVEL_NAMES[_config.level], consoleLevel: LEVEL_NAMES[_config.consoleLevel], enabled: _config.enabled },
    historySize: _logHistory.length,
    listenerCount: _listeners.size,
    // @ts-expect-error TS migration - TS2365
    errorCount: _logHistory.filter((e) => e.level >= LOG_LEVELS.ERROR).length,
    globalLoggerConnected: !!globalLogger
  };
}
function info() {
  const globalLogger = _getGlobalLogger();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    strictMode: isStrict(),
    levels: Object.keys(LOG_LEVELS),
    historySize: _logHistory.length,
    config: { ..._config, maxLogHistory: _config.maxLogHistory },
    globalLoggerConnected: !!globalLogger
  };
}
function init(options = {}) {
  if (options.eventBus) _eventBus = options.eventBus;
  if (options.level !== void 0) setLevel(options.level);
  if (options.consoleLevel !== void 0) setConsoleLevel(options.consoleLevel);
  if (options.enabled !== void 0) setEnabled(options.enabled);
  if (options.prefix) setPrefix(options.prefix);
  return { ok: true, version: VERSION };
}
const Logger = {
  debug,
  info: logInfo,
  warn,
  error,
  critical,
  logError,
  setLevel,
  setConsoleLevel,
  setEnabled,
  configure,
  getHistory,
  clearHistory,
  getErrorLogs,
  addListener,
  removeListener,
  createLogger
};
var logger_default = {
  VERSION,
  MODULE_ID,
  LOG_LEVELS,
  Logger,
  debug,
  info: logInfo,
  warn,
  error,
  critical,
  logError,
  setLevel,
  setConsoleLevel,
  setEnabled,
  setPrefix,
  configure,
  injectEventBus,
  init,
  getHistory,
  clearHistory,
  getErrorLogs,
  addListener,
  removeListener,
  createLogger,
  logFromErrorHandler,
  healthCheck,
  moduleInfo: info
};
export {
  LOG_LEVELS,
  Logger,
  MODULE_ID,
  VERSION,
  addListener,
  clearHistory,
  configure,
  createLogger,
  critical,
  debug,
  logger_default as default,
  error,
  getErrorLogs,
  getHistory,
  healthCheck,
  info,
  init,
  injectEventBus,
  logError,
  logFromErrorHandler,
  logInfo,
  removeListener,
  setConsoleLevel,
  setEnabled,
  setLevel,
  setPrefix,
  warn
};
