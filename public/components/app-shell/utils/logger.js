import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "1.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell-logger";
const hasWindow = typeof window !== "undefined";
const LOG_LEVELS = Object.freeze({ DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, SILENT: 4 });
const _config = { level: LOG_LEVELS.INFO, enabledModules: [], disabledModules: [], showTimestamp: true, showModule: true, showLevel: true, colorize: true, maxHistory: 500, persistToStorage: false };
const _history = [];
const _subscribers = [];
const _metrics = { debug: 0, info: 0, warn: 0, error: 0, delegated: 0 };
const COLORS = { DEBUG: "#9E9E9E", INFO: "#2196F3", WARN: "#FF9800", ERROR: "#F44336" };
function _resolveLoggerGlobal() {
  if (hasWindow && window.Core && window.Core.windowAdapter) {
    const fromAdapter = window.Core.windowAdapter.get("Logger");
    if (fromAdapter) return fromAdapter;
  }
  return null;
}
function _shouldLog(level, module) {
  if (level < _config.level) return false;
  if (_config.enabledModules.length > 0 && _config.enabledModules.indexOf(module) < 0 && _config.enabledModules.indexOf("*") < 0) return false;
  if (_config.disabledModules.indexOf(module) >= 0) return false;
  return true;
}
function _formatMessage(level, module, message) {
  const parts = [];
  if (_config.showTimestamp) parts.push(`[${(/* @__PURE__ */ new Date()).toISOString().substr(11, 12)}]`);
  if (_config.showLevel) parts.push(`[${level}]`);
  if (_config.showModule && module) parts.push(`[${module}]`);
  parts.push(message);
  return parts.join(" ");
}
function _addToHistory(entry) {
  _history.push(entry);
  if (_history.length > _config.maxHistory) _history.shift();
  _subscribers.forEach((cb) => {
    try {
      cb(entry);
    } catch (e) {
    }
  });
}
function _tryDelegateToGlobal(level, module, message, data) {
  const logger = _resolveLoggerGlobal();
  if (logger && logger[level.toLowerCase()]) {
    try {
      logger[level.toLowerCase()](message, data, module);
      _metrics.delegated++;
      return true;
    } catch (e) {
    }
  }
  return false;
}
function _log(level, levelName, module, message, data) {
  _metrics[levelName.toLowerCase()]++;
  if (!_shouldLog(level, module)) return;
  const entry = { level, levelName, module, message, data, timestamp: Date.now(), formatted: _formatMessage(levelName, module, message) };
  _addToHistory(entry);
  if (_tryDelegateToGlobal(levelName, module, message, data)) return;
  const formatted = entry.formatted;
  if (_config.colorize && typeof console !== "undefined") {
    const color = COLORS[levelName] || COLORS.INFO;
    if (data !== void 0) console.log(`%c${formatted}`, `color:${color}`, data);
    else console.log(`%c${formatted}`, `color:${color}`);
  } else {
    if (data !== void 0) console.log(formatted, data);
    else console.log(formatted);
  }
}
function debug(message, data, module) {
  _log(LOG_LEVELS.DEBUG, "DEBUG", module || MODULE_ID, message, data);
}
function logInfo(message, data, module) {
  _log(LOG_LEVELS.INFO, "INFO", module || MODULE_ID, message, data);
}
const info = logInfo;
function warn(message, data, module) {
  _log(LOG_LEVELS.WARN, "WARN", module || MODULE_ID, message, data);
}
function error(message, data, module) {
  _log(LOG_LEVELS.ERROR, "ERROR", module || MODULE_ID, message, data);
}
function createLogger(moduleId) {
  return {
    debug(msg, data) {
      debug(msg, data, moduleId);
    },
    info(msg, data) {
      logInfo(msg, data, moduleId);
    },
    warn(msg, data) {
      warn(msg, data, moduleId);
    },
    error(msg, data) {
      error(msg, data, moduleId);
    }
  };
}
function setLevel(level) {
  _config.level = typeof level === "number" ? level : LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
}
function getLevel() {
  return _config.level;
}
function getLevelName() {
  const names = Object.keys(LOG_LEVELS);
  for (let i = 0; i < names.length; i++) {
    if (LOG_LEVELS[names[i]] === _config.level) return names[i];
  }
  return "UNKNOWN";
}
function getInfo() {
  return moduleInfo();
}
function configure(options) {
  if (options.level !== void 0) setLevel(options.level);
  if (options.showTimestamp !== void 0) _config.showTimestamp = !!options.showTimestamp;
  if (options.showModule !== void 0) _config.showModule = !!options.showModule;
  if (options.showLevel !== void 0) _config.showLevel = !!options.showLevel;
  if (options.colorize !== void 0) _config.colorize = !!options.colorize;
  if (options.maxHistory !== void 0) _config.maxHistory = Math.max(0, options.maxHistory);
}
function getConfig() {
  return Object.assign({}, _config);
}
function enableModule(module) {
  if (_config.enabledModules.indexOf(module) < 0) _config.enabledModules.push(module);
}
function disableModule(module) {
  if (_config.disabledModules.indexOf(module) < 0) _config.disabledModules.push(module);
}
function enableOnlyModules(modules) {
  _config.enabledModules = modules.slice();
}
function enableAllModules() {
  _config.enabledModules = ["*"];
  _config.disabledModules = [];
}
function getHistory(filter) {
  if (!filter) return _history.slice();
  return _history.filter((e) => {
    if (filter.level !== void 0 && e.level < filter.level) return false;
    if (filter.module && e.module !== filter.module) return false;
    return true;
  });
}
function clearHistory() {
  _history.length = 0;
}
function subscribe(callback) {
  if (typeof callback === "function") _subscribers.push(callback);
  return () => {
    const idx = _subscribers.indexOf(callback);
    if (idx >= 0) _subscribers.splice(idx, 1);
  };
}
function getMetrics() {
  return Object.assign({}, _metrics, { historySize: _history.length, subscriberCount: _subscribers.length });
}
function healthCheck() {
  const checks = { operational: true, historyNotFull: _history.length < _config.maxHistory * 0.9, lowErrorRate: _metrics.info + _metrics.debug === 0 || _metrics.error / (_metrics.info + _metrics.debug + _metrics.error) < 0.3, strictModeCompliant: true };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 4 ? "HEALTHY" : "DEGRADED", score: `${passed}/4`, checks, metrics: getMetrics(), strictMode: isStrict(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function moduleInfo() {
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
if (hasWindow) {
  if (typeof window.__DEVTOOLS__ !== "undefined") {
    window.__DEVTOOLS__.AppShellLogger = AppShellLogger;
  }
}
var logger_default = AppShellLogger;
export {
  LOG_LEVELS,
  MODULE_ID,
  VERSION,
  clearHistory,
  configure,
  createLogger,
  debug,
  logger_default as default,
  disableModule,
  enableAllModules,
  enableModule,
  enableOnlyModules,
  error,
  getConfig,
  getHistory,
  getInfo,
  getLevel,
  getLevelName,
  getMetrics,
  healthCheck,
  info,
  logInfo,
  moduleInfo,
  setLevel,
  subscribe,
  warn
};
