import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.5.0-P2-ENTERPRISE";
const MODULE_ID = "components.analytics-manager.state.store";
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
const _debug = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = "[AnalyticsStore]";
  if (level === "error") {
    logger.error?.(prefix, ...args);
    return;
  }
  if (level === "warn") {
    logger.warn?.(prefix, ...args);
    return;
  }
  if (_debug()) {
    logger.debug?.(prefix, ...args);
  }
};
const analyticsData = {
  events: [],
  metrics: {},
  sessions: [],
  currentSession: null,
  maxEvents: 1e3,
  lastFlush: null
};
const storeListeners = /* @__PURE__ */ new Set();
const analyticsStore = {
  get(key) {
    if (key) return analyticsData[key];
    return { ...analyticsData };
  },
  set(key, value) {
    const oldValue = analyticsData[key];
    analyticsData[key] = value;
    this._notify("set", key, value, oldValue);
    return true;
  },
  addEvent(event) {
    const entry = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      name: event.name,
      category: event.category || "general",
      action: event.action || null,
      label: event.label || null,
      value: event.value || null,
      metadata: event.metadata || {}
    };
    analyticsData.events.push(entry);
    if (analyticsData.events.length > analyticsData.maxEvents) {
      analyticsData.events.shift();
    }
    this._notify("event-added", "events", entry, null);
    return entry;
  },
  getEvents() {
    return analyticsData.events.slice();
  },
  clearEvents() {
    analyticsData.events = [];
    this._notify("events-cleared", null, null, null);
    return true;
  },
  setMetric(key, value) {
    const old = analyticsData.metrics[key];
    analyticsData.metrics[key] = value;
    this._notify("metric-set", key, value, old);
    return true;
  },
  incrementMetric(key, amount = 1) {
    if (!analyticsData.metrics[key]) {
      analyticsData.metrics[key] = 0;
    }
    analyticsData.metrics[key] += amount;
    this._notify("metric-incremented", key, analyticsData.metrics[key], null);
    return analyticsData.metrics[key];
  },
  getMetric(key) {
    return analyticsData.metrics[key] || 0;
  },
  getAllMetrics() {
    return { ...analyticsData.metrics };
  },
  startSession() {
    const session = {
      id: `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      endTime: null,
      events: 0,
      pageViews: 0
    };
    analyticsData.currentSession = session;
    analyticsData.sessions.push(session);
    this._notify("session-started", "currentSession", session, null);
    return session;
  },
  endSession() {
    if (analyticsData.currentSession) {
      analyticsData.currentSession.endTime = Date.now();
      this._notify("session-ended", "currentSession", analyticsData.currentSession, null);
    }
    return analyticsData.currentSession;
  },
  getCurrentSession() {
    return analyticsData.currentSession;
  },
  subscribe(listener) {
    if (typeof listener !== "function") return () => {
    };
    storeListeners.add(listener);
    return () => {
      storeListeners.delete(listener);
    };
  },
  _notify(action, key, newValue, oldValue) {
    for (const listener of storeListeners) {
      try {
        listener({ action, key, newValue, oldValue, state: this.get() });
      } catch (err) {
        _log("error", "Listener error:", err);
      }
    }
  },
  toJSON() {
    return { ...analyticsData };
  }
};
function info() {
  const ps = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: ps._initialized,
    hasLogger: !!_getPort("logger"),
    eventCount: analyticsData.events.length,
    metricsCount: Object.keys(analyticsData.metrics).length,
    sessionCount: analyticsData.sessions.length,
    currentSessionActive: !!analyticsData.currentSession,
    timestamp: Date.now()
  };
}
function healthCheck() {
  const ps = Ports.snapshot();
  const checks = {
    ready: true,
    hasStore: !!analyticsData,
    eventsBufferHealthy: analyticsData.events.length < analyticsData.maxEvents,
    portsInitialized: ps._initialized,
    hasLogger: !!_getPort("logger")
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: ps._initialized,
    timestamp: Date.now()
  };
}
var store_default = analyticsStore;
export {
  MODULE_ID,
  VERSION,
  analyticsStore,
  store_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
