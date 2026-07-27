import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { HEADER_EVENTS } from "/core/runtime/events/catalog/header.events.js";
const VERSION = "5.5.0-P18EC";
const MODULE_ID = "header/core/header-initializer";
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
const _debugEnabled = () => _getPort("config")?.app?.debug || false;
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    logger.error?.(prefix, ...args);
    return;
  }
  if (level === "warn") {
    logger.warn?.(prefix, ...args);
    return;
  }
  if (level === "info") {
    logger.info?.(prefix, ...args);
    return;
  }
  if (_debugEnabled()) logger.debug?.(prefix, ...args);
};
class HeaderInitializer {
  constructor(header) {
    this.header = header;
    this._debug = false;
    this._metrics = { configLoadCount: 0, cacheElementsCount: 0, validateCount: 0, errorCount: 0, lastInitAt: null };
  }
  async loadConfig() {
    try {
      const response = await this.header.fetchClient.fetch("/components/header/config.json", { timeout: 5e3, retries: 1, bypassCircuit: true });
      this.header.config = await response.json();
      this.validateConfig();
      _log("info", "Config carregado");
      this._metrics.configLoadCount++;
      this._metrics.lastInitAt = Date.now();
    } catch (error) {
      _log("warn", "Erro ao carregar config, usando defaults:", error.message);
      this.header.config = this.getDefaultConfig();
      this._metrics.errorCount++;
      if (this.header.telemetry) {
        this.header.telemetry.track(HEADER_EVENTS.CONFIG_LOAD_FAILED, { reason: error.message, instanceId: this.header.instanceId, action: "config-error" });
      }
    }
    try {
      const override = document.body.dataset.headerConfig;
      if (override) {
        this.header.config = { ...this.header.config, ...JSON.parse(override) };
        _log("debug", "Config override aplicado");
      }
    } catch (e) {
      _log("warn", "Erro ao parsear data-header-config");
    }
  }
  // @ts-expect-error TS migration - TS2740
  validateConfig() {
    this._metrics.validateCount++;
    const requiredPaths = ["api.healthEndpoint", "api.timeout", "polling.healthInterval", "telemetry.sampleRate"];
    const missing = [];
    for (const path of requiredPaths) {
      const keys = path.split(".");
      let obj = this.header.config;
      for (const key of keys) {
        if (obj && typeof obj === "object" && key in obj) {
          obj = obj[key];
        } else {
          missing.push(path);
          break;
        }
      }
    }
    if (missing.length > 0) {
      _log("warn", `Campos ausentes no config: ${missing.join(", ")}`);
      const defaults = this.getDefaultConfig();
      for (const path of missing) {
        const keys = path.split(".");
        let target = this.header.config, source = defaults;
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          if (!target[key]) target[key] = {};
          target = target[key];
          source = source[key];
        }
        target[keys[keys.length - 1]] = source[keys[keys.length - 1]];
      }
    }
  }
  getDefaultConfig() {
    const cfg = _getPort("config");
    const globalSampleRate = cfg?.telemetry?.sampleRate;
    const debugMode = cfg?.app?.debug;
    const sampleRate = globalSampleRate !== void 0 ? globalSampleRate : debugMode ? 1 : 0.1;
    return { module: "header", version: this.header.version, api: { healthEndpoint: "/api/health/status.php", healthWithCredentials: false, alertsEndpoint: "/api/alerts/header-alerts.php", timeout: 6e3, retries: 3 }, polling: { healthInterval: 15e3, alertsInterval: 3e4, networkQualityInterval: 3e4 }, network: { rttThresholds: { online: 120, degraded: 350 } }, refresh: { throttle: 5e3, fallbackTimeout: 1200 }, ui: { tooltipDelayShow: 250, scrollThreshold: 50 }, accessibility: { announceDebounce: 800, rovingTabindexEnabled: true, keyboardShortcutsEnabled: true }, telemetry: { enabled: true, sampleRate }, fallback: { autoHide: true, autoHideDuration: 8e3, debounce: 300 } };
  }
  cacheElements(container) {
    this._metrics.cacheElementsCount++;
    const root = container || document;
    this.header.elements = { header: root.querySelector(".site-header"), statusLive: root.querySelector(".header-status-live"), envChip: root.querySelector(".header-env-chip"), btnRefresh: root.querySelector("#btn-refresh"), btnFullscreen: root.querySelector("#btn-fullscreen"), container: root };
    this.header.features = { refresh: !!this.header.elements.btnRefresh, fullscreen: !!this.header.elements.btnFullscreen };
  }
  validateStructure() {
    this._metrics.validateCount++;
    const critical = ["header"];
    const criticalMissing = critical.filter((key) => !this.header.elements[key]);
    if (criticalMissing.length > 0) {
      _log("error", `Elementos criticos faltando: ${criticalMissing.join(", ")}`);
      this._metrics.errorCount++;
      throw new Error("Estrutura HTML critica invalida");
    }
    _log("info", "Estrutura HTML validada - Componentes via loader");
    return true;
  }
  healthCheck() {
    const checks = { headerAvailable: !!this.header, fetchClientAvailable: !!this.header?.fetchClient, configLoaded: !!this.header?.config, noExcessiveErrors: this._metrics.errorCount < 5 };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(([, v]) => !v).map(([k]) => k), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(enabled) {
    this._debug = !!enabled;
  }
  resetMetrics() {
    this._metrics = { configLoadCount: 0, cacheElementsCount: 0, validateCount: 0, errorCount: 0, lastInitAt: null };
  }
}
function getVersion() {
  return VERSION;
}
var header_initializer_default = HeaderInitializer;
export {
  HeaderInitializer,
  MODULE_ID,
  VERSION,
  header_initializer_default as default,
  getPorts,
  getVersion,
  injectPorts
};
