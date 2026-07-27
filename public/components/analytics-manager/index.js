import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import { ROUTER_EVENTS } from "/core/runtime/events/catalog/router.events.js";
import { analyticsStore } from "./state/store.js";
import { AnalyticsTracker } from "./core/tracker.js";
import { MetricsManager } from "./core/metrics.js";
import { AnalyticsLifecycle } from "./core/lifecycle.js";
import { trackAnalyticsEvent, getEventLog, getRecentEvents } from "./telemetry/reporter.js";
import { formatDuration, calculateSessionDuration, healthCheck as helpersHealthCheck } from "./utils/helpers.js";
const VERSION = "2.1.0-P2-ENTERPRISE";
const MODULE_ID = "components.analytics-manager";
const hasWindow = typeof window !== "undefined";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
let orchestratorCleanups = [];
let globalStateCleanups = [];
let privacyMode = false;
const setupGlobalStateIntegration = () => {
  const globalState = _getPort("globalState");
  if (!hasWindow || !globalState) return;
  if (globalStateCleanups.length > 0) cleanupGlobalStateIntegration();
  try {
    const unsubscribeSession = globalState.subscribe((session) => {
      if (!session || typeof session !== "object") return;
      if (session.isAuthenticated && session.userId) {
        AnalyticsTracker.setUserId?.(session.userId);
        trackAnalyticsEvent("analytics:global-state:user-set", { userId: session.userId });
      }
    }, "session");
    const unsubscribeRoute = globalState.subscribe((nav) => {
      if (nav?.currentRoute) {
        AnalyticsTracker.trackPageView(nav.currentRoute, nav.activePanel);
      }
    }, "navigation");
    const unsubscribeFlags = globalState.subscribe((flags) => {
      if (flags && (flags.analyticsEnabled === false || flags.telemetryEnabled === false)) {
        privacyMode = true;
        trackAnalyticsEvent("analytics:privacy-mode:enabled");
      } else if (privacyMode && flags?.analyticsEnabled !== false) {
        privacyMode = false;
        trackAnalyticsEvent("analytics:privacy-mode:disabled");
      }
    }, "flags");
    globalStateCleanups.push(unsubscribeSession, unsubscribeRoute, unsubscribeFlags);
    trackAnalyticsEvent("analytics:global-state:connected");
  } catch (error) {
    trackAnalyticsEvent("analytics:global-state:error", { error: error.message });
  }
};
const cleanupGlobalStateIntegration = () => {
  for (const cleanup of globalStateCleanups) {
    try {
      if (typeof cleanup === "function") cleanup();
    } catch (e) {
    }
  }
  globalStateCleanups = [];
};
const setupOrchestratorIntegration = () => {
  const eventBus = _getPort("eventBus");
  if (!hasWindow || !eventBus) return;
  if (orchestratorCleanups.length > 0) cleanupOrchestratorIntegration();
  try {
    const handlers = {
      "orchestrator:preset:applied": (data) => AnalyticsTracker.track("orchestrator:preset", { preset: data?.presetId }),
      [ROUTER_EVENTS.ROUTE_CHANGED]: (data) => {
        if (data?.route) {
          const route = data.route;
          AnalyticsTracker.trackPageView(route.path, route.title);
        }
      },
      "main:orchestrator:initialized": () => MetricsManager.track("orchestrator.initialized", 1)
    };
    for (const [event, handler] of Object.entries(handlers)) {
      eventBus.on(event, handler);
      orchestratorCleanups.push(() => {
        const eb = _getPort("eventBus");
        eb?.off?.(event, handler);
      });
    }
    trackAnalyticsEvent("analytics:orchestrator:connected");
  } catch (error) {
    trackAnalyticsEvent("analytics:orchestrator:error", { error: error.message });
  }
};
const cleanupOrchestratorIntegration = () => {
  for (const cleanup of orchestratorCleanups) {
    try {
      if (typeof cleanup === "function") cleanup();
    } catch (e) {
    }
  }
  orchestratorCleanups = [];
};
const AnalyticsManager = {
  version: VERSION,
  name: MODULE_ID,
  init: (options = {}) => {
    trackAnalyticsEvent("analytics:api:init:called");
    _initPorts();
    return AnalyticsLifecycle.init(options).then((result) => {
      if (result) {
        setupGlobalStateIntegration();
        setupOrchestratorIntegration();
      }
      return result;
    });
  },
  shutdown: () => {
    trackAnalyticsEvent("analytics:api:shutdown:called");
    cleanupGlobalStateIntegration();
    cleanupOrchestratorIntegration();
    return AnalyticsLifecycle.shutdown();
  },
  reset: () => {
    trackAnalyticsEvent("analytics:api:reset:called");
    return AnalyticsLifecycle.reset();
  },
  injectPorts,
  getPorts,
  track: (eventName, data = {}) => {
    if (privacyMode) return null;
    return AnalyticsTracker.track(eventName, data);
  },
  trackPageView: (path, title) => {
    if (privacyMode) return null;
    return AnalyticsTracker.trackPageView(path, title);
  },
  trackClick: (elementId, elementType) => {
    if (privacyMode) return null;
    return AnalyticsTracker.trackClick(elementId, elementType);
  },
  trackFormSubmit: (formName, success) => {
    if (privacyMode) return null;
    return AnalyticsTracker.trackFormSubmit(formName, success);
  },
  trackError: (errorType, errorMessage) => {
    if (privacyMode) return null;
    return AnalyticsTracker.trackError(errorType, errorMessage);
  },
  trackSearch: (query, resultsCount) => {
    if (privacyMode) return null;
    return AnalyticsTracker.trackSearch(query, resultsCount);
  },
  trackConversion: (conversionType, value) => {
    if (privacyMode) return null;
    return AnalyticsTracker.trackConversion(conversionType, value);
  },
  setMetric: (name, value) => MetricsManager.track(name, value),
  incrementMetric: (name, amount) => MetricsManager.increment(name, amount),
  getMetric: (name) => MetricsManager.get(name),
  getAllMetrics: () => MetricsManager.getAll(),
  getEvents: () => analyticsStore.getEvents(),
  getRecentEvents: (count) => AnalyticsTracker.getRecentEvents(count),
  getSession: () => analyticsStore.getCurrentSession(),
  getSessionDuration: () => {
    const session = AnalyticsManager.getSession();
    if (!session) return 0;
    return calculateSessionDuration(session);
  },
  getFormattedSessionDuration: () => formatDuration(AnalyticsManager.getSessionDuration()),
  getSummary: () => MetricsManager.getSummary(),
  subscribe: (listener) => analyticsStore.subscribe(listener),
  status: () => AnalyticsLifecycle.getStatus(),
  isInitialized: () => AnalyticsLifecycle.isInitialized(),
  getVersion: () => VERSION,
  isPrivacyMode: () => privacyMode,
  setPrivacyMode: (enabled) => {
    privacyMode = enabled;
    trackAnalyticsEvent("analytics:privacy-mode:set", { enabled });
  },
  info: () => {
    const lifecycleInfo = AnalyticsLifecycle.info?.() || {};
    const helpersInfo = helpersHealthCheck?.() || {};
    const eventBus = _getPort("eventBus");
    const globalState = _getPort("globalState");
    const telemetry = _getPort("telemetry");
    const portsSnapshot = Ports.snapshot();
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      status: AnalyticsLifecycle.getStatus(),
      privacyMode,
      orchestratorConnected: orchestratorCleanups.length > 0,
      globalStateConnected: globalStateCleanups.length > 0,
      integrations: {
        eventBusAvailable: !!eventBus,
        globalStateAvailable: !!globalState,
        telemetryAvailable: !!telemetry
      },
      submodules: {
        lifecycle: lifecycleInfo,
        helpers: helpersInfo
      },
      portsInitialized: portsSnapshot._initialized,
      timestamp: Date.now()
    };
  },
  healthCheck: () => {
    const events = analyticsStore.getEvents();
    const metrics = analyticsStore.getAllMetrics();
    const session = analyticsStore.getCurrentSession();
    const maxEvents = analyticsStore.get("maxEvents") || 1e3;
    const eventBus = _getPort("eventBus");
    const globalState = _getPort("globalState");
    const telemetry = _getPort("telemetry");
    const portsSnapshot = Ports.snapshot();
    const checks = {
      initialized: AnalyticsLifecycle.isInitialized(),
      storeAvailable: !!analyticsStore,
      trackerAvailable: !!AnalyticsTracker,
      metricsAvailable: !!MetricsManager,
      lifecycleAvailable: !!AnalyticsLifecycle,
      globalStateConnected: globalStateCleanups.length > 0,
      orchestratorConnected: orchestratorCleanups.length > 0,
      telemetryAvailable: !!telemetry,
      eventBusAvailable: !!eventBus,
      currentSessionActive: !!session,
      eventBufferWithinLimit: events.length < maxEvents,
      privacyModeRespected: true,
      portsInitialized: portsSnapshot._initialized
    };
    const issues = [];
    let score = 0;
    for (const [key, value] of Object.entries(checks)) {
      if (value) score++;
      else issues.push(key);
    }
    const maxScore = Object.keys(checks).length;
    const lastEventAt = events.length > 0 ? events[events.length - 1]?.timestamp : null;
    return {
      status: score === maxScore ? "HEALTHY" : score >= maxScore - 3 ? "DEGRADED" : "UNHEALTHY",
      score,
      maxScore,
      scoreDisplay: `${score}/${maxScore}`,
      checks,
      issues: issues.length > 0 ? issues : null,
      metricsSnapshot: {
        totalEvents: events.length,
        maxEvents,
        sessionsCount: (analyticsStore.get("sessions") || []).length,
        metricsCount: Object.keys(metrics).length,
        lastEventAt
      },
      privacyMode,
      version: VERSION,
      moduleId: MODULE_ID,
      portsInitialized: portsSnapshot._initialized,
      timestamp: Date.now()
    };
  },
  debug: {
    getEventLog,
    getRecentEvents,
    getStore: () => analyticsStore.toJSON?.() || analyticsStore.get(),
    getPrivacyMode: () => privacyMode,
    getIntegrations: () => ({
      orchestratorCleanups: orchestratorCleanups.length,
      globalStateCleanups: globalStateCleanups.length
    })
  }
};
if (hasWindow) {
  const strictMode = isStrict();
  if (!strictMode) {
    window.AnalyticsManager = AnalyticsManager;
    trackAnalyticsEvent("analytics:global:exposed");
  } else {
    recordViolation("MODULE_STRICT_BLOCK", { module: MODULE_ID });
  }
  window.__dev = window.__dev || {};
  window.__dev.analyticsManager = {
    getVersion: () => VERSION,
    info: () => AnalyticsManager.info(),
    healthCheck: () => AnalyticsManager.healthCheck(),
    debug: AnalyticsManager.debug
  };
}
var analytics_manager_default = AnalyticsManager;
export {
  AnalyticsLifecycle,
  AnalyticsManager,
  AnalyticsTracker,
  MODULE_ID,
  MetricsManager,
  VERSION,
  analyticsStore,
  analytics_manager_default as default,
  getPorts,
  injectPorts
};
