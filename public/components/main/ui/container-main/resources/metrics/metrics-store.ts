
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: metrics-store
// PURPOSE: Metrics Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   METRIC_TYPES, DEFAULT_CONFIG from ./constants.js
//   calculateStats, aggregateByPeriod from ./stats-calculator.js
//
// PROVIDES:
//   createMetricsStore() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'main.ui.container-main.resources.metrics.metrics-store';

import { METRIC_TYPES, DEFAULT_CONFIG } from './constants.js';
import { calculateStats, aggregateByPeriod } from './stats-calculator.js';

export function createMetricsStore(options: Record<string, any> = {}) {
  const {
    maxEntriesPerPanel = DEFAULT_CONFIG.MAX_ENTRIES_PER_PANEL,
    maxTotalEntries = DEFAULT_CONFIG.MAX_TOTAL_ENTRIES,
    onWrite
  } = options;

  // In-memory metrics store
  const _metricsStore = new Map();
  
  // Panel metadata
  const _panelMetadata = new Map();

  // System metrics
  let _totalWrites = 0;
  let _totalReads = 0;

  // Gera ID de entrada
  function _generateEntryId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Obtém ou cria store do painel
  function _getPanelStore(panelId: string) {
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

  // Limita entradas por painel
  function _enforceLimit(panelId: string) {
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

  // Limita total de entradas
  function _enforceTotalLimit() {
    let totalEntries = 0;
    _metricsStore.forEach(store => {
      totalEntries += store.length;
    });

    if (totalEntries <= maxTotalEntries) return;

    const excess = totalEntries - maxTotalEntries;
    const panels = Array.from(_metricsStore.keys());
    const perPanel = Math.ceil(excess / panels.length);

    panels.forEach(panelId => {
      const store = _metricsStore.get(panelId);
      if (store && store.length > perPanel) {
        store.splice(0, Math.min(perPanel, store.length - 10));
      }
    });
  }

  return {
    // Registra painel
    registerPanel(panelId: string, metadata = {}) {
      _getPanelStore(panelId);
      const panelMeta = _panelMetadata.get(panelId);
      Object.assign(panelMeta, metadata);
      return true;
    },

    // Remove painel
    unregisterPanel(panelId: string) {
      _metricsStore.delete(panelId);
      _panelMetadata.delete(panelId);
      return true;
    },

    // Registra métrica
    record(panelId: string, metricName: string, value: unknown, options: Record<string, any> = {}) {
      const {
        type = METRIC_TYPES.GAUGE,
        tags = {},
        timestamp = Date.now()
      } = options;

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
    recordBatch(panelId: string, metrics: Array<{ name: string; value: unknown; options?: Record<string, unknown> }>) {
      const ids: unknown[] = [];
      metrics.forEach((metric) => {
        const id = this.record(panelId, metric.name, metric.value, metric.options as Record<string, any>);
        if (id) ids.push(id);
      });
      return ids;
    },

    // Incrementa contador
    increment(panelId: string, metricName: string, amount = 1, tags = {}) {
      const store = _getPanelStore(panelId);
      const lastEntry = store.filter((e: Record<string, unknown>) => e.name === metricName && e.type === METRIC_TYPES.COUNTER).pop();
      const newValue = (lastEntry?.value || 0) + amount;
      
      return this.record(panelId, metricName, newValue, { type: METRIC_TYPES.COUNTER, tags });
    },

    // Registra timing
    timing(panelId: string, metricName: string, duration: number, tags = {}) {
      return this.record(panelId, metricName, duration, { type: METRIC_TYPES.TIMING, tags });
    },

    // Obtém métricas de um painel
    get(panelId: string, options: Record<string, any> = {}) {
      const {
        metricName = null,
        startTime = null,
        endTime = null,
        limit = 100,
        type = null
      } = options;

      const store = _metricsStore.get(panelId);
      if (!store) return [];

      _totalReads++;

      let filtered = [...store];

      if (metricName) {
        filtered = filtered.filter(e => e.name === metricName);
      }
      if (type) {
        filtered = filtered.filter(e => e.type === type);
      }
      if (startTime) {
        filtered = filtered.filter(e => e.timestamp >= startTime);
      }
      if (endTime) {
        filtered = filtered.filter(e => e.timestamp <= endTime);
      }

      return filtered.slice(-limit);
    },

    // Obtém métricas agregadas
    getAggregated(panelId: string, metricName: string, period: number) {
      const entries = this.get(panelId, { metricName });
      return aggregateByPeriod(entries, period);
    },

    // Obtém estatísticas
    getStats(panelId: string, metricName: string, options = {}) {
      const entries = this.get(panelId, { metricName, ...options });
      const values = entries.map((e: Record<string, unknown>) => e.value as number);
      return calculateStats(values);
    },

    // Obtém última métrica
    getLast(panelId: string, metricName: string) {
      const entries = this.get(panelId, { metricName, limit: 1 });
      return entries.length > 0 ? entries[entries.length - 1] : null;
    },

    // Obtém todas as métricas
    getAll(options = {}) {
      const result = {};
      _metricsStore.forEach((store, panelId) => {
        (result as Record<string, unknown>)[panelId] = this.get(panelId, options);
      });
      return result;
    },

    // Lista painéis
    listPanels() {
      const panels: unknown[] = [];
      _panelMetadata.forEach((metadata, panelId) => {
        panels.push({ panelId, ...metadata });
      });
      return panels;
    },

    // Lista nomes de métricas
    listMetricNames(panelId: string) {
      const store = _metricsStore.get(panelId);
      if (!store) return [];

      const names = new Set();
      store.forEach((e: Record<string, unknown>) => names.add(e.name));
      return Array.from(names);
    },

    // Limpa métricas
    // @ts-expect-error strict migration — TS2322
    clear(panelId: string = null) {
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
        (data as Record<string, unknown>)[panelId] = {
          entries: store,
          metadata: _panelMetadata.get(panelId)
        };
      });
      return data;
    },

    // Importa dados brutos
    importRaw(data: Record<string, unknown>, merge = false) {
      Object.entries(data).forEach(([panelId, panelData]: [string, any]) => {
        if (merge && _metricsStore.has(panelId)) {
          const existing = _metricsStore.get(panelId);
          existing.push(...(panelData.entries || []));
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
      _metricsStore.forEach(store => {
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

export default { createMetricsStore };
