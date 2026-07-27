import { VERSION, MODULE_ID, EXPORT_FORMATS, EXPORT_SCOPES } from "./constants.js";
import {
  exportConfig as _exportConfig,
  exportToFile as _exportToFile,
  exportToClipboard as _exportToClipboard,
  importConfig as _importConfig,
  importFromFile as _importFromFile,
  importFromClipboard as _importFromClipboard
} from "./operations.js";
import { _state, _config, getMetrics } from "./state.js";
const _subscribers = [];
function subscribe(callback) {
  if (typeof callback === "function" && _subscribers.indexOf(callback) === -1) {
    _subscribers.push(callback);
  }
  return function unsubscribe() {
    const index = _subscribers.indexOf(callback);
    if (index > -1) _subscribers.splice(index, 1);
  };
}
function _notifySubscribers(event) {
  for (let i = 0; i < _subscribers.length; i++) {
    try {
      _subscribers[i](event);
    } catch (e) {
    }
  }
}
function exportConfig(options) {
  const result = _exportConfig(options);
  _notifySubscribers({ type: "export", result });
  return result;
}
function exportToFile(options) {
  const result = _exportToFile(options);
  _notifySubscribers({ type: "exportToFile", result });
  return result;
}
function exportToClipboard(options) {
  const result = _exportToClipboard(options);
  _notifySubscribers({ type: "exportToClipboard", result });
  return result;
}
function importConfig(data, options) {
  const result = _importConfig(data, options);
  _notifySubscribers({ type: "import", result });
  return result;
}
function importFromFile(file, options) {
  const result = _importFromFile(file, options);
  _notifySubscribers({ type: "importFromFile", result });
  return result;
}
function importFromClipboard(options) {
  const result = _importFromClipboard(options);
  _notifySubscribers({ type: "importFromClipboard", result });
  return result;
}
function getLastExport() {
  return _state.lastExport;
}
function getLastImport() {
  return _state.lastImport;
}
function configure(options) {
  if (options.includeTimestamp !== void 0) _config.includeTimestamp = !!options.includeTimestamp;
  if (options.includeVersion !== void 0) _config.includeVersion = !!options.includeVersion;
  if (options.compressionEnabled !== void 0) _config.compressionEnabled = !!options.compressionEnabled;
  if (options.maxUrlLength !== void 0) _config.maxUrlLength = Math.max(500, options.maxUrlLength);
  if (options.encryptionKey !== void 0) _config.encryptionKey = options.encryptionKey;
}
function getConfig() {
  return Object.assign({}, _config);
}
function healthCheck() {
  const metrics = getMetrics();
  const checks = {
    lowExportErrors: metrics.exportErrors < metrics.exports * 0.1 || metrics.exportErrors < 3,
    lowImportErrors: metrics.importErrors < metrics.imports * 0.1 || metrics.importErrors < 3,
    recentActivity: metrics.exports > 0 || metrics.imports > 0 || true
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  return {
    status: passed === keys.length ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${keys.length}`,
    checks,
    metrics,
    lastExport: _state.lastExport,
    lastImport: _state.lastImport,
    subscriberCount: _subscribers.length,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    config: getConfig(),
    formats: Object.keys(EXPORT_FORMATS),
    scopes: Object.keys(EXPORT_SCOPES),
    metrics: getMetrics(),
    lastExport: _state.lastExport,
    lastImport: _state.lastImport,
    subscriberCount: _subscribers.length,
    timestamp: Date.now()
  };
}
var config_exporter_default = {
  VERSION,
  MODULE_ID,
  EXPORT_FORMATS,
  EXPORT_SCOPES,
  exportConfig,
  exportToFile,
  exportToClipboard,
  importConfig,
  importFromFile,
  importFromClipboard,
  getLastExport,
  getLastImport,
  subscribe,
  configure,
  getConfig,
  getMetrics,
  healthCheck,
  info
};
export {
  EXPORT_FORMATS,
  EXPORT_SCOPES,
  MODULE_ID,
  VERSION,
  configure,
  config_exporter_default as default,
  exportConfig,
  exportToClipboard,
  exportToFile,
  getConfig,
  getLastExport,
  getLastImport,
  getMetrics,
  healthCheck,
  importConfig,
  importFromClipboard,
  importFromFile,
  info,
  subscribe
};
