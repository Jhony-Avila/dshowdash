
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-LOGGER-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:deprecation-manager
// PURPOSE: Deprecation Manager - Sistema de gerenciamento de deprecações
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   DEPRECATION_LEVELS — exported value
//   DEPRECATION_STATUS — exported value
//   createDeprecationManager() — exported function
//   getDeprecationManager() — exported function
//   resetGlobalDeprecationManager() — exported function
//   deprecated() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from '../utils/logger.js';

export const VERSION = '1.1.0-LOGGER-INTEGRATED';
export const MODULE_ID = 'container-main:deprecation-manager';

const logger = createLogger(MODULE_ID);

// Níveis de severidade
export const DEPRECATION_LEVELS = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
});

// Status de deprecação
export const DEPRECATION_STATUS = Object.freeze({
  ACTIVE: 'active',
  DEPRECATED: 'deprecated',
  REMOVED: 'removed',
  MIGRATED: 'migrated'
});

// Cria instância do Deprecation Manager
export function createDeprecationManager(options: Record<string, any> = {}) {
  const {
    eventBus,
    logToConsole = true,
    throwOnRemoved = false,
    collectMetrics = true,
    onDeprecationUsed,
    onMigrationRequired
  } = options;

  const _deprecations = new Map();
  const _usageMetrics = new Map();
  const _migrations = new Map();
  const _aliases = new Map();
  let _destroyed = false;

  function _emit(event: string, data: Record<string, unknown>) {
    if (eventBus?.emit) {
      eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
    }
  }

  function _logDeprecation(deprecation: { id: string; message: string; level: string; replacement: string | null; removeIn: string | null }, context = '') {
    if (!logToConsole) return;

    const { id, message, level, replacement, removeIn } = deprecation;
    const logData = { id, replacement, removeIn, context: context || undefined };

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

  function _recordUsage(id: string, context: string) {
    if (!collectMetrics) return;

    if (!_usageMetrics.has(id)) {
      _usageMetrics.set(id, { count: 0, contexts: new Set(), firstUsed: Date.now(), lastUsed: null });
    }

    const metrics = _usageMetrics.get(id);
    metrics.count++;
    metrics.lastUsed = Date.now();
    if (context) metrics.contexts.add(context);
  }

  const manager = {
    register(id: string, config: Record<string, unknown>) {
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

      _emit('deprecation:registered', { id, level, status });
      return true;
    },

    unregister(id: string) {
      _deprecations.delete(id);
      _migrations.delete(id);
      _emit('deprecation:unregistered', { id });
      return true;
    },

    registerAlias(oldName: string, newName: string, deprecationConfig = {}) {
      _aliases.set(oldName, newName);
      
      this.register(oldName, {
        message: `"${oldName}" is deprecated`,
        replacement: newName,
        level: DEPRECATION_LEVELS.WARNING,
        ...deprecationConfig
      });

      return true;
    },

    resolveAlias(name: string) {
      return _aliases.get(name) || name;
    },

    check(id: string, context = '') {
      const deprecation = _deprecations.get(id);
      if (!deprecation) return { deprecated: false };

      _recordUsage(id, context);
      _logDeprecation(deprecation, context);
      
      onDeprecationUsed?.(id, deprecation, context);
      _emit('deprecation:used', { id, ...deprecation, context });

      if (deprecation.status === DEPRECATION_STATUS.REMOVED && throwOnRemoved) {
        throw new Error(`API "${id}" has been removed. ${deprecation.replacement ? `Use "${deprecation.replacement}" instead.` : ''}`);
      }

      if (_migrations.has(id)) {
        onMigrationRequired?.(id, deprecation);
      }

      return {
        deprecated: true,
        ...deprecation
      };
    },

    wrapDeprecated(id: string, fn: Function, config: Record<string, any> = {}) {
      const { context = '', passThrough = true } = config;

      if (!_deprecations.has(id) && config.message) {
        this.register(id, config);
      }

      return (...args: unknown[]) => {
        this.check(id, context);
        
        if (_migrations.has(id) && !passThrough) {
          const migrationFn = _migrations.get(id);
          return migrationFn(...args);
        }

        return fn(...args);
      };
    },

    wrapProperty(obj: Record<string, any>, propName: string, id: string, config: Record<string, any> = {}) {
      const { context = '' } = config;
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

    migrate(id: string, ...args: unknown[]) {
      const migrationFn = _migrations.get(id);
      if (!migrationFn) {
        throw new Error(`No migration available for "${id}"`);
      }

      const deprecation = _deprecations.get(id);
      if (deprecation) {
        deprecation.status = DEPRECATION_STATUS.MIGRATED;
      }

      _emit('deprecation:migrated', { id });
      return migrationFn(...args);
    },

    hasMigration(id: string) {
      return _migrations.has(id);
    },

    getAll() {
      const result = {};
      _deprecations.forEach((dep, id) => {
        (result as Record<string, unknown>)[id] = { ...dep };
      });
      return result;
    },

    getByLevel(level: string) {
      const result: unknown[] = [];
      _deprecations.forEach((dep) => {
        if (dep.level === level) {
          result.push({ ...dep });
        }
      });
      return result;
    },

    getByStatus(status: string) {
      const result: unknown[] = [];
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
        (result as Record<string, unknown>)[id] = {
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
        mostUsed: [] as unknown[],
        migrationsAvailable: _migrations.size,
        aliasesRegistered: _aliases.size
      };

      _deprecations.forEach(dep => {
        (report.byLevel as Record<string, number>)[dep.level]++;
        (report.byStatus as Record<string, number>)[dep.status]++;
      });

      _usageMetrics.forEach((m, id) => {
        report.totalUsages += m.count;
        report.mostUsed.push({ id, count: m.count });
      });

      report.mostUsed.sort((a, b) => (b as Record<string, number>).count - (a as Record<string, number>).count);
      report.mostUsed = report.mostUsed.slice(0, 10);

      return {
        ...report,
        deprecations,
        metrics
      };
    },

    clearMetrics() {
      _usageMetrics.clear();
      _emit('deprecation:metrics-cleared', {});
    },

    healthCheck() {
      const criticalCount = this.getByLevel(DEPRECATION_LEVELS.CRITICAL).length;
      const removedInUse = Array.from(_usageMetrics.keys())
        .filter(id => _deprecations.get(id)?.status === DEPRECATION_STATUS.REMOVED).length;

      let status = 'HEALTHY';
      if (removedInUse > 0) status = 'ERROR';
      else if (criticalCount > 0) status = 'WARNING';

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
      _emit('deprecation-manager:destroyed', {});
    }
  };

  return manager;
}

let _globalManager: ReturnType<typeof createDeprecationManager> | null = null;

export function getDeprecationManager(options?: Record<string, any>) {
  if (!_globalManager) {
    _globalManager = createDeprecationManager(options);
  }
  return _globalManager;
}

export function resetGlobalDeprecationManager() {
  if (_globalManager) {
    _globalManager.destroy();
    _globalManager = null;
  }
}

export function deprecated(id: string, config = {}) {
  return (target: HTMLElement, propertyKey: string, descriptor: Record<string, unknown>) => {
    const original = descriptor.value;
    const manager = getDeprecationManager();
    
    manager.register(id || propertyKey, {
      message: `Method "${propertyKey}" is deprecated`,
      ...config
    });

    descriptor.value = function(...args: unknown[]) {
      manager.check(id || propertyKey, `method:${propertyKey}`);
      return (original as (...args: unknown[]) => unknown).apply(this, args);
    };

    return descriptor;
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ['createDeprecationManager', 'getDeprecationManager', 'deprecated'],
    levels: Object.keys(DEPRECATION_LEVELS),
    statuses: Object.keys(DEPRECATION_STATUS)
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    hasGlobalManager: !!_globalManager
  };
}

export default {
  VERSION, MODULE_ID,
  DEPRECATION_LEVELS, DEPRECATION_STATUS,
  createDeprecationManager, getDeprecationManager, resetGlobalDeprecationManager,
  deprecated,
  info, healthCheck
};
