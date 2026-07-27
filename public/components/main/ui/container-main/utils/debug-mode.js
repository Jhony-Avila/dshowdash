import { createLogger } from "./logger.js";
import { getEnv, ENV } from "../config.js";
const VERSION = "1.1.0-NO-STACKTRACE";
const MODULE_ID = "container-main:debug-mode";
const DEBUG_LEVELS = Object.freeze({
  OFF: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4,
  VERBOSE: 5,
  ALL: 99
});
const DEBUG_CATEGORIES = Object.freeze({
  BOOT: "boot",
  KERNEL: "kernel",
  SLOTS: "slots",
  PANELS: "panels",
  EVENTS: "events",
  PERFORMANCE: "performance",
  STATE: "state",
  PLUGINS: "plugins",
  LIFECYCLE: "lifecycle",
  NETWORK: "network"
});
function createDebugMode(options = {}) {
  const {
    enabled = getEnv() === ENV.DEVELOPMENT,
    level = DEBUG_LEVELS.DEBUG,
    categories = Object.values(DEBUG_CATEGORIES),
    showTimestamps = true,
    showStackTrace = false,
    persistLogs = true,
    maxLogs = 1e3,
    exposeGlobal = true
  } = options;
  const _logger = createLogger(MODULE_ID);
  let _enabled = enabled;
  let _level = level;
  let _categories = new Set(categories);
  let _logs = [];
  let _breakpoints = /* @__PURE__ */ new Map();
  let _watchers = /* @__PURE__ */ new Map();
  let _inspectedObjects = /* @__PURE__ */ new WeakMap();
  let _eventBus = null;
  let _bootstrap = null;
  function _formatTime() {
    if (!showTimestamps) return "";
    const now = /* @__PURE__ */ new Date();
    return `[${now.toLocaleTimeString()}.${now.getMilliseconds().toString().padStart(3, "0")}]`;
  }
  function _addLog(level2, category, message, data = null) {
    if (!_enabled) return;
    if (level2 > _level) return;
    if (!_categories.has(category)) return;
    const entry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      level: level2,
      levelName: Object.keys(DEBUG_LEVELS).find((k) => DEBUG_LEVELS[k] === level2) || "UNKNOWN",
      category,
      message,
      data,
      stack: showStackTrace ? new Error().stack : null
    };
    _logs.push(entry);
    if (_logs.length > Number(maxLogs)) _logs.shift();
    const prefix = `${_formatTime()} [${entry.levelName}] [${category}]`;
    if (level2 <= DEBUG_LEVELS.ERROR) {
      console.log(`%c${prefix}%c ${message}`, "color:#ef4444;font-weight:bold", "color:inherit", data || "");
    } else if (level2 <= DEBUG_LEVELS.WARN) {
      console.log(`%c${prefix}%c ${message}`, "color:#f59e0b;font-weight:bold", "color:inherit", data || "");
    } else if (level2 <= DEBUG_LEVELS.INFO) {
      console.log(`%c${prefix}%c ${message}`, "color:#3b82f6", "color:inherit", data || "");
    } else {
      console.log(prefix, message, data || "");
    }
    return entry;
  }
  const debug = {
    // Injeta dependências
    inject({ eventBus, bootstrap }) {
      _eventBus = eventBus;
      _bootstrap = bootstrap;
      if (_eventBus && _enabled) {
        _eventBus.on("*", (event, data) => {
          _addLog(DEBUG_LEVELS.VERBOSE, DEBUG_CATEGORIES.EVENTS, `Event: ${event}`, data);
        });
      }
    },
    // Enable/Disable
    enable() {
      _enabled = true;
      _logger.info("Debug mode enabled");
    },
    disable() {
      _enabled = false;
      _logger.info("Debug mode disabled");
    },
    toggle() {
      _enabled = !_enabled;
      return _enabled;
    },
    isEnabled() {
      return _enabled;
    },
    // Level
    setLevel(level2) {
      _level = level2;
    },
    getLevel() {
      return _level;
    },
    // Categories
    enableCategory(category) {
      _categories.add(category);
    },
    disableCategory(category) {
      _categories.delete(category);
    },
    toggleCategory(category) {
      if (_categories.has(category)) _categories.delete(category);
      else _categories.add(category);
    },
    getCategories() {
      return Array.from(_categories);
    },
    // Logging shortcuts
    // @ts-expect-error TS migration - TS2345
    error(category, message, data) {
      return _addLog(DEBUG_LEVELS.ERROR, category, message, data);
    },
    // @ts-expect-error TS migration - TS2345
    warn(category, message, data) {
      return _addLog(DEBUG_LEVELS.WARN, category, message, data);
    },
    // @ts-expect-error TS migration - TS2345
    info(category, message, data) {
      return _addLog(DEBUG_LEVELS.INFO, category, message, data);
    },
    // @ts-expect-error TS migration - TS2345
    log(category, message, data) {
      return _addLog(DEBUG_LEVELS.DEBUG, category, message, data);
    },
    // @ts-expect-error TS migration - TS2345
    verbose(category, message, data) {
      return _addLog(DEBUG_LEVELS.VERBOSE, category, message, data);
    },
    // Quick logs
    boot(message, data) {
      return this.log(DEBUG_CATEGORIES.BOOT, message, data);
    },
    kernel(message, data) {
      return this.log(DEBUG_CATEGORIES.KERNEL, message, data);
    },
    slot(message, data) {
      return this.log(DEBUG_CATEGORIES.SLOTS, message, data);
    },
    panel(message, data) {
      return this.log(DEBUG_CATEGORIES.PANELS, message, data);
    },
    event(message, data) {
      return this.log(DEBUG_CATEGORIES.EVENTS, message, data);
    },
    perf(message, data) {
      return this.log(DEBUG_CATEGORIES.PERFORMANCE, message, data);
    },
    state(message, data) {
      return this.log(DEBUG_CATEGORIES.STATE, message, data);
    },
    // Breakpoints (para debugging manual)
    setBreakpoint(name, condition = () => true) {
      _breakpoints.set(name, { condition, hits: 0, enabled: true });
    },
    removeBreakpoint(name) {
      _breakpoints.delete(name);
    },
    checkBreakpoint(name, context = {}) {
      const bp = _breakpoints.get(name);
      if (!bp || !bp.enabled) return false;
      if (bp.condition(context)) {
        bp.hits++;
        this.info("breakpoint", `Breakpoint hit: ${name}`, { hits: bp.hits, context });
        debugger;
        return true;
      }
      return false;
    },
    listBreakpoints() {
      const result = {};
      for (const [name, bp] of _breakpoints) {
        result[name] = { enabled: bp.enabled, hits: bp.hits };
      }
      return result;
    },
    // Watchers
    watch(name, getter) {
      _watchers.set(name, { getter, lastValue: void 0 });
    },
    unwatch(name) {
      _watchers.delete(name);
    },
    checkWatchers() {
      const changes = [];
      for (const [name, watcher] of _watchers) {
        try {
          const currentValue = watcher.getter();
          if (currentValue !== watcher.lastValue) {
            changes.push({ name, oldValue: watcher.lastValue, newValue: currentValue });
            watcher.lastValue = currentValue;
          }
        } catch (e) {
          this.error("watcher", `Watcher error: ${name}`, e.message);
        }
      }
      if (changes.length > 0) {
        this.info("watcher", "Values changed", changes);
      }
      return changes;
    },
    // Inspect object
    inspect(obj, label = "object") {
      if (!_enabled) return;
      console.group(`\u{1F50D} Inspect: ${label}`);
      console.dir(obj, { depth: 4 });
      console.groupEnd();
      _inspectedObjects.set(obj, { label, timestamp: Date.now() });
      return obj;
    },
    // Time measurement
    time(label) {
      console.time(`\u23F1\uFE0F ${label}`);
    },
    timeEnd(label) {
      console.timeEnd(`\u23F1\uFE0F ${label}`);
    },
    // Trace
    trace(message) {
      if (!_enabled) return;
      console.trace(`\u{1F4CD} ${message}`);
    },
    // Logs
    getLogs(filter = {}) {
      let result = [..._logs];
      if (filter.level !== void 0) {
        result = result.filter((l) => l.level <= filter.level);
      }
      if (filter.category) {
        result = result.filter((l) => l.category === filter.category);
      }
      if (filter.since) {
        result = result.filter((l) => l.timestamp >= filter.since);
      }
      if (filter.search) {
        const search = filter.search.toLowerCase();
        result = result.filter((l) => l.message.toLowerCase().includes(search));
      }
      return result;
    },
    clearLogs() {
      _logs = [];
    },
    exportLogs(format = "json") {
      if (format === "json") {
        return JSON.stringify(_logs, null, 2);
      }
      if (format === "csv") {
        const header = "timestamp,level,category,message\n";
        const rows = _logs.map((l) => `${l.timestamp},${l.levelName},${l.category},"${l.message}"`).join("\n");
        return header + rows;
      }
      return _logs;
    },
    // System inspection
    getSystemState() {
      if (!_bootstrap) return { error: "Bootstrap not injected" };
      return {
        bootstrapState: _bootstrap.getState(),
        // @ts-expect-error TS migration - TS2339
        kernelState: _bootstrap.getKernel()?.getState(),
        // @ts-expect-error TS migration - TS2339
        managers: _bootstrap.getKernel()?.listManagers(),
        // @ts-expect-error TS migration - TS2339
        plugins: _bootstrap.getPluginSystem()?.list(),
        // @ts-expect-error TS migration - TS2339
        performanceRating: _bootstrap.getBootMetrics()?.getPerformanceRating(),
        // @ts-expect-error TS migration - TS2339
        errorCount: _bootstrap.getErrors()?.length || 0
      };
    },
    // Quick health check
    quickCheck() {
      console.group("\u{1F3E5} Quick Health Check");
      const state = this.getSystemState();
      console.log("Bootstrap:", state.bootstrapState);
      console.log("Kernel:", state.kernelState);
      console.log("Managers:", state.managers?.length || 0);
      console.log("Plugins:", state.plugins?.length || 0);
      console.log("Boot Rating:", state.performanceRating);
      console.log("Errors:", state.errorCount);
      console.groupEnd();
      return state;
    },
    // Console commands help
    help() {
      console.group("\u{1F6E0}\uFE0F Debug Mode Commands");
      console.log("debug.enable() / debug.disable() - Toggle debug mode");
      console.log("debug.setLevel(n) - Set debug level (0-99)");
      console.log("debug.log(category, message, data) - Log message");
      console.log("debug.inspect(obj, label) - Inspect object");
      console.log("debug.time(label) / debug.timeEnd(label) - Measure time");
      console.log("debug.getLogs(filter) - Get logs with filter");
      console.log("debug.exportLogs(format) - Export logs (json/csv)");
      console.log("debug.getSystemState() - Get system state");
      console.log("debug.quickCheck() - Quick health check");
      console.log("debug.setBreakpoint(name, condition) - Set breakpoint");
      console.log("debug.watch(name, getter) - Watch value changes");
      console.groupEnd();
    },
    // Health check
    healthCheck() {
      return {
        status: "HEALTHY",
        version: VERSION,
        moduleId: MODULE_ID,
        enabled: _enabled,
        level: _level,
        categories: _categories.size,
        logsCount: _logs.length,
        breakpoints: _breakpoints.size,
        watchers: _watchers.size
      };
    },
    // Info — renamed to getInfo to avoid conflict with info(category, message, data) shortcut
    getInfo() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        enabled: _enabled,
        level: _level,
        levels: Object.keys(DEBUG_LEVELS),
        categories: Object.keys(DEBUG_CATEGORIES),
        logsCount: _logs.length
      };
    },
    // Destroy
    destroy() {
      _logs = [];
      _breakpoints.clear();
      _watchers.clear();
      _enabled = false;
    }
  };
  if (exposeGlobal && typeof window !== "undefined") {
    window.__containerDebug = debug;
    window.debug = debug;
    _logger.info("Debug mode exposed as window.debug");
  }
  return debug;
}
let _instance = null;
function getDebugMode(options = {}) {
  if (!_instance) {
    _instance = createDebugMode(options);
  }
  return _instance;
}
function resetDebugMode() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, levels: Object.keys(DEBUG_LEVELS), categories: Object.keys(DEBUG_CATEGORIES) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var debug_mode_default = {
  VERSION,
  MODULE_ID,
  DEBUG_LEVELS,
  DEBUG_CATEGORIES,
  createDebugMode,
  getDebugMode,
  resetDebugMode,
  info,
  healthCheck
};
export {
  DEBUG_CATEGORIES,
  DEBUG_LEVELS,
  MODULE_ID,
  VERSION,
  createDebugMode,
  debug_mode_default as default,
  getDebugMode,
  healthCheck,
  info,
  resetDebugMode
};
