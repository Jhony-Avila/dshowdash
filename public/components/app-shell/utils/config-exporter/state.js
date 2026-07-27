const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.utils.config-exporter.state";
const _state = {
  lastExport: null,
  lastImport: null
};
const _config = {
  includeTimestamp: true,
  includeVersion: true,
  compressionEnabled: false,
  maxUrlLength: 2e3,
  encryptionKey: null
};
const _metrics = {
  exports: 0,
  imports: 0,
  exportErrors: 0,
  importErrors: 0
};
function getMetrics() {
  return Object.assign({}, _metrics);
}
function incrementMetric(name) {
  if (_metrics[name] !== void 0) {
    _metrics[name]++;
  }
}
export {
  MODULE_ID,
  VERSION,
  _config,
  _state,
  getMetrics,
  incrementMetric
};
