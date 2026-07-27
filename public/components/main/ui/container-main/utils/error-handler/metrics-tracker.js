const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.error-handler.metrics-tracker";
function createMetricsTracker() {
  let _metrics = {
    total: 0,
    handled: 0,
    unhandled: 0,
    recovered: 0,
    byCategory: {},
    bySeverity: {}
  };
  return {
    // Incrementa contador total
    incrementTotal() {
      _metrics.total++;
    },
    // Incrementa handled
    incrementHandled() {
      _metrics.handled++;
    },
    // Incrementa unhandled
    incrementUnhandled() {
      _metrics.unhandled++;
    },
    // Incrementa recovered
    incrementRecovered() {
      _metrics.recovered++;
    },
    // Registra por categoria
    trackCategory(category) {
      _metrics.byCategory[category] = (_metrics.byCategory[category] || 0) + 1;
    },
    // Registra por severidade
    trackSeverity(severity) {
      _metrics.bySeverity[severity] = (_metrics.bySeverity[severity] || 0) + 1;
    },
    // Registra erro completo
    track(errorInfo) {
      this.incrementTotal();
      if (errorInfo.handled) {
        this.incrementHandled();
      } else {
        this.incrementUnhandled();
      }
      if (errorInfo.recovered) {
        this.incrementRecovered();
      }
      this.trackCategory(errorInfo.category);
      this.trackSeverity(errorInfo.severity);
    },
    // Obtém métricas
    getMetrics() {
      return { ..._metrics };
    },
    // Reseta métricas
    reset() {
      _metrics = {
        total: 0,
        handled: 0,
        unhandled: 0,
        recovered: 0,
        byCategory: {},
        bySeverity: {}
      };
    }
  };
}
var metrics_tracker_default = { createMetricsTracker };
export {
  MODULE_ID,
  VERSION,
  createMetricsTracker,
  metrics_tracker_default as default
};
