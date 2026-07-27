import { createLogger } from "../utils/logger.js";
const VERSION = "1.1.0-LOGGER-INTEGRATED";
const MODULE_ID = "container-main:deprecation-manager";
const logger = createLogger(MODULE_ID);
const DEPRECATION_LEVELS = Object.freeze({
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical"
});
const DEPRECATION_STATUS = Object.freeze({
  ACTIVE: "active",
  DEPRECATED: "deprecated",
  REMOVED: "removed",
  MIGRATED: "migrated"
});
function createDeprecationManager(options = {}) {
  const {
    eventBus,
    logToConsole = true,
    throwOnRemoved = false,
    collectMetrics = true,
    onDeprecationUsed,
    onMigrationRequired
  } = options;
  const _deprecations = /* @__PURE__ */ new Map();
  const _usageMetrics = /* @__PURE__ */ new Map();
  const _migrations = /* @__PURE__ */ new Map();
  const _aliases = /* @__PURE__ */ new Map();
  let _destroyed = false;
  function _emit(event, data) {
    if (eventBus?.emit) {
      eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
    }
  }
  function _logDeprecation(deprecation, context = "") {
    if (!logToConsole) return;
    const { id, message, level, replacement, removeIn } = deprecation;
    const logData = { id, replacement, removeIn, context: context || void 0 };
    switch (level) {
      case DEPRECATION_LEVELS.CRITICAL:
        logger.critical(`DEPRECATED CRITICAL: ${message}`, logData);
        break;
      case DEPRECATION_LEVELS.ERROR:
        logger.error(`DEPRECATED: ${message}`, logData);
        break;
      case DEPRECATION_LEVELS.WARNING:
        logger.warn(`DEPRECATED: ${message}`, logData);
        break;
      default:
        logger.debug(`DEPRECATED: ${message}`, logData);
    }
  }
  function _recordUsage(id, context) {
    if (!collectMetrics) return;
    if (!_usageMetrics.has(id)) {
      _usageMetrics.set(id, { count: 0, contexts: /* @__PURE__ */ new Set(), firstUsed: Date.now(), lastUsed: null });
    }
    const metrics = _usageMetrics.get(id);
    metrics.count++;
    metrics.lastUsed = Date.now();
    if (context) metrics.contexts.add(context);
  }
  const manager = {
    register(id, config) {
      if (_destroyed) return false;
      const {
        message,
        level = DEPRECATION_LEVELS.WARNING,
        status = DEPRECATION_STATUS.DEPRECATED,
        replacement = null,
        removeIn = null,
        migrationFn = null,
        since = null,
        docs = null
      } = config;
      _deprecations.set(id, {
        id,
        message,
        level,
        status,
        replacement,
        removeIn,
        since,
        docs,
        registeredAt: Date.now()
      });
      if (migrationFn) {
        _migrations.set(id, migrationFn);
      }
      _emit("deprecation:registered", { id, level, status });
      return true;
    },
    unregister(id) {
      _deprecations.delete(id);
      _migrations.delete(id);
      _emit("deprecation:unregistered", { id });
      return true;
    },
    registerAlias(oldName, newName, deprecationConfig = {}) {
      _aliases.set(oldName, newName);
      this.register(oldName, {
        message: `"${oldName}" is deprecated`,
        replacement: newName,
        level: DEPRECATION_LEVELS.WARNING,
        ...deprecationConfig
      });
      return true;
    },
    resolveAlias(name) {
      return _aliases.get(name) || name;
    },
    check(id, context = "") {
      const deprecation = _deprecations.get(id);
      if (!deprecation) return { deprecated: false };
      _recordUsage(id, context);
      _logDeprecation(deprecation, context);
      onDeprecationUsed?.(id, deprecation, context);
      _emit("deprecation:used", { id, ...deprecation, context });
      if (deprecation.status === DEPRECATION_STATUS.REMOVED && throwOnRemoved) {
        throw new Error(`API "${id}" has been removed. ${deprecation.replacement ? `Use "${deprecation.replacement}" instead.` : ""}`);
      }
      if (_migrations.has(id)) {
        onMigrationRequired?.(id, deprecation);
      }
      return {
        deprecated: true,
        ...deprecation
      };
    },
    wrapDeprecated(id, fn, config = {}) {
      const { context = "", passThrough = true } = config;
      if (!_deprecations.has(id) && config.message) {
        this.register(id, config);
      }
      return (...args) => {
        this.check(id, context);
        if (_migrations.has(id) && !passThrough) {
          const migrationFn = _migrations.get(id);
          return migrationFn(...args);
        }
        return fn(...args);
      };
    },
    wrapProperty(obj, propName, id, config = {}) {
      const { context = "" } = config;
      const originalValue = obj[propName];
      if (!_deprecations.has(id) && config.message) {
        this.register(id, config);
      }
      Object.defineProperty(obj, propName, {
        get: () => {
          this.check(id, context || `property:${propName}`);
          return originalValue;
        },
        set: (value) => {
          this.check(id, context || `property:${propName}`);
          return value;
        },
        configurable: true
      });
      return obj;
    },
    migrate(id, ...args) {
      const migrationFn = _migrations.get(id);
      if (!migrationFn) {
        throw new Error(`No migration available for "${id}"`);
      }
      const deprecation = _deprecations.get(id);
      if (deprecation) {
        deprecation.status = DEPRECATION_STATUS.MIGRATED;
      }
      _emit("deprecation:migrated", { id });
      return migrationFn(...args);
    },
    hasMigration(id) {
      return _migrations.has(id);
    },
    getAll() {
      const result = {};
      _deprecations.forEach((dep, id) => {
        result[id] = { ...dep };
      });
      return result;
    },
    getByLevel(level) {
      const result = [];
      _deprecations.forEach((dep) => {
        if (dep.level === level) {
          result.push({ ...dep });
        }
      });
      return result;
    },
    getByStatus(status) {
      const result = [];
      _deprecations.forEach((dep) => {
        if (dep.status === status) {
          result.push({ ...dep });
        }
      });
      return result;
    },
    getUsageMetrics() {
      const result = {};
      _usageMetrics.forEach((metrics, id) => {
        result[id] = {
          ...metrics,
          contexts: Array.from(metrics.contexts)
        };
      });
      return result;
    },
    getReport() {
      const deprecations = this.getAll();
      const metrics = this.getUsageMetrics();
      const report = {
        totalDeprecations: _deprecations.size,
        byLevel: {
          [DEPRECATION_LEVELS.INFO]: 0,
          [DEPRECATION_LEVELS.WARNING]: 0,
          [DEPRECATION_LEVELS.ERROR]: 0,
          [DEPRECATION_LEVELS.CRITICAL]: 0
        },
        byStatus: {
          [DEPRECATION_STATUS.ACTIVE]: 0,
          [DEPRECATION_STATUS.DEPRECATED]: 0,
          [DEPRECATION_STATUS.REMOVED]: 0,
          [DEPRECATION_STATUS.MIGRATED]: 0
        },
        totalUsages: 0,
        mostUsed: [],
        migrationsAvailable: _migrations.size,
        aliasesRegistered: _aliases.size
      };
      _deprecations.forEach((dep) => {
        report.byLevel[dep.level]++;
        report.byStatus[dep.status]++;
      });
      _usageMetrics.forEach((m, id) => {
        report.totalUsages += m.count;
        report.mostUsed.push({ id, count: m.count });
      });
      report.mostUsed.sort((a, b) => b.count - a.count);
      report.mostUsed = report.mostUsed.slice(0, 10);
      return {
        ...report,
        deprecations,
        metrics
      };
    },
    clearMetrics() {
      _usageMetrics.clear();
      _emit("deprecation:metrics-cleared", {});
    },
    healthCheck() {
      const criticalCount = this.getByLevel(DEPRECATION_LEVELS.CRITICAL).length;
      const removedInUse = Array.from(_usageMetrics.keys()).filter((id) => _deprecations.get(id)?.status === DEPRECATION_STATUS.REMOVED).length;
      let status = "HEALTHY";
      if (removedInUse > 0) status = "ERROR";
      else if (criticalCount > 0) status = "WARNING";
      return {
        status,
        version: VERSION,
        moduleId: MODULE_ID,
        totalDeprecations: _deprecations.size,
        criticalDeprecations: criticalCount,
        removedApisInUse: removedInUse,
        migrationsAvailable: _migrations.size,
        totalUsages: Array.from(_usageMetrics.values()).reduce((sum, m) => sum + m.count, 0)
      };
    },
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        deprecationCount: _deprecations.size,
        migrationCount: _migrations.size,
        aliasCount: _aliases.size,
        levels: Object.keys(DEPRECATION_LEVELS),
        statuses: Object.keys(DEPRECATION_STATUS)
      };
    },
    destroy() {
      _destroyed = true;
      _deprecations.clear();
      _usageMetrics.clear();
      _migrations.clear();
      _aliases.clear();
      _emit("deprecation-manager:destroyed", {});
    }
  };
  return manager;
}
let _globalManager = null;
function getDeprecationManager(options) {
  if (!_globalManager) {
    _globalManager = createDeprecationManager(options);
  }
  return _globalManager;
}
function resetGlobalDeprecationManager() {
  if (_globalManager) {
    _globalManager.destroy();
    _globalManager = null;
  }
}
function deprecated(id, config = {}) {
  return (target, propertyKey, descriptor) => {
    const original = descriptor.value;
    const manager = getDeprecationManager();
    manager.register(id || propertyKey, {
      message: `Method "${propertyKey}" is deprecated`,
      ...config
    });
    descriptor.value = function(...args) {
      manager.check(id || propertyKey, `method:${propertyKey}`);
      return original.apply(this, args);
    };
    return descriptor;
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ["createDeprecationManager", "getDeprecationManager", "deprecated"],
    levels: Object.keys(DEPRECATION_LEVELS),
    statuses: Object.keys(DEPRECATION_STATUS)
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    hasGlobalManager: !!_globalManager
  };
}
var deprecation_manager_default = {
  VERSION,
  MODULE_ID,
  DEPRECATION_LEVELS,
  DEPRECATION_STATUS,
  createDeprecationManager,
  getDeprecationManager,
  resetGlobalDeprecationManager,
  deprecated,
  info,
  healthCheck
};
export {
  DEPRECATION_LEVELS,
  DEPRECATION_STATUS,
  MODULE_ID,
  VERSION,
  createDeprecationManager,
  deprecation_manager_default as default,
  deprecated,
  getDeprecationManager,
  healthCheck,
  info,
  resetGlobalDeprecationManager
};
