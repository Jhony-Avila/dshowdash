import { VERSION, DEFAULT_CONFIG } from "./constants.js";
const MODULE_ID = "main.ui.container-main.resources.metrics.persistence-io";
function createPersistenceIO(options = {}) {
  const {
    storageAdapter,
    metricsStore,
    storageKey = DEFAULT_CONFIG.STORAGE_PREFIX,
    onPersist,
    onRestore,
    onError
  } = options;
  let _systemMetrics = {
    totalPersists: 0,
    lastPersist: null,
    persistErrors: 0,
    storageUsedBytes: 0
  };
  return {
    // Persiste no storage
    persist() {
      if (!storageAdapter?.isAvailable()) return false;
      try {
        const rawData = metricsStore.exportRaw();
        const data = {
          version: VERSION,
          timestamp: Date.now(),
          panels: rawData
        };
        const result = storageAdapter.set(storageKey, data);
        _systemMetrics.totalPersists++;
        _systemMetrics.lastPersist = Date.now();
        _systemMetrics.storageUsedBytes = result.size;
        onPersist?.(data);
        return true;
      } catch (error) {
        _systemMetrics.persistErrors++;
        onError?.("persist", error);
        return false;
      }
    },
    // Restaura do storage
    restore() {
      if (!storageAdapter?.isAvailable()) return false;
      try {
        const data = storageAdapter.get(storageKey);
        if (!data || !data.panels) return false;
        metricsStore.importRaw(data.panels, false);
        onRestore?.(data);
        return true;
      } catch (error) {
        onError?.("restore", error);
        return false;
      }
    },
    // Limpa storage
    clearStorage() {
      if (!storageAdapter?.isAvailable()) return false;
      return storageAdapter.remove(storageKey);
    },
    // Exporta métricas
    export(format = "json") {
      const rawData = metricsStore.exportRaw();
      const data = {
        version: VERSION,
        exportedAt: Date.now(),
        panels: {}
      };
      Object.entries(rawData).forEach(([panelId, panelData]) => {
        data.panels[panelId] = {
          entries: panelData.entries,
          metadata: panelData.metadata,
          stats: {}
        };
        const names = metricsStore.listMetricNames(panelId);
        names.forEach((name) => {
          data.panels[panelId].stats[name] = metricsStore.getStats(panelId, name);
        });
      });
      if (format === "json") {
        return JSON.stringify(data, null, 2);
      }
      return data;
    },
    // Importa métricas
    import(data, options2 = {}) {
      const { merge = false } = options2;
      let parsed = data;
      if (typeof data === "string") {
        parsed = JSON.parse(data);
      }
      if (!parsed.panels) return false;
      metricsStore.importRaw(parsed.panels, merge);
      return true;
    },
    // Obtém métricas de persistência
    getMetrics() {
      return { ..._systemMetrics };
    },
    // Reseta métricas
    resetMetrics() {
      _systemMetrics = {
        totalPersists: 0,
        lastPersist: null,
        persistErrors: 0,
        storageUsedBytes: 0
      };
    }
  };
}
var persistence_io_default = { createPersistenceIO };
export {
  MODULE_ID,
  createPersistenceIO,
  persistence_io_default as default
};
