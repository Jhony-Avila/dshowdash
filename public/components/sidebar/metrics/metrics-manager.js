const VERSION = "7.4.0-P2-ENTERPRISE";
const MODULE_ID = "sidebar.metrics.metrics-manager";
function createMetricsManager() {
  const _metrics = {
    inits: 0,
    toggles: 0,
    navigations: 0,
    errors: 0,
    externalCollapses: 0,
    modelLoaderCalls: 0,
    safeModeBoots: 0
  };
  return {
    increment(key) {
      if (_metrics.hasOwnProperty(key)) {
        _metrics[key]++;
      }
    },
    get(key) {
      return _metrics[key];
    },
    getAll() {
      return Object.assign({}, _metrics);
    },
    set(key, value) {
      if (_metrics.hasOwnProperty(key)) {
        _metrics[key] = value;
      }
    },
    reset() {
      _metrics.inits = 0;
      _metrics.toggles = 0;
      _metrics.navigations = 0;
      _metrics.errors = 0;
      _metrics.externalCollapses = 0;
      _metrics.modelLoaderCalls = 0;
      _metrics.safeModeBoots = 0;
    },
    incrementInits() {
      _metrics.inits++;
    },
    incrementToggles() {
      _metrics.toggles++;
    },
    incrementNavigations() {
      _metrics.navigations++;
    },
    incrementErrors() {
      _metrics.errors++;
    },
    incrementExternalCollapses() {
      _metrics.externalCollapses++;
    },
    incrementModelLoaderCalls() {
      _metrics.modelLoaderCalls++;
    },
    incrementSafeModeBoots() {
      _metrics.safeModeBoots++;
    }
  };
}
var metrics_manager_default = { createMetricsManager };
export {
  MODULE_ID,
  VERSION,
  createMetricsManager,
  metrics_manager_default as default
};
