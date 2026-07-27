import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.5.0-ES6";
const MODULE_ID = "ticker.ui.panels.settings-sections";
const hasWindow = typeof window !== "undefined";
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
const _debug = () => {
  const cfg = _getPort("config");
  return cfg?.app?.debug ?? false;
};
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (!_debug() && level === "debug") return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn(`[${MODULE_ID}]`, ...args);
};
class SettingsSectionsManager {
  constructor(panel, config) {
    this.panel = panel;
    this.config = JSON.parse(JSON.stringify(config));
    this.listeners = /* @__PURE__ */ new Map();
    this._metrics = { changeCount: 0, lastChangeAt: null };
  }
  init() {
    this.attachInputListeners();
    _log("debug", "Sections manager initialized");
  }
  attachInputListeners() {
    this.panel.querySelectorAll('input[type="radio"]').forEach((radio) => {
      const listener = (e) => this.handleRadioChange(e);
      radio.addEventListener("change", listener);
      this.listeners.set(radio, listener);
    });
    this.panel.querySelectorAll('input[type="checkbox"][data-setting]').forEach((checkbox) => {
      const listener = (e) => this.handleCheckboxChange(e);
      checkbox.addEventListener("change", listener);
      this.listeners.set(checkbox, listener);
    });
    this.panel.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach((checkbox) => {
      const listener = (e) => this.handleArrayCheckboxChange(e);
      checkbox.addEventListener("change", listener);
      this.listeners.set(checkbox, listener);
    });
    this.panel.querySelectorAll('input[type="number"], input[type="text"]').forEach((input) => {
      const listener = (e) => this.handleInputChange(e);
      input.addEventListener("input", listener);
      this.listeners.set(input, listener);
    });
    this.panel.querySelectorAll("select").forEach((select) => {
      const listener = (e) => this.handleSelectChange(e);
      select.addEventListener("change", listener);
      this.listeners.set(select, listener);
    });
  }
  handleRadioChange(e) {
    const t = e.target;
    const group = t.closest("[data-setting]");
    if (!group) return;
    this.setConfigValue(group.dataset.setting, t.value);
    this._metrics.changeCount++;
    this._metrics.lastChangeAt = Date.now();
  }
  handleCheckboxChange(e) {
    const t = e.target;
    const path = t.dataset.setting;
    if (!path) return;
    this.setConfigValue(path, t.checked);
    this._metrics.changeCount++;
    this._metrics.lastChangeAt = Date.now();
  }
  handleArrayCheckboxChange(e) {
    const t = e.target;
    const group = t.closest("[data-setting]");
    if (!group) return;
    const checkboxes = group.querySelectorAll('input[type="checkbox"]:checked');
    const values = Array.from(checkboxes).map((cb) => cb.value);
    this.setConfigValue(group.dataset.setting, values);
    this._metrics.changeCount++;
    this._metrics.lastChangeAt = Date.now();
  }
  handleInputChange(e) {
    const t = e.target;
    const path = t.dataset.setting;
    if (!path) return;
    const value = t.type === "number" ? parseInt(t.value, 10) : t.value;
    this.setConfigValue(path, value);
    this._metrics.changeCount++;
    this._metrics.lastChangeAt = Date.now();
  }
  handleSelectChange(e) {
    const t = e.target;
    const path = t.dataset.setting;
    if (!path) return;
    let value = t.value;
    if (!isNaN(value)) {
      value = parseInt(value, 10);
    }
    this.setConfigValue(path, value);
    this._metrics.changeCount++;
    this._metrics.lastChangeAt = Date.now();
  }
  setConfigValue(path, value) {
    const keys = path.split(".");
    let current = this.config;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    _log("debug", `Config value set: ${path} =`, value);
  }
  getConfig() {
    return JSON.parse(JSON.stringify(this.config));
  }
  destroy() {
    this.listeners.forEach((listener, element) => {
      element.removeEventListener("change", listener);
      element.removeEventListener("input", listener);
    });
    this.listeners.clear();
    this.panel = null;
    this.config = null;
    _log("debug", "Sections manager destroyed");
  }
  healthCheck() {
    const logger = _getPort("logger");
    const checks = { hasPanel: !!this.panel, hasConfig: !!this.config, loggerReady: !!logger, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 4 ? "HEALTHY" : "DEGRADED", score: `${passed}/4`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, listenerCount: this.listeners.size, metrics: this._metrics, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { changeCount: 0, lastChangeAt: null };
  }
}
function getVersion() {
  return VERSION;
}
var settings_sections_default = SettingsSectionsManager;
export {
  MODULE_ID,
  SettingsSectionsManager,
  VERSION,
  settings_sections_default as default,
  getPorts,
  getVersion,
  injectPorts
};
