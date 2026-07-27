import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { ANALYTICS_EVENTS } from "/core/runtime/events/catalog/analytics.events.js";
import { analyticsStore } from "../state/store.js";
import { trackAnalyticsEvent } from "../telemetry/reporter.js";
import { sanitizeEventData, getDeviceInfo, getPageInfo } from "../utils/helpers.js";
const VERSION = "1.5.0-P2-ENTERPRISE";
const MODULE_ID = "components.analytics-manager.core.tracker";
const hasWindow = typeof window !== "undefined";
const hasDocument = typeof document !== "undefined";
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
const _metrics = {
  trackCount: 0,
  pageViewCount: 0,
  clickCount: 0,
  errorCount: 0,
  lastTrackAt: null
};
let _userId = null;
function generateEventId() {
  return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function buildStandardPayload(eventName, data = {}) {
  const session = analyticsStore.getCurrentSession();
  const pageInfo = getPageInfo();
  const deviceInfo = getDeviceInfo();
  return {
    id: generateEventId(),
    eventName,
    category: data.category || "general",
    timestamp: Date.now(),
    sessionId: session ? session.id : null,
    userId: _userId || analyticsStore.get("userId") || null,
    path: pageInfo.path || "",
    referrer: pageInfo.referrer || "",
    deviceInfo: {
      viewportWidth: deviceInfo.viewportWidth || 0,
      viewportHeight: deviceInfo.viewportHeight || 0,
      userAgent: deviceInfo.userAgent || "",
      language: deviceInfo.language || ""
    },
    payload: sanitizeEventData(data)
  };
}
const AnalyticsTracker = {
  setUserId(userId) {
    _userId = userId;
    trackAnalyticsEvent("analytics:tracker:user-set", { userId });
  },
  getUserId() {
    return _userId || analyticsStore.get("userId") || null;
  },
  track(eventName, data = {}) {
    _metrics.trackCount++;
    _metrics.lastTrackAt = Date.now();
    const standardPayload = buildStandardPayload(eventName, data);
    const entry = analyticsStore.addEvent({
      name: eventName,
      category: data.category || "general",
      action: data.action || null,
      label: data.label || null,
      value: data.value || null,
      metadata: standardPayload
    });
    const session = analyticsStore.getCurrentSession();
    if (session) session.events++;
    trackAnalyticsEvent("analytics:event:tracked", {
      eventName,
      category: entry.category,
      eventId: standardPayload.id
    });
    this._emitEvent(entry);
    return entry;
  },
  trackPageView(pagePath, pageTitle) {
    _metrics.pageViewCount++;
    const title = pageTitle || (hasDocument ? document.title : "");
    return this.track("page_view", {
      category: "navigation",
      action: "view",
      label: pagePath,
      metadata: { title, path: pagePath }
    });
  },
  trackClick(elementId, elementType = "button") {
    _metrics.clickCount++;
    return this.track("click", {
      category: "interaction",
      action: "click",
      label: elementId,
      metadata: { type: elementType, elementId }
    });
  },
  trackFormSubmit(formName, success = true) {
    return this.track("form_submit", {
      category: "form",
      action: success ? "submit_success" : "submit_error",
      label: formName,
      metadata: { formName, success }
    });
  },
  trackError(errorType, errorMessage) {
    _metrics.errorCount++;
    return this.track("error", {
      category: "error",
      action: errorType,
      label: errorMessage,
      metadata: { errorType, errorMessage }
    });
  },
  trackSearch(query, resultsCount = 0) {
    return this.track("search", {
      category: "search",
      action: "query",
      label: query,
      value: resultsCount,
      metadata: { query, resultsCount }
    });
  },
  trackConversion(conversionType, value) {
    return this.track("conversion", {
      category: "conversion",
      action: conversionType,
      value,
      metadata: { conversionType, value }
    });
  },
  trackTiming(name, durationMs, category = "performance") {
    return this.track("timing", {
      category,
      action: name,
      value: durationMs,
      metadata: { name, durationMs, unit: "ms" }
    });
  },
  getRecentEvents(count = 10) {
    const events = analyticsStore.getEvents();
    return events.slice(-count);
  },
  getEventsByCategory(category) {
    const events = analyticsStore.getEvents();
    return events.filter((e) => e.category === category);
  },
  getEventsByName(eventName) {
    const events = analyticsStore.getEvents();
    return events.filter((e) => e.name === eventName);
  },
  _emitEvent(entry) {
    const eventBus = _getPort("eventBus");
    if (hasWindow && eventBus && eventBus.emit) {
      try {
        eventBus.emit(ANALYTICS_EVENTS.EVENT, entry);
      } catch (err) {
      }
    }
  },
  injectPorts,
  getPorts,
  getVersion() {
    return VERSION;
  },
  getMetrics() {
    return { ..._metrics };
  },
  resetMetrics() {
    _metrics.trackCount = 0;
    _metrics.pageViewCount = 0;
    _metrics.clickCount = 0;
    _metrics.errorCount = 0;
    _metrics.lastTrackAt = null;
  },
  healthCheck() {
    const storeAvailable = !!analyticsStore;
    const hasSession = !!analyticsStore.getCurrentSession();
    const lowErrorRate = _metrics.trackCount === 0 || _metrics.errorCount / _metrics.trackCount < 0.1;
    const eventBus = _getPort("eventBus");
    const portsSnapshot = Ports.snapshot();
    const checks = {
      storeAvailable,
      hasSession,
      lowErrorRate,
      eventBusAvailable: !!(hasWindow && eventBus),
      trackFunctionAvailable: typeof this.track === "function",
      portsInitialized: portsSnapshot._initialized
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return {
      status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY",
      score: passed,
      maxScore: total,
      scoreDisplay: `${passed}/${total}`,
      checks,
      metrics: { ..._metrics },
      version: VERSION,
      moduleId: MODULE_ID,
      portsInitialized: portsSnapshot._initialized,
      timestamp: Date.now()
    };
  },
  info() {
    const portsSnapshot = Ports.snapshot();
    const session = analyticsStore.getCurrentSession();
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      userId: this.getUserId(),
      sessionId: session ? session.id : null,
      totalEvents: analyticsStore.getEvents().length,
      metrics: this.getMetrics(),
      portsInitialized: portsSnapshot._initialized,
      timestamp: Date.now()
    };
  }
};
var tracker_default = AnalyticsTracker;
export {
  AnalyticsTracker,
  MODULE_ID,
  VERSION,
  tracker_default as default,
  getPorts,
  injectPorts
};
