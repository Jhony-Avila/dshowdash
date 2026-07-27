import { createTelemetryPorts } from "/core/runtime/ports-profiles.js";
import { LIFECYCLE_EVENTS } from "/core/runtime/events/catalog/lifecycle.events.js";
import { TELEMETRY_EVENTS } from "/core/runtime/events/catalog/telemetry.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-16:port:telemetry";
const PANEL_ID = "panel-16";
const Ports = createTelemetryPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
let _telemetry = null;
let _context = { panelId: PANEL_ID, version: null, correlationId: null, runId: null, sessionId: null };
function generateId(prefix) {
  prefix = prefix || "id";
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}
const TelemetryPort = {
  inject(telemetry) {
    _telemetry = telemetry;
  },
  injectPorts(p) {
    return Ports.inject(p);
  },
  getPorts() {
    return Ports.snapshot();
  },
  setContext(ctx) {
    _context = Object.assign({}, _context, ctx);
  },
  _get() {
    if (_telemetry) return _telemetry;
    _initPorts();
    return _getPort("telemetryCore") || _getPort("telemetryTracker");
  },
  initSession(version) {
    _context.version = version;
    _context.correlationId = generateId("corr");
    _context.runId = generateId("run");
    _context.sessionId = generateId("sess");
    this.track(LIFECYCLE_EVENTS.INITIALIZED, { version, correlationId: _context.correlationId });
    return Object.assign({}, _context);
  },
  // P27: Use TELEMETRY_EVENTS.EVENT token with name in payload (not concatenated event names)
  track(event, data, options) {
    data = data || {};
    options = options || {};
    _initPorts();
    const telemetry = this._get();
    const enrichedData = Object.assign({}, data, {
      panelId: _context.panelId,
      version: _context.version,
      correlationId: _context.correlationId,
      runId: _context.runId,
      sessionId: _context.sessionId,
      timestamp: Date.now()
    });
    if (telemetry && telemetry.track) return telemetry.track(`${PANEL_ID}:${event}`, enrichedData, options);
    if (telemetry && telemetry.event) return telemetry.event(`${PANEL_ID}:${event}`, enrichedData, options);
    const eb = _getPort("eventBus");
    if (eb && eb.emit) {
      eb.emit(TELEMETRY_EVENTS.EVENT, {
        name: `${PANEL_ID}:${event}`,
        source: MODULE_ID,
        data: enrichedData
      });
    }
    return enrichedData;
  },
  info(message, data) {
    const t = this._get();
    if (t && t.info) return t.info(PANEL_ID, message, Object.assign({}, data || {}, _context));
    return this.track("info", Object.assign({ message }, data || {}));
  },
  warn(message, data) {
    const t = this._get();
    if (t && t.warn) return t.warn(PANEL_ID, message, Object.assign({}, data || {}, _context));
    return this.track("warn", Object.assign({ message }, data || {}));
  },
  error(message, error, data) {
    data = data || {};
    const err = error;
    const errorData = Object.assign({ message, error: err && err.message ? err.message : error, stack: err && err.stack ? err.stack : null }, data, _context);
    const t = this._get();
    if (t && t.trackError) return t.trackError(PANEL_ID, error || message, data);
    if (t && t.error) return t.error(`${PANEL_ID}:error`, errorData);
    return this.track(LIFECYCLE_EVENTS.ERROR, errorData);
  },
  metric(name, value, data) {
    const t = this._get();
    const metricData = Object.assign({ name, value }, data || {}, _context);
    if (t && t.metric) return t.metric(`${PANEL_ID}:${name}`, metricData);
    return this.track(`metric:${name}`, metricData);
  },
  timing(operation, durationMs, success) {
    success = success !== false;
    const t = this._get();
    if (t && t.trackTiming) return t.trackTiming(`${PANEL_ID}:${operation}`, durationMs, success);
    return this.metric(operation, durationMs, { success, unit: "ms" });
  },
  // P22: Renamed to trackMountPerformance to avoid dual-emit with EventBus MOUNTED
  trackMountPerformance(mountTime) {
    return this.track("mount:performance", { mountTime, unit: "ms" });
  },
  // P22: Renamed to trackUnmountComplete to avoid dual-emit with EventBus UNMOUNTED
  trackUnmountComplete() {
    return this.track("unmount:complete", {});
  },
  // Deprecated aliases for backward compatibility - will log warning
  trackMount(mountTime) {
    this.warn("trackMount is deprecated, use trackMountPerformance");
    return this.trackMountPerformance(mountTime);
  },
  trackUnmount() {
    this.warn("trackUnmount is deprecated, use trackUnmountComplete");
    return this.trackUnmountComplete();
  },
  trackStateChange(from, to) {
    return this.track("state:change", { from, to });
  },
  trackDataLoad(loadCount, duration) {
    return this.track(LIFECYCLE_EVENTS.DATA_LOADED, { loadCount, duration, unit: "ms" });
  },
  trackError(context, error) {
    return this.error(`${context} failed`, error, { context });
  },
  getContext() {
    return Object.assign({}, _context);
  },
  isConnected() {
    return !!this._get();
  },
  isAvailable() {
    return this.isConnected();
  },
  reset() {
    _telemetry = null;
    _context = { panelId: PANEL_ID, version: null, correlationId: null, runId: null, sessionId: null };
  },
  getInfo() {
    const ps = Ports.snapshot();
    const t = this._get();
    return { moduleId: MODULE_ID, version: VERSION, injected: !!_telemetry, connected: this.isConnected(), context: this.getContext(), portsInitialized: ps._initialized, globalTelemetryVersion: t && (t.version || (t.getVersion ? t.getVersion() : "unknown")) || "unknown", p22Compliant: true, p27Governed: true };
  }
};
var telemetry_port_default = TelemetryPort;
export {
  MODULE_ID,
  TelemetryPort,
  VERSION,
  telemetry_port_default as default
};
