import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "6.0.0-ES6";
const MODULE_ID = "sidebar-telemetry-adapter";
const PREFIX = "[sidebar]";
const TELEMETRY_EVENTS = {
  ERROR: "telemetry:sidebar:error",
  NAVIGATION: "telemetry:sidebar:navigation",
  TOGGLE: "telemetry:sidebar:toggle",
  SECTION_TOGGLE: "telemetry:sidebar:section:toggle",
  SEARCH: "telemetry:sidebar:search"
};
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
function createTelemetryAdapter() {
  let _metrics = { logs: { debug: 0, info: 0, warn: 0, error: 0 }, tracks: 0, errors: 0, lastLog: null, lastTrack: null };
  const getLogger = () => _getPort("logger");
  const getTelemetry = () => _getPort("telemetryCore") || _getPort("telemetry");
  return {
    log(level, message, data = {}) {
      try {
        const logger = getLogger();
        const formattedMsg = `${PREFIX} ${message}`;
        const payload = Object.assign({ timestamp: Date.now() }, data);
        if (!logger) return;
        switch (level) {
          case "debug":
            if (logger.debug) logger.debug(formattedMsg, payload);
            _metrics.logs.debug++;
            break;
          case "info":
            if (logger.info) logger.info(formattedMsg, payload);
            _metrics.logs.info++;
            break;
          case "warn":
            if (logger.warn) logger.warn(formattedMsg, payload);
            _metrics.logs.warn++;
            break;
          case "error":
            if (logger.error) logger.error(formattedMsg, payload);
            _metrics.logs.error++;
            break;
          default:
            if (logger.info) logger.info(formattedMsg, payload);
        }
        _metrics.lastLog = { level, message, timestamp: Date.now() };
      } catch (e) {
        _metrics.errors++;
      }
    },
    track(event, data = {}) {
      try {
        const telemetry = getTelemetry();
        const payload = Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data);
        if (telemetry && telemetry.track) telemetry.track(event, payload);
        _metrics.tracks++;
        _metrics.lastTrack = { event, timestamp: Date.now() };
      } catch (e) {
        _metrics.errors++;
      }
    },
    error(message, error) {
      this.log("error", message, { error: error ? error.message : error });
      this.track("sidebar:error", { message, error: error ? error.message : null });
    },
    info(message, data) {
      this.log("info", message, data);
    },
    debug(message, data) {
      this.log("debug", message, data);
    },
    warn(message, data) {
      this.log("warn", message, data);
    },
    trackNavigation(itemId, route) {
      this.track("sidebar:navigation", { itemId, route });
    },
    trackToggle(collapsed) {
      this.track("sidebar:toggle", { collapsed });
    },
    trackSectionToggle(sectionId, expanded) {
      this.track("sidebar:section:toggle", { sectionId, expanded });
    },
    trackSearch(query, resultsCount) {
      this.track("sidebar:search", { query, resultsCount });
    },
    trackError(error, context) {
      this.track("sidebar:error", Object.assign({ error: error ? error.message : error }, context || {}));
    },
    getMetrics() {
      return Object.assign({}, _metrics);
    },
    reset() {
      _metrics = { logs: { debug: 0, info: 0, warn: 0, error: 0 }, tracks: 0, errors: 0, lastLog: null, lastTrack: null };
    },
    getInfo() {
      return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), hasLogger: !!getLogger(), hasTelemetry: !!getTelemetry(), metrics: this.getMetrics() };
    },
    healthCheck() {
      const hasLogger = !!getLogger();
      const hasTelemetry = !!_getPort("telemetryCore");
      const hasEventBus = !!_getPort("eventBus");
      const totalLogs = _metrics.logs.debug + _metrics.logs.info + _metrics.logs.warn + _metrics.logs.error;
      const checks = { hasLogger, hasTelemetry, hasEventBus, noErrors: _metrics.errors === 0, logsWorking: totalLogs > 0 || _metrics.errors === 0 };
      const passed = Object.values(checks).filter(Boolean).length;
      const total = Object.keys(checks).length;
      return { status: passed >= 3 ? "HEALTHY" : "DEGRADED", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, metrics: _metrics, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
    }
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function getMetrics() {
  return {};
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), loggerReady: !!_getPort("logger") };
}
var telemetry_adapter_default = { VERSION, MODULE_ID, TELEMETRY_EVENTS, createTelemetryAdapter, info, getMetrics, healthCheck };
export {
  MODULE_ID,
  VERSION,
  createTelemetryAdapter,
  telemetry_adapter_default as default,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
