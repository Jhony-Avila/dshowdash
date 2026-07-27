import { analyticsStore } from "../state/store.js";
import { trackAnalyticsEvent } from "../telemetry/reporter.js";
const VERSION = "1.2.0-P2-ENTERPRISE";
const MODULE_ID = "components.analytics-manager.core.metrics";
const _metrics = {
  trackCount: 0,
  incrementCount: 0,
  resetCount: 0,
  pageViewCount: 0,
  userActionCount: 0,
  lastTrackAt: null
};
const MetricsManager = {
  track(name, value = 1) {
    _metrics.trackCount++;
    _metrics.lastTrackAt = Date.now();
    analyticsStore.setMetric(name, value);
    trackAnalyticsEvent("analytics:metric:tracked", { name, value });
    return true;
  },
  increment(name, amount = 1) {
    _metrics.incrementCount++;
    _metrics.lastTrackAt = Date.now();
    const newValue = analyticsStore.incrementMetric(name, amount);
    trackAnalyticsEvent("analytics:metric:incremented", { name, amount, newValue });
    return newValue;
  },
  decrement(name, amount = 1) {
    return this.increment(name, -amount);
  },
  get(name) {
    return analyticsStore.getMetric(name);
  },
  getAll() {
    return analyticsStore.getAllMetrics();
  },
  reset(name) {
    _metrics.resetCount++;
    analyticsStore.setMetric(name, 0);
    trackAnalyticsEvent("analytics:metric:reset", { name });
  },
  resetAll() {
    _metrics.resetCount++;
    const metrics = analyticsStore.getAllMetrics();
    for (const key of Object.keys(metrics)) {
      analyticsStore.setMetric(key, 0);
    }
    trackAnalyticsEvent("analytics:metrics:all-reset");
  },
  trackTiming(name, durationMs) {
    this.track(`timing:${name}`, durationMs);
    trackAnalyticsEvent("analytics:timing:tracked", { name, durationMs });
  },
  trackPageView(path) {
    _metrics.pageViewCount++;
    this.increment("pageViews");
    const session = analyticsStore.getCurrentSession();
    if (session) session.pageViews++;
    trackAnalyticsEvent("analytics:pageview", { path });
  },
  trackUserAction(action, label = null, value = null) {
    _metrics.userActionCount++;
    this.increment(`action:${action}`);
    trackAnalyticsEvent("analytics:user-action", { action, label, value });
  },
  getSummary() {
    const metrics = this.getAll();
    const session = analyticsStore.getCurrentSession();
    return {
      metrics,
      metricsCount: Object.keys(metrics).length,
      sessionId: session ? session.id : null,
      sessionDuration: session ? Date.now() - session.startTime : 0,
      totalEvents: analyticsStore.getEvents().length,
      pageViews: metrics.pageViews || 0
    };
  },
  getVersion() {
    return VERSION;
  },
  getInternalMetrics() {
    return { ..._metrics };
  },
  resetInternalMetrics() {
    _metrics.trackCount = 0;
    _metrics.incrementCount = 0;
    _metrics.resetCount = 0;
    _metrics.pageViewCount = 0;
    _metrics.userActionCount = 0;
    _metrics.lastTrackAt = null;
  },
  healthCheck() {
    const storeAvailable = !!analyticsStore;
    const hasMetrics = Object.keys(analyticsStore.getAllMetrics()).length >= 0;
    const trackAvailable = typeof this.track === "function";
    const incrementAvailable = typeof this.increment === "function";
    const checks = {
      storeAvailable,
      hasMetrics,
      trackAvailable,
      incrementAvailable,
      getSummaryAvailable: typeof this.getSummary === "function"
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return {
      status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY",
      score: passed,
      maxScore: total,
      scoreDisplay: `${passed}/${total}`,
      checks,
      metricsCount: Object.keys(analyticsStore.getAllMetrics()).length,
      internalMetrics: { ..._metrics },
      version: VERSION,
      moduleId: MODULE_ID,
      timestamp: Date.now()
    };
  },
  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      summary: this.getSummary(),
      internalMetrics: this.getInternalMetrics(),
      timestamp: Date.now()
    };
  }
};
var metrics_default = MetricsManager;
export {
  MODULE_ID,
  MetricsManager,
  VERSION,
  metrics_default as default
};
