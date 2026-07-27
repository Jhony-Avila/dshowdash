const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.state.slot-persistence.state";
const _state = {
  slots: {},
  metrics: {
    saves: 0,
    loads: 0,
    restores: 0,
    errors: 0
  }
};
function incrementMetric(key) {
  if (_state.metrics.hasOwnProperty(key)) {
    _state.metrics[key]++;
  }
}
function getMetrics() {
  return Object.assign({}, _state.metrics);
}
function resetMetrics() {
  _state.metrics.saves = 0;
  _state.metrics.loads = 0;
  _state.metrics.restores = 0;
  _state.metrics.errors = 0;
}
export {
  MODULE_ID,
  VERSION,
  _state,
  getMetrics,
  incrementMetric,
  resetMetrics
};
