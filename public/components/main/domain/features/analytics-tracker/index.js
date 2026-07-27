import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { MAIN_EVENTS } from "/core/runtime/events/catalog/main.events.js";
const MODULE_ID = "main.feature.analytics-tracker";
const VERSION = "1.0.0-ENTERPRISE";
const EVENT_TYPES = Object.freeze({
  PAGE_VIEW: "page_view",
  NAVIGATION: "navigation",
  INTERACTION: "interaction",
  ERROR: "error",
  PERFORMANCE: "performance",
  FEATURE_USAGE: "feature_usage",
  CUSTOM: "custom"
});
const Ports = createCorePorts({ moduleId: MODULE_ID });
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
let _enabled = false;
let _cleanups = [];
let _events = [];
let _sessionId = null;
let _sessionStart = null;
const MAX_EVENTS = 1e3;
const FLUSH_INTERVAL = 3e4;
let _flushIntervalId = null;
let _config = {
  enabled: true,
  sampleRate: 1,
  trackPageViews: true,
  trackNavigation: true,
  trackErrors: true,
  trackPerformance: true,
  endpoint: null
};
const _metrics = {
  inits: 0,
  eventsTracked: 0,
  eventsFlushed: 0,
  flushErrors: 0,
  byType: {}
};
function _generateSessionId() {
  return `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function _shouldSample() {
  return Math.random() < _config.sampleRate;
}
function _createEvent(type, name, data) {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    type,
    name,
    data: data || {},
    sessionId: _sessionId,
    timestamp: Date.now(),
    url: typeof window !== "undefined" ? window.location.href : null,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null
  };
}
function _addEvent(event) {
  _events.push(event);
  _metrics.eventsTracked++;
  const eventType = event.type;
  _metrics.byType[eventType] = (_metrics.byType[eventType] || 0) + 1;
  if (_events.length > MAX_EVENTS) {
    _events.shift();
  }
}
function _flush() {
  if (_events.length === 0) return { ok: true, flushed: 0 };
  const eventsToFlush = _events.slice();
  if (_config.endpoint) {
    try {
      fetch(_config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: eventsToFlush, sessionId: _sessionId })
      }).catch((e) => {
        _metrics.flushErrors++;
      });
    } catch (e) {
      _metrics.flushErrors++;
    }
  }
  _metrics.eventsFlushed += eventsToFlush.length;
  _events = [];
  return { ok: true, flushed: eventsToFlush.length };
}
function init(options) {
  if (_enabled) return { ok: true, alreadyInitialized: true };
  try {
    _initPorts();
    _metrics.inits++;
    if (options && options.config) {
      _config = Object.assign({}, _config, options.config);
    }
    _sessionId = _generateSessionId();
    _sessionStart = Date.now();
    const eb = _getPort("eventBus");
    if (eb && eb.on) {
      if (_config.trackNavigation && MAIN_EVENTS && MAIN_EVENTS.NAVIGATION_COMPLETE) {
        const navHandler = (data) => {
          track(EVENT_TYPES.NAVIGATION, "navigation_complete", {
            path: data && data.path,
            panelId: data && data.panelId,
            duration: data && data.duration
          });
        };
        eb.on(MAIN_EVENTS.NAVIGATION_COMPLETE, navHandler);
        _cleanups.push(() => {
          if (eb.off) eb.off(MAIN_EVENTS.NAVIGATION_COMPLETE, navHandler);
        });
      }
      if (_config.trackErrors && MAIN_EVENTS && MAIN_EVENTS.NAVIGATION_ERROR) {
        const errorHandler = (data) => {
          track(EVENT_TYPES.ERROR, "navigation_error", {
            error: data && data.error,
            path: data && data.path
          });
        };
        eb.on(MAIN_EVENTS.NAVIGATION_ERROR, errorHandler);
        _cleanups.push(() => {
          if (eb.off) eb.off(MAIN_EVENTS.NAVIGATION_ERROR, errorHandler);
        });
      }
    }
    if (_config.trackPageViews) {
      track(EVENT_TYPES.PAGE_VIEW, "session_start", { url: typeof window !== "undefined" ? window.location.href : null });
    }
    _flushIntervalId = setInterval(_flush, FLUSH_INTERVAL);
    if (typeof window !== "undefined") {
      const unloadHandler = () => {
        _flush();
      };
      window.addEventListener("beforeunload", unloadHandler);
      _cleanups.push(() => {
        window.removeEventListener("beforeunload", unloadHandler);
      });
    }
    _enabled = true;
    return { ok: true, version: VERSION, sessionId: _sessionId };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
function destroy() {
  _flush();
  if (_flushIntervalId) {
    clearInterval(_flushIntervalId);
    _flushIntervalId = null;
  }
  for (let i = 0; i < _cleanups.length; i++) {
    try {
      _cleanups[i]();
    } catch (e) {
    }
  }
  _cleanups = [];
  _enabled = false;
  return { ok: true };
}
const cleanup = destroy;
function track(type, name, data) {
  if (!_enabled || !_config.enabled) return { ok: false, error: "Not enabled" };
  if (!_shouldSample()) return { ok: true, sampled: false };
  const event = _createEvent(type, name, data);
  _addEvent(event);
  return { ok: true, eventId: event.id };
}
function trackPageView(url, title) {
  return track(EVENT_TYPES.PAGE_VIEW, "page_view", { url, title });
}
function trackInteraction(element, action, data) {
  return track(EVENT_TYPES.INTERACTION, action, Object.assign({ element }, data || {}));
}
function trackError(error, context) {
  return track(EVENT_TYPES.ERROR, "error", {
    message: error && error.message,
    stack: error && error.stack,
    context
  });
}
function trackPerformance(metric, value, unit) {
  return track(EVENT_TYPES.PERFORMANCE, metric, { value, unit: unit || "ms" });
}
function trackFeatureUsage(featureId, action, data) {
  return track(EVENT_TYPES.FEATURE_USAGE, action, Object.assign({ featureId }, data || {}));
}
function trackCustom(name, data) {
  return track(EVENT_TYPES.CUSTOM, name, data);
}
function getEvents(filter) {
  if (!filter) return _events.slice();
  return _events.filter((e) => {
    if (filter.type && e.type !== filter.type) return false;
    if (filter.name && e.name !== filter.name) return false;
    if (filter.since && e.timestamp < filter.since) return false;
    return true;
  });
}
function getSessionInfo() {
  return {
    sessionId: _sessionId,
    sessionStart: _sessionStart,
    duration: _sessionStart ? Date.now() - _sessionStart : 0,
    eventsCount: _events.length
  };
}
function flush() {
  return _flush();
}
function updateConfig(newConfig) {
  _config = Object.assign({}, _config, newConfig);
  return { ok: true, config: Object.assign({}, _config) };
}
function getMetrics() {
  return Object.assign({}, _metrics, {
    eventsInBuffer: _events.length,
    sessionDuration: _sessionStart ? Date.now() - _sessionStart : 0
  });
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _enabled,
    eventTypes: EVENT_TYPES,
    config: Object.assign({}, _config),
    session: getSessionInfo(),
    metrics: getMetrics()
  };
}
function healthCheck() {
  const checks = {
    enabled: _enabled,
    hasSession: !!_sessionId,
    bufferNotFull: _events.length < MAX_EVENTS
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (!_enabled) status = "NOT_INITIALIZED";
  else if (_events.length >= MAX_EVENTS * 0.9) status = "DEGRADED";
  return {
    status,
    score: { passed, total, percentage: Math.round(passed / total * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    checks,
    metrics: _metrics,
    timestamp: Date.now()
  };
}
var analytics_tracker_default = {
  MODULE_ID,
  VERSION,
  EVENT_TYPES,
  init,
  destroy,
  cleanup,
  track,
  trackPageView,
  trackInteraction,
  trackError,
  trackPerformance,
  trackFeatureUsage,
  trackCustom,
  getEvents,
  getSessionInfo,
  flush,
  updateConfig,
  getMetrics,
  info,
  healthCheck,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  VERSION,
  cleanup,
  analytics_tracker_default as default,
  destroy,
  flush,
  getEvents,
  getMetrics,
  getPorts,
  getSessionInfo,
  healthCheck,
  info,
  init,
  injectPorts,
  track,
  trackCustom,
  trackError,
  trackFeatureUsage,
  trackInteraction,
  trackPageView,
  trackPerformance,
  updateConfig
};
