
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: metrics-persistence
// PURPOSE: Metrics Persistence - Sistema de persistência de métricas por painel
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, METRIC_TYPES, AGGREGATION_PERIODS, DEFAULT_CONFIG, create...
//
// PROVIDES:
//   createMetricsPersistence() — exported function
//   getMetricsPersistence() — exported function
//   resetGlobalPersistence() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   METRIC_TYPES — exported value
//   AGGREGATION_PERIODS — exported value
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

import {
  VERSION,
  MODULE_ID,
  METRIC_TYPES,
  AGGREGATION_PERIODS,
  DEFAULT_CONFIG,
  createStorageAdapter,
  createMetricsStore,
  createPersistenceIO
} from './metrics/index.js';

export { VERSION, MODULE_ID, METRIC_TYPES, AGGREGATION_PERIODS };

// Cria instância do Metrics Persistence
export function createMetricsPersistence(options: Record<string, any> = {}) {
  const {
    eventBus,
    storage = null,
    storageKey = DEFAULT_CONFIG.STORAGE_PREFIX,
    persistInterval = DEFAULT_CONFIG.PERSIST_INTERVAL,
    maxEntriesPerPanel = DEFAULT_CONFIG.MAX_ENTRIES_PER_PANEL,
    maxTotalEntries = DEFAULT_CONFIG.MAX_TOTAL_ENTRIES,
    enableCompression = false,
    onPersist,
    onRestore,
    onError
  } = options;

  let _persistTimer: ReturnType<typeof setInterval> | null = null;
  let _isDirty = false;
  let _destroyed = false;

  // Emite evento
  function _emit(event: string, data: Record<string, unknown>) {
    if (eventBus?.emit) {
      eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
    }
  }

  // Cria componentes modulares
  const _storageAdapter = createStorageAdapter({ enableCompression });
  
  const _metricsStore = createMetricsStore({
    maxEntriesPerPanel,
    maxTotalEntries,
    onWrite: (panelId: string, entry: Record<string, unknown>) => {
      _isDirty = true;
      _emit('metrics-persistence:recorded', { panelId, metricName: entry.name, value: entry.value });
    }
  });

  const _persistenceIO = createPersistenceIO({
    storageAdapter: _storageAdapter,
    metricsStore: _metricsStore,
    storageKey,
    onPersist: (data: Record<string, unknown>) => {
      _isDirty = false;
      onPersist?.(data);
      _emit('metrics-persistence:persisted', { size: _persistenceIO.getMetrics().storageUsedBytes });
    },
    onRestore: (data: Record<string, unknown>) => {
      onRestore?.(data);
      // @ts-expect-error strict migration — TS2769
      _emit('metrics-persistence:restored', { panelCount: Object.keys(data.panels).length });
    },
    onError: (op: string, error: Record<string, unknown>) => {
      onError?.(op, error);
      _emit(`metrics-persistence:${op}-error`, { error: error.message });
    }
  });

  const persistence = {
    // Inicializa
    init() {
      _storageAdapter.init(storage);
      _persistenceIO.restore();
      
      if (persistInterval > 0) {
        _persistTimer = setInterval(() => {
          if (_isDirty) this.persist();
        }, persistInterval);
      }

      _emit('metrics-persistence:initialized', {});
      return this;
    },

    // === PANEL MANAGEMENT ===
    registerPanel(panelId: string, metadata = {}) {
      if (_destroyed) return false;
      const result = _metricsStore.registerPanel(panelId, metadata);
      _emit('metrics-persistence:panel-registered', { panelId });
      return result;
    },

    unregisterPanel(panelId: string) {
      const result = _metricsStore.unregisterPanel(panelId);
      _isDirty = true;
      _emit('metrics-persistence:panel-unregistered', { panelId });
      return result;
    },

    // === RECORD OPERATIONS ===
    record(panelId: string, metricName: string, value: unknown, options = {}) {
      if (_destroyed) return null;
      return _metricsStore.record(panelId, metricName, value, options);
    },

    recordBatch(panelId: string, metrics: Array<{ name: string; value: unknown; options?: Record<string, unknown> }>) {
      if (_destroyed) return [];
      return _metricsStore.recordBatch(panelId, metrics);
    },

    increment(panelId: string, metricName: string, amount = 1, tags = {}) {
      if (_destroyed) return null;
      return _metricsStore.increment(panelId, metricName, amount, tags);
    },

    timing(panelId: string, metricName: string, duration: number, tags = {}) {
      if (_destroyed) return null;
      return _metricsStore.timing(panelId, metricName, duration, tags);
    },

    // === READ OPERATIONS ===
    get(panelId: string, options = {}) {
      return _metricsStore.get(panelId, options);
    },

    getAggregated(panelId: string, metricName: string, period = AGGREGATION_PERIODS.HOUR) {
      return _metricsStore.getAggregated(panelId, metricName, period);
    },

    getStats(panelId: string, metricName: string, options = {}) {
      return _metricsStore.getStats(panelId, metricName, options);
    },

    getLast(panelId: string, metricName: string) {
      return _metricsStore.getLast(panelId, metricName);
    },

    getAll(options = {}) {
      return _metricsStore.getAll(options);
    },

    listPanels() {
      return _metricsStore.listPanels();
    },

    listMetricNames(panelId: string) {
      return _metricsStore.listMetricNames(panelId);
    },

    // === PERSISTENCE OPERATIONS ===
    persist() {
      if (_destroyed) return false;
      return _persistenceIO.persist();
    },

    restore() {
      return _persistenceIO.restore();
    },

    // @ts-expect-error strict migration — TS2322
    clear(panelId: string = null) {
      _metricsStore.clear(panelId);
      _isDirty = true;
      _emit('metrics-persistence:cleared', { panelId });
      return this;
    },

    clearStorage() {
      _persistenceIO.clearStorage();
      _emit('metrics-persistence:storage-cleared', {});
      return this;
    },

    export(format = 'json') {
      return _persistenceIO.export(format);
    },

    import(data: Record<string, unknown>, options = {}) {
      const result = _persistenceIO.import(data, options);
      if (result) {
        _isDirty = true;
        _emit('metrics-persistence:imported', {});
      }
      return result;
    },

    // === SYSTEM INFO ===
    getSystemMetrics() {
      const storeStats = _metricsStore.getSystemStats();
      const ioMetrics = _persistenceIO.getMetrics();
      return {
        ...storeStats,
        ...ioMetrics,
        isDirty: _isDirty
      };
    },

    healthCheck() {
      const stats = _metricsStore.getSystemStats();
      const ioMetrics = _persistenceIO.getMetrics();
      const usagePercent = (stats.totalEntries / stats.maxTotalEntries) * 100;

      let status = 'HEALTHY';
      if (ioMetrics.persistErrors > 5) status = 'ERROR';
      else if (usagePercent > 90) status = 'WARNING';
      else if (usagePercent > 70) status = 'DEGRADED';

      return {
        status,
        version: VERSION,
        moduleId: MODULE_ID,
        panelCount: stats.panelCount,
        totalEntries: stats.totalEntries,
        usagePercent: Math.round(usagePercent),
        systemMetrics: this.getSystemMetrics(),
        isDirty: _isDirty
      };
    },

    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        panelCount: _metricsStore.getSystemStats().panelCount,
        metricTypes: Object.keys(METRIC_TYPES),
        aggregationPeriods: Object.keys(AGGREGATION_PERIODS),
        modular: true
      };
    },

    // === LIFECYCLE ===
    destroy() {
      _destroyed = true;

      if (_persistTimer) {
        clearInterval(_persistTimer);
        _persistTimer = null;
      }

      if (_isDirty) {
        this.persist();
      }

      _metricsStore.destroy();
      _emit('metrics-persistence:destroyed', { systemMetrics: this.getSystemMetrics() });
    }
  };

  return persistence;
}

// Singleton global
let _globalPersistence: ReturnType<typeof createMetricsPersistence> | null = null;

export function getMetricsPersistence(options: Record<string, unknown>) {
  if (!_globalPersistence) {
    _globalPersistence = createMetricsPersistence(options);
  }
  return _globalPersistence;
}

export function resetGlobalPersistence() {
  if (_globalPersistence) {
    _globalPersistence.destroy();
    _globalPersistence = null;
  }
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ['createMetricsPersistence', 'getMetricsPersistence'],
    metricTypes: Object.keys(METRIC_TYPES),
    modular: true
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    hasGlobalPersistence: !!_globalPersistence,
    modular: true
  };
}

export default {
  VERSION, MODULE_ID,
  METRIC_TYPES, AGGREGATION_PERIODS,
  createMetricsPersistence, getMetricsPersistence, resetGlobalPersistence,
  info, healthCheck
};
