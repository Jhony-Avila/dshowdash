import {
  VERSION,
  MODULE_ID,
  METRIC_TYPES,
  AGGREGATION_PERIODS,
  DEFAULT_CONFIG,
  createStorageAdapter,
  createMetricsStore,
  createPersistenceIO
} from "./metrics/index.js";
function createMetricsPersistence(options = {}) {
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
  let _persistTimer = null;
  let _isDirty = false;
  let _destroyed = false;
  function _emit(event, data) {
    if (eventBus?.emit) {
      eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
    }
  }
  const _storageAdapter = createStorageAdapter({ enableCompression });
  const _metricsStore = createMetricsStore({
    maxEntriesPerPanel,
    maxTotalEntries,
    onWrite: (panelId, entry) => {
      _isDirty = true;
      _emit("metrics-persistence:recorded", { panelId, metricName: entry.name, value: entry.value });
    }
  });
  const _persistenceIO = createPersistenceIO({
    storageAdapter: _storageAdapter,
    metricsStore: _metricsStore,
    storageKey,
    onPersist: (data) => {
      _isDirty = false;
      onPersist?.(data);
      _emit("metrics-persistence:persisted", { size: _persistenceIO.getMetrics().storageUsedBytes });
    },
    onRestore: (data) => {
      onRestore?.(data);
      _emit("metrics-persistence:restored", { panelCount: Object.keys(data.panels).length });
    },
    onError: (op, error) => {
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
      _emit("metrics-persistence:initialized", {});
      return this;
    },
    // === PANEL MANAGEMENT ===
    registerPanel(panelId, metadata = {}) {
      if (_destroyed) return false;
      const result = _metricsStore.registerPanel(panelId, metadata);
      _emit("metrics-persistence:panel-registered", { panelId });
      return result;
    },
    unregisterPanel(panelId) {
      const result = _metricsStore.unregisterPanel(panelId);
      _isDirty = true;
      _emit("metrics-persistence:panel-unregistered", { panelId });
      return result;
    },
    // === RECORD OPERATIONS ===
    record(panelId, metricName, value, options2 = {}) {
      if (_destroyed) return null;
      return _metricsStore.record(panelId, metricName, value, options2);
    },
    recordBatch(panelId, metrics) {
      if (_destroyed) return [];
      return _metricsStore.recordBatch(panelId, metrics);
    },
    increment(panelId, metricName, amount = 1, tags = {}) {
      if (_destroyed) return null;
      return _metricsStore.increment(panelId, metricName, amount, tags);
    },
    timing(panelId, metricName, duration, tags = {}) {
      if (_destroyed) return null;
      return _metricsStore.timing(panelId, metricName, duration, tags);
    },
    // === READ OPERATIONS ===
    get(panelId, options2 = {}) {
      return _metricsStore.get(panelId, options2);
    },
    getAggregated(panelId, metricName, period = AGGREGATION_PERIODS.HOUR) {
      return _metricsStore.getAggregated(panelId, metricName, period);
    },
    getStats(panelId, metricName, options2 = {}) {
      return _metricsStore.getStats(panelId, metricName, options2);
    },
    getLast(panelId, metricName) {
      return _metricsStore.getLast(panelId, metricName);
    },
    getAll(options2 = {}) {
      return _metricsStore.getAll(options2);
    },
    listPanels() {
      return _metricsStore.listPanels();
    },
    listMetricNames(panelId) {
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
    clear(panelId = null) {
      _metricsStore.clear(panelId);
      _isDirty = true;
      _emit("metrics-persistence:cleared", { panelId });
      return this;
    },
    clearStorage() {
      _persistenceIO.clearStorage();
      _emit("metrics-persistence:storage-cleared", {});
      return this;
    },
    export(format = "json") {
      return _persistenceIO.export(format);
    },
    import(data, options2 = {}) {
      const result = _persistenceIO.import(data, options2);
      if (result) {
        _isDirty = true;
        _emit("metrics-persistence:imported", {});
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
      const usagePercent = stats.totalEntries / stats.maxTotalEntries * 100;
      let status = "HEALTHY";
      if (ioMetrics.persistErrors > 5) status = "ERROR";
      else if (usagePercent > 90) status = "WARNING";
      else if (usagePercent > 70) status = "DEGRADED";
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
      _emit("metrics-persistence:destroyed", { systemMetrics: this.getSystemMetrics() });
    }
  };
  return persistence;
}
let _globalPersistence = null;
function getMetricsPersistence(options) {
  if (!_globalPersistence) {
    _globalPersistence = createMetricsPersistence(options);
  }
  return _globalPersistence;
}
function resetGlobalPersistence() {
  if (_globalPersistence) {
    _globalPersistence.destroy();
    _globalPersistence = null;
  }
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ["createMetricsPersistence", "getMetricsPersistence"],
    metricTypes: Object.keys(METRIC_TYPES),
    modular: true
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    hasGlobalPersistence: !!_globalPersistence,
    modular: true
  };
}
var metrics_persistence_default = {
  VERSION,
  MODULE_ID,
  METRIC_TYPES,
  AGGREGATION_PERIODS,
  createMetricsPersistence,
  getMetricsPersistence,
  resetGlobalPersistence,
  info,
  healthCheck
};
export {
  AGGREGATION_PERIODS,
  METRIC_TYPES,
  MODULE_ID,
  VERSION,
  createMetricsPersistence,
  metrics_persistence_default as default,
  getMetricsPersistence,
  healthCheck,
  info,
  resetGlobalPersistence
};
