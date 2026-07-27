import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.9.0-ES6";
const MODULE_ID = "sidebar-config-manager";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
let _metrics = { exports: 0, imports: 0, resets: 0, errors: 0 };
const CONFIG_KEYS = ["dsd-sidebar-collapsed", "dsd-sidebar-width", "dsd-sidebar-theme", "dsd-sidebar-auto-theme", "dsd-sidebar-favorites", "dsd-sidebar-recent", "dsd-sidebar-order", "dsd-sidebar-expanded-sections"];
function init(eventBus) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.CONFIG_INITIALIZED);
}
function exportConfig() {
  const config = { version: VERSION, exportedAt: (/* @__PURE__ */ new Date()).toISOString(), settings: {} };
  CONFIG_KEYS.forEach((key) => {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) config.settings[key] = value;
    } catch (e) {
      _metrics.errors++;
    }
  });
  _metrics.exports++;
  return config;
}
function exportConfigAsJSON() {
  return JSON.stringify(exportConfig(), null, 2);
}
function downloadConfig(filename = "sidebar-config.json") {
  const json = exportConfigAsJSON();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
function importConfig(config) {
  if (!config?.settings) {
    _metrics.errors++;
    throw new Error("Invalid config format");
  }
  const imported = [];
  const failed = [];
  Object.entries(config.settings).forEach((entry) => {
    const key = entry[0];
    const value = entry[1];
    try {
      if (CONFIG_KEYS.includes(key)) {
        localStorage.setItem(key, value);
        imported.push(key);
      }
    } catch (e) {
      failed.push(key);
      _metrics.errors++;
    }
  });
  _metrics.imports++;
  return { imported, failed, total: Object.keys(config.settings).length };
}
function importConfigFromJSON(jsonString) {
  const config = JSON.parse(jsonString);
  return importConfig(config);
}
function importConfigFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = importConfigFromJSON(e.target.result);
        resolve(result);
      } catch (error) {
        _metrics.errors++;
        reject(error);
      }
    };
    reader.onerror = () => {
      _metrics.errors++;
      reject(new Error("Failed to read file"));
    };
    reader.readAsText(file);
  });
}
function resetConfig() {
  CONFIG_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      _metrics.errors++;
    }
  });
  _metrics.resets++;
}
function getConfigSummary() {
  const summary = {};
  CONFIG_KEYS.forEach((key) => {
    try {
      const value = localStorage.getItem(key);
      summary[key] = value !== null;
    } catch (e) {
      summary[key] = false;
    }
  });
  return summary;
}
function destroy() {
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), configKeys: CONFIG_KEYS.length, summary: getConfigSummary(), metrics: getMetrics() };
}
function healthCheck() {
  return { status: _metrics.errors === 0 ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { configKeys: CONFIG_KEYS.length, noErrors: _metrics.errors === 0 }, metrics: getMetrics() };
}
var config_manager_default = { init, exportConfig, exportConfigAsJSON, downloadConfig, importConfig, importConfigFromJSON, importConfigFromFile, resetConfig, getConfigSummary, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID, CONFIG_KEYS };
export {
  MODULE_ID,
  VERSION,
  config_manager_default as default,
  destroy,
  downloadConfig,
  exportConfig,
  exportConfigAsJSON,
  getConfigSummary,
  getMetrics,
  getPorts,
  healthCheck,
  importConfig,
  importConfigFromFile,
  importConfigFromJSON,
  info,
  init,
  injectPorts,
  resetConfig
};
