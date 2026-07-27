const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.kernel.facades.metrics-facade";
function createMetricsFacade(registry) {
  return {
    record(panelId, name, value, options = {}) {
      return registry.get("metrics")?.record(panelId, name, value, options) || null;
    },
    get(panelId, options = {}) {
      return registry.get("metrics")?.get(panelId, options) || [];
    },
    getStats(panelId, metricName, options = {}) {
      return registry.get("metrics")?.getStats(panelId, metricName, options) || null;
    },
    export(format) {
      return registry.get("metrics")?.export(format) || null;
    },
    import(data, options) {
      return registry.get("metrics")?.import(data, options);
    }
  };
}
var metrics_facade_default = { createMetricsFacade };
export {
  MODULE_ID,
  VERSION,
  createMetricsFacade,
  metrics_facade_default as default
};
