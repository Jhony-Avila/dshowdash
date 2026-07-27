import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "6.4.0-P17WI";
const MODULE_ID = "ticker.config.store";
const CONFIG_VERSION = 2;
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
class TickerConfigStore {
  constructor() {
    this.storageKey = "dshowdash_ticker_config";
    this.listeners = [];
    this._metrics = { loadCount: 0, saveCount: 0, updateCount: 0, resetCount: 0, migrateCount: 0, lastUpdateAt: null };
    this.config = this._loadConfig();
  }
  _getDefaultConfig() {
    return { _version: CONFIG_VERSION, behavior: { mode: "ticker", direction: "left", speed: "medium", pauseOnHover: true }, content: { sources: ["g1", "uol", "folha"], categories: ["politica", "economia", "tecnologia", "geral"], maxItems: 20, autoRefreshMinutes: 5 }, visual: { height: "default", fontSize: "medium", showTag: true, showIcon: true, showTime: true, separatorStyle: "bullet" }, theme: { background: "darkA", accent: "purple", text: "light", tagStyle: "category", shadow: "soft" }, accessibility: { respectReducedMotion: true, highContrast: false }, preset: "enterprise-default" };
  }
  _migrate(stored) {
    const version = stored._version || 1;
    if (version === CONFIG_VERSION) return stored;
    _log("info", `Migrando config v${version} -> v${CONFIG_VERSION}`);
    this._metrics.migrateCount++;
    let migrated = { ...stored };
    if (version < 2) {
      migrated.visual = migrated.visual || {};
      migrated.visual.separatorStyle = migrated.visual.separatorStyle || "bullet";
      migrated.accessibility = migrated.accessibility || { respectReducedMotion: true, highContrast: false };
    }
    migrated._version = CONFIG_VERSION;
    return migrated;
  }
  _loadConfig() {
    this._metrics.loadCount++;
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        let parsed = JSON.parse(stored);
        parsed = this._migrate(parsed);
        const merged = this._mergeDeep(this._getDefaultConfig(), parsed);
        if (parsed._version !== CONFIG_VERSION) {
          this._save(merged);
        }
        return merged;
      }
    } catch (error) {
      _log("warn", "Erro ao carregar storage:", error);
    }
    return this._getDefaultConfig();
  }
  getConfig() {
    return JSON.parse(JSON.stringify(this.config));
  }
  getDefaultConfig() {
    return this._getDefaultConfig();
  }
  getConfigVersion() {
    return CONFIG_VERSION;
  }
  update(partialConfig) {
    delete partialConfig._version;
    this.config = this._mergeDeep(this.config, partialConfig);
    this.config._version = CONFIG_VERSION;
    this._save(this.config);
    this._notify();
    this._metrics.updateCount++;
    this._metrics.lastUpdateAt = Date.now();
  }
  _save(config) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(config));
      this._metrics.saveCount++;
    } catch (error) {
      _log("error", "Erro ao salvar:", error);
    }
  }
  reset() {
    this.config = this._getDefaultConfig();
    this._save(this.config);
    this._notify();
    this._metrics.resetCount++;
  }
  applyPreset(presetName) {
    const presets = { "enterprise-default": this._getDefaultConfig(), "reading-comfort": { behavior: { mode: "ticker", direction: "left", speed: "slow", pauseOnHover: true }, visual: { height: "tall", fontSize: "large", showTag: true, showIcon: false, showTime: true, separatorStyle: "bar" }, theme: { background: "darkA", accent: "blue", text: "light", tagStyle: "mono", shadow: "soft" }, accessibility: { respectReducedMotion: true, highContrast: false } }, "colorful-soft": { behavior: { mode: "ticker", direction: "left", speed: "medium", pauseOnHover: true }, visual: { height: "default", fontSize: "medium", showTag: true, showIcon: true, showTime: true, separatorStyle: "chevron" }, theme: { background: "darkB", accent: "purple", text: "light", tagStyle: "category", shadow: "medium" }, accessibility: { respectReducedMotion: true, highContrast: false } } };
    const preset = presets[presetName];
    if (preset) {
      this.config = this._mergeDeep(this._getDefaultConfig(), preset);
      this.config.preset = presetName;
      this.config._version = CONFIG_VERSION;
      this._save(this.config);
      this._notify();
    }
  }
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
  _notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.config);
      } catch (e) {
        _log("error", "Erro em listener:", e);
      }
    });
  }
  _mergeDeep(target, source) {
    const output = { ...target };
    if (this._isObject(target) && this._isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (this._isObject(source[key])) {
          output[key] = !(key in target) ? source[key] : this._mergeDeep(target[key], source[key]);
        } else {
          output[key] = source[key];
        }
      });
    }
    return output;
  }
  _isObject(item) {
    return item && typeof item === "object" && !Array.isArray(item);
  }
  validate(config) {
    return config.behavior && ["ticker", "static"].includes(config.behavior.mode) && config.content && Array.isArray(config.content.sources) && config.visual && config.visual.height && config.theme && config.theme.background;
  }
  exportConfig() {
    return JSON.stringify(this.config, null, 2);
  }
  importConfig(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      if (this.validate(imported)) {
        imported._version = CONFIG_VERSION;
        this.config = this._mergeDeep(this._getDefaultConfig(), imported);
        this._save(this.config);
        this._notify();
        return true;
      }
      return false;
    } catch (error) {
      _log("error", "Erro ao importar:", error);
      return false;
    }
  }
  healthCheck() {
    const logger = _getPort("logger");
    const checks = { hasConfig: !!this.config, validConfig: this.validate(this.config), correctVersion: this.config._version === CONFIG_VERSION, storageAccessible: true, loggerReady: !!logger, portsInitialized: Ports.isInitialized() };
    try {
      localStorage.getItem(this.storageKey);
    } catch {
      checks.storageAccessible = false;
    }
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 6 ? "HEALTHY" : "DEGRADED", score: `${passed}/6`, checks, configVersion: CONFIG_VERSION, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, configVersion: CONFIG_VERSION, preset: this.config.preset, listenerCount: this.listeners.length, metrics: this._metrics, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { loadCount: 0, saveCount: 0, updateCount: 0, resetCount: 0, migrateCount: 0, lastUpdateAt: null };
  }
}
function getVersion() {
  return VERSION;
}
var store_default = TickerConfigStore;
export {
  MODULE_ID,
  TickerConfigStore,
  VERSION,
  store_default as default,
  getPorts,
  getVersion,
  injectPorts
};
