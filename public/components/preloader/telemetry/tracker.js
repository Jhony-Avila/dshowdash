import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { Telemetry, buildTimestamp } from "../../../assets/js/core/telemetry-core/index.js";
const VERSION = "2.2.1-P17WI";
const MODULE_ID = "preloader.telemetry.tracker";
const NAMESPACE = "preloader";
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
const _metrics = { trackCount: 0, bootTrackCount: 0, errorTrackCount: 0, lastTrackAt: null, lastTrackLocalTime: null };
function _buildTimestamp() {
  if (typeof buildTimestamp === "function") return buildTimestamp();
  const tel = _getPort("telemetry");
  if (tel && tel.buildTimestamp) return tel.buildTimestamp();
  const now = Date.now();
  return { timestampUtc: now, isoUtc: new Date(now).toISOString(), localTime: new Date(now).toLocaleString("pt-BR"), timeZone: "America/Sao_Paulo", locale: "pt-BR" };
}
const PreloaderTelemetry = {
  initialized: false,
  init() {
    if (this.initialized) return this;
    _initPorts();
    try {
      if (!Telemetry.isReady()) {
        Telemetry.init({ endpoint: "/api/telemetry/", debug: false, flushIntervalMs: 3e4, maxBufferSize: 500, batchSize: 20 });
      }
      this.initialized = true;
    } catch (err) {
      this.initialized = false;
    }
    return this;
  },
  track(event, data) {
    if (!data) data = {};
    if (!this.initialized) this.init();
    const ts = _buildTimestamp();
    _metrics.trackCount++;
    _metrics.lastTrackAt = ts.timestampUtc;
    _metrics.lastTrackLocalTime = ts.localTime;
    try {
      Telemetry.event(`${NAMESPACE}:${event}`, Object.assign({}, data, { timestampUtc: ts.timestampUtc, localTime: ts.localTime }), { component: NAMESPACE });
    } catch (e) {
    }
  },
  trackBoot(bootId, duration) {
    if (!this.initialized) this.init();
    const ts = _buildTimestamp();
    _metrics.bootTrackCount++;
    _metrics.lastTrackAt = ts.timestampUtc;
    _metrics.lastTrackLocalTime = ts.localTime;
    try {
      Telemetry.metric(`${NAMESPACE}:boot`, { bootId, duration, unit: "ms", timestampUtc: ts.timestampUtc, localTime: ts.localTime }, { component: NAMESPACE });
    } catch (e) {
    }
  },
  trackError(context, error) {
    if (!this.initialized) this.init();
    const ts = _buildTimestamp();
    _metrics.errorTrackCount++;
    _metrics.lastTrackAt = ts.timestampUtc;
    _metrics.lastTrackLocalTime = ts.localTime;
    try {
      Telemetry.error(`${NAMESPACE}:${context}:error`, { message: error && error.message ? error.message : String(error), timestampUtc: ts.timestampUtc, localTime: ts.localTime }, { component: NAMESPACE });
    } catch (e) {
    }
  },
  healthCheck() {
    const ts = _buildTimestamp();
    const telemetryAvailable = typeof Telemetry !== "undefined";
    const initialized = this.initialized;
    const buildTimestampAvailable = typeof buildTimestamp === "function" || !!(_getPort("telemetry") && _getPort("telemetry").buildTimestamp);
    const checks = { telemetryAvailable, initialized, buildTimestampAvailable, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed >= total - 1 ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, metrics: Object.assign({}, _metrics), version: VERSION, moduleId: MODULE_ID, timestampUtc: ts.timestampUtc, localTime: ts.localTime, timeZone: ts.timeZone };
  },
  info() {
    const ts = _buildTimestamp();
    return { version: VERSION, moduleId: MODULE_ID, namespace: NAMESPACE, initialized: this.initialized, healthCheck: this.healthCheck(), metrics: Object.assign({}, _metrics), portsInitialized: Ports.isInitialized(), timestampUtc: ts.timestampUtc, localTime: ts.localTime, timeZone: ts.timeZone };
  },
  getVersion() {
    return VERSION;
  }
};
function getVersion() {
  return VERSION;
}
var tracker_default = PreloaderTelemetry;
export {
  MODULE_ID,
  PreloaderTelemetry,
  VERSION,
  tracker_default as default,
  getPorts,
  getVersion,
  injectPorts
};
