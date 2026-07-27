const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "main.ui.container-main.resources.metrics.metrics-store";
import { METRIC_TYPES, DEFAULT_CONFIG } from "./constants.js";
import { calculateStats, aggregateByPeriod } from "./stats-calculator.js";
function createMetricsStore(options = {}) {
  const {
    maxEntriesPerPanel = DEFAULT_CONFIG.MAX_ENTRIES_PER_PANEL,
    maxTotalEntries = DEFAULT_CONFIG.MAX_TOTAL_ENTRIES,
    onWrite
  } = options;
  const _metricsStore = /* @__PURE__ */ new Map();
  const _panelMetadata = /* @__PURE__ */ new Map();
  let _totalWrites = 0;
  let _totalReads = 0;
  function _generateEntryId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  function _getPanelStore(panelId) {
    if (!_metricsStore.has(panelId)) {
      _metricsStore.set(panelId, []);
      _panelMetadata.set(panelId, {
        createdAt: Date.now(),
        lastUpdate: null,
        entryCount: 0
      });
    }
    return _metricsStore.get(panelId);
  }
  function _enforceLimit(panelId) {
    const store = _metricsStore.get(panelId);
    if (!store) return;
    while (store.length > maxEntriesPerPanel) {
      store.shift();
    }
    const metadata = _panelMetadata.get(panelId);
    if (metadata) {
      metadata.entryCount = store.length;
    }
  }
  function _enforceTotalLimit() {
    let totalEntries = 0;
    _metricsStore.forEach((store) => {
      totalEntries += store.length;
    });
    if (totalEntries <= maxTotalEntries) return;
    const excess = totalEntries - maxTotalEntries;
    const panels = Array.from(_metricsStore.keys());
    const perPanel = Math.ceil(excess / panels.length);
    panels.forEach((panelId) => {
      const store = _metricsStore.get(panelId);
      if (store && store.length > perPanel) {
        store.splice(0, Math.min(perPanel, store.length - 10));
      }
    });
  }
  return {
    // Registra painel
    registerPanel(panelId, metadata = {}) {
      _getPanelStore(panelId);
      const panelMeta = _panelMetadata.get(panelId);
      Object.assign(panelMeta, metadata);
      return true;
    },
    // Remove painel
    unregisterPanel(panelId) {
      _metricsStore.delete(panelId);
      _panelMetadata.delete(panelId);
      return true;
    },
    // Registra métrica
    record(panelId, metricName, value, options2 = {}) {
      const {
        type = METRIC_TYPES.GAUGE,
        tags = {},
        timestamp = Date.now()
      } = options2;
      const store = _getPanelStore(panelId);
      const entry = {
        id: _generateEntryId(),
        name: metricName,
        value,
        type,
        tags,
        timestamp
      };
      store.push(entry);
      _totalWrites++;
      onWrite?.(panelId, entry);
      const metadata = _panelMetadata.get(panelId);
      if (metadata) {
        metadata.lastUpdate = timestamp;
        metadata.entryCount = store.length;
      }
      _enforceLimit(panelId);
      _enforceTotalLimit();
      return entry.id;
    },
    // Registra múltiplas métricas
    recordBatch(panelId, metrics) {
      const ids = [];
      metrics.forEach((metric) => {
        const id = this.record(panelId, metric.name, metric.value, metric.options);
        if (id) ids.push(id);
      });
      return ids;
    },
    // Incrementa contador
    increment(panelId, metricName, amount = 1, tags = {}) {
      const store = _getPanelStore(panelId);
      const lastEntry = store.filter((e) => e.name === metricName && e.type === METRIC_TYPES.COUNTER).pop();
      const newValue = (lastEntry?.value || 0) + amount;
      return this.record(panelId, metricName, newValue, { type: METRIC_TYPES.COUNTER, tags });
    },
    // Registra timing
    timing(panelId, metricName, duration, tags = {}) {
      return this.record(panelId, metricName, duration, { type: METRIC_TYPES.TIMING, tags });
    },
    // Obtém métricas de um painel
    get(panelId, options2 = {}) {
      const {
        metricName = null,
        startTime = null,
        endTime = null,
        limit = 100,
        type = null
      } = options2;
      const store = _metricsStore.get(panelId);
      if (!store) return [];
      _totalReads++;
      let filtered = [...store];
      if (metricName) {
        filtered = filtered.filter((e) => e.name === metricName);
      }
      if (type) {
        filtered = filtered.filter((e) => e.type === type);
      }
      if (startTime) {
        filtered = filtered.filter((e) => e.timestamp >= startTime);
      }
      if (endTime) {
        filtered = filtered.filter((e) => e.timestamp <= endTime);
      }
      return filtered.slice(-limit);
    },
    // Obtém métricas agregadas
    getAggregated(panelId, metricName, period) {
      const entries = this.get(panelId, { metricName });
      return aggregateByPeriod(entries, period);
    },
    // Obtém estatísticas
    getStats(panelId, metricName, options2 = {}) {
      const entries = this.get(panelId, { metricName, ...options2 });
      const values = entries.map((e) => e.value);
      return calculateStats(values);
    },
    // Obtém última métrica
    getLast(panelId, metricName) {
      const entries = this.get(panelId, { metricName, limit: 1 });
      return entries.length > 0 ? entries[entries.length - 1] : null;
    },
    // Obtém todas as métricas
    getAll(options2 = {}) {
      const result = {};
      _metricsStore.forEach((store, panelId) => {
        result[panelId] = this.get(panelId, options2);
      });
      return result;
    },
    // Lista painéis
    listPanels() {
      const panels = [];
      _panelMetadata.forEach((metadata, panelId) => {
        panels.push({ panelId, ...metadata });
      });
      return panels;
    },
    // Lista nomes de métricas
    listMetricNames(panelId) {
      const store = _metricsStore.get(panelId);
      if (!store) return [];
      const names = /* @__PURE__ */ new Set();
      store.forEach((e) => names.add(e.name));
      return Array.from(names);
    },
    // Limpa métricas
    // @ts-expect-error strict migration — TS2322
    clear(panelId = null) {
      if (panelId) {
        _metricsStore.set(panelId, []);
        const metadata = _panelMetadata.get(panelId);
        if (metadata) metadata.entryCount = 0;
      } else {
        _metricsStore.clear();
        _panelMetadata.clear();
      }
      return this;
    },
    // Exporta dados brutos
    exportRaw() {
      const data = {};
      _metricsStore.forEach((store, panelId) => {
        data[panelId] = {
          entries: store,
          metadata: _panelMetadata.get(panelId)
        };
      });
      return data;
    },
    // Importa dados brutos
    importRaw(data, merge = false) {
      Object.entries(data).forEach(([panelId, panelData]) => {
        if (merge && _metricsStore.has(panelId)) {
          const existing = _metricsStore.get(panelId);
          existing.push(...panelData.entries || []);
          _enforceLimit(panelId);
        } else {
          _metricsStore.set(panelId, panelData.entries || []);
          _panelMetadata.set(panelId, panelData.metadata || { createdAt: Date.now() });
        }
      });
      return true;
    },
    // Obtém contagem total
    getTotalEntries() {
      let total = 0;
      _metricsStore.forEach((store) => {
        total += store.length;
      });
      return total;
    },
    // Obtém estatísticas do sistema
    getSystemStats() {
      return {
        totalWrites: _totalWrites,
        totalReads: _totalReads,
        panelCount: _metricsStore.size,
        totalEntries: this.getTotalEntries(),
        maxEntriesPerPanel,
        maxTotalEntries
      };
    },
    // Destroy
    destroy() {
      _metricsStore.clear();
      _panelMetadata.clear();
    }
  };
}
var metrics_store_default = { createMetricsStore };
export {
  MODULE_ID,
  VERSION,
  createMetricsStore,
  metrics_store_default as default
};
