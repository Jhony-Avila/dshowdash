// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.analytics-manager
// PURPOSE: Main analytics manager with GlobalState and Orchestrator integration
// ───────────────────────────────────────────────────────────────
// @contract INIT - init(options) initializes analytics manager
// @contract SHUTDOWN - shutdown() shuts down analytics manager
// @contract RESET - reset() resets analytics manager
// @contract TRACK - track(eventName, data) tracks analytics event
// @contract TRACK_PAGE_VIEW - trackPageView(path, title) tracks page view
// @contract TRACK_CLICK - trackClick(elementId, elementType) tracks click
// @contract TRACK_FORM_SUBMIT - trackFormSubmit(formName, success) tracks form
// @contract TRACK_ERROR - trackError(errorType, errorMessage) tracks error
// @contract TRACK_SEARCH - trackSearch(query, resultsCount) tracks search
// @contract TRACK_CONVERSION - trackConversion(conversionType, value) tracks conversion
// @contract SET_METRIC - setMetric(name, value) sets metric
// @contract INCREMENT_METRIC - incrementMetric(name, amount) increments metric
// @contract GET_METRIC - getMetric(name) gets metric value
// @contract GET_ALL_METRICS - getAllMetrics() returns all metrics
// @contract GET_EVENTS - getEvents() returns all events
// @contract GET_SESSION - getSession() returns current session
// @contract SUBSCRIBE - subscribe(listener) subscribes to changes
// @contract IS_PRIVACY_MODE - isPrivacyMode() returns privacy mode status
// @contract SET_PRIVACY_MODE - setPrivacyMode(enabled) sets privacy mode
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: ROUTER_EVENTS from /core/runtime/events/index.js
// IMPORTS: analyticsStore, AnalyticsTracker, MetricsManager, AnalyticsLifecycle
// IMPORTS: trackAnalyticsEvent, getEventLog, getRecentEvents, formatDuration,
//          calculateSessionDuration, healthCheck as helpersHealthCheck
// PROVIDES: AnalyticsManager, analyticsStore, AnalyticsTracker, MetricsManager,
//           AnalyticsLifecycle, injectPorts, getPorts, VERSION, MODULE_ID
// @changelog v2.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.0.0-STRICT-MODE: Strict mode integration
// @changelog v1.9.0-ENTERPRISE: ES6 modernization
// @changelog P17WI: Ports via PortsFactory/PortsProfiles
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';
import { analyticsStore } from './state/store.js';
import { AnalyticsTracker } from './core/tracker.js';
import { MetricsManager } from './core/metrics.js';
import { AnalyticsLifecycle } from './core/lifecycle.js';
import { trackAnalyticsEvent, getEventLog, getRecentEvents } from './telemetry/reporter.js';
import { formatDuration, calculateSessionDuration, healthCheck as helpersHealthCheck } from './utils/helpers.js';

export const VERSION = '2.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.analytics-manager';

const hasWindow = typeof window !== 'undefined';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);

export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

let orchestratorCleanups: (() => void)[] = [];
let globalStateCleanups: (() => void)[] = [];
let privacyMode = false;

const setupGlobalStateIntegration = () => {
  const globalState = _getPort('globalState');
  if (!hasWindow || !globalState) return;
  if (globalStateCleanups.length > 0) cleanupGlobalStateIntegration();

  try {
    const unsubscribeSession = globalState.subscribe((session: Record<string, unknown>) => {
      if (!session || typeof session !== 'object') return;
      if (session.isAuthenticated && session.userId) {
        AnalyticsTracker.setUserId?.(session.userId as string);
        trackAnalyticsEvent('analytics:global-state:user-set', { userId: session.userId });
      }
    }, 'session');

    const unsubscribeRoute = globalState.subscribe((nav: Record<string, unknown>) => {
      if (nav?.currentRoute) {
        AnalyticsTracker.trackPageView(nav.currentRoute as string, nav.activePanel as string);
      }
    }, 'navigation');

    const unsubscribeFlags = globalState.subscribe((flags: Record<string, unknown>) => {
      if (flags && (flags.analyticsEnabled === false || flags.telemetryEnabled === false)) {
        privacyMode = true;
        trackAnalyticsEvent('analytics:privacy-mode:enabled');
      } else if (privacyMode && flags?.analyticsEnabled !== false) {
        privacyMode = false;
        trackAnalyticsEvent('analytics:privacy-mode:disabled');
      }
    }, 'flags');

    globalStateCleanups.push(unsubscribeSession, unsubscribeRoute, unsubscribeFlags);
    trackAnalyticsEvent('analytics:global-state:connected');
  } catch (error: any) {
    trackAnalyticsEvent('analytics:global-state:error', { error: error.message });
  }
};

const cleanupGlobalStateIntegration = () => {
  for (const cleanup of globalStateCleanups) {
    try {
      if (typeof cleanup === 'function') cleanup();
    } catch (e) { /* ignore */ }
  }
  globalStateCleanups = [];
};

const setupOrchestratorIntegration = () => {
  const eventBus = _getPort('eventBus');
  if (!hasWindow || !eventBus) return;
  if (orchestratorCleanups.length > 0) cleanupOrchestratorIntegration();

  try {
    const handlers = {
      'orchestrator:preset:applied': (data: Record<string, unknown>) => AnalyticsTracker.track('orchestrator:preset', { preset: data?.presetId }),
      [ROUTER_EVENTS.ROUTE_CHANGED]: (data: Record<string, unknown>) => {
        if (data?.route) {
          const route = data.route as Record<string, unknown>;
          AnalyticsTracker.trackPageView(route.path as string, route.title as string);
        }
      },
      'main:orchestrator:initialized': () => MetricsManager.track('orchestrator.initialized', 1)
    };

    for (const [event, handler] of Object.entries(handlers)) {
      eventBus.on(event, handler);
      orchestratorCleanups.push(() => {
        const eb = _getPort('eventBus');
        eb?.off?.(event, handler);
      });
    }
    trackAnalyticsEvent('analytics:orchestrator:connected');
  } catch (error: any) {
    trackAnalyticsEvent('analytics:orchestrator:error', { error: error.message });
  }
};

const cleanupOrchestratorIntegration = () => {
  for (const cleanup of orchestratorCleanups) {
    try {
      if (typeof cleanup === 'function') cleanup();
    } catch (e) { /* ignore */ }
  }
  orchestratorCleanups = [];
};

const AnalyticsManager = {
  version: VERSION,
  name: MODULE_ID,

  init: (options = {}) => {
    trackAnalyticsEvent('analytics:api:init:called');
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
    trackAnalyticsEvent('analytics:api:shutdown:called');
    cleanupGlobalStateIntegration();
    cleanupOrchestratorIntegration();
    return AnalyticsLifecycle.shutdown();
  },

  reset: () => {
    trackAnalyticsEvent('analytics:api:reset:called');
    return AnalyticsLifecycle.reset();
  },

  injectPorts,
  getPorts,

  track: (eventName: string, data: Record<string, unknown> = {}) => {
    if (privacyMode) return null;
    return AnalyticsTracker.track(eventName, data);
  },

  trackPageView: (path: string, title: string) => {
    if (privacyMode) return null;
    return AnalyticsTracker.trackPageView(path, title);
  },

  trackClick: (elementId: string, elementType: string) => {
    if (privacyMode) return null;
    return AnalyticsTracker.trackClick(elementId, elementType);
  },

  trackFormSubmit: (formName: string, success: boolean) => {
    if (privacyMode) return null;
    return AnalyticsTracker.trackFormSubmit(formName, success);
  },

  trackError: (errorType: string, errorMessage: string) => {
    if (privacyMode) return null;
    return AnalyticsTracker.trackError(errorType, errorMessage);
  },

  trackSearch: (query: string, resultsCount: number) => {
    if (privacyMode) return null;
    return AnalyticsTracker.trackSearch(query, resultsCount);
  },

  trackConversion: (conversionType: string, value: number) => {
    if (privacyMode) return null;
    return AnalyticsTracker.trackConversion(conversionType, value);
  },

  setMetric: (name: string, value: number) => MetricsManager.track(name, value),
  incrementMetric: (name: string, amount: number) => MetricsManager.increment(name, amount),
  getMetric: (name: string) => MetricsManager.get(name),
  getAllMetrics: () => MetricsManager.getAll(),

  getEvents: () => analyticsStore.getEvents(),
  getRecentEvents: (count: number) => AnalyticsTracker.getRecentEvents(count),
  getSession: () => analyticsStore.getCurrentSession(),

  getSessionDuration: () => {
    const session = AnalyticsManager.getSession();
    if (!session) return 0;
    return calculateSessionDuration(session);
  },

  getFormattedSessionDuration: () => formatDuration(AnalyticsManager.getSessionDuration()),
  getSummary: () => MetricsManager.getSummary(),

  subscribe: (listener: (...args: unknown[]) => void) => analyticsStore.subscribe(listener),
  status: () => AnalyticsLifecycle.getStatus(),
  isInitialized: () => AnalyticsLifecycle.isInitialized(),
  getVersion: () => VERSION,

  isPrivacyMode: () => privacyMode,
  setPrivacyMode: (enabled: boolean) => {
    privacyMode = enabled;
    trackAnalyticsEvent('analytics:privacy-mode:set', { enabled });
  },

  info: () => {
    const lifecycleInfo = AnalyticsLifecycle.info?.() || {};
    const helpersInfo = helpersHealthCheck?.() || {};
    const eventBus = _getPort('eventBus');
    const globalState = _getPort('globalState');
    const telemetry = _getPort('telemetry');
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
    const maxEvents = analyticsStore.get('maxEvents') || 1000;
    const eventBus = _getPort('eventBus');
    const globalState = _getPort('globalState');
    const telemetry = _getPort('telemetry');
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
      status: score === maxScore ? 'HEALTHY' : score >= maxScore - 3 ? 'DEGRADED' : 'UNHEALTHY',
      score,
      maxScore,
      scoreDisplay: `${score}/${maxScore}`,
      checks,
      issues: issues.length > 0 ? issues : null,
      metricsSnapshot: {
        totalEvents: events.length,
        maxEvents,
        sessionsCount: (analyticsStore.get('sessions') || []).length,
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
    getStore: () => analyticsStore.toJSON?.() || (analyticsStore as any).get(),
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
    (window as any).AnalyticsManager = AnalyticsManager;
    trackAnalyticsEvent('analytics:global:exposed');
  } else {
    recordViolation('MODULE_STRICT_BLOCK', { module: MODULE_ID });
  }
  // DevTools sempre permitido
  (window as any).__dev = (window as any).__dev || {};
  (window as any).__dev.analyticsManager = {
    getVersion: () => VERSION,
    info: () => AnalyticsManager.info(),
    healthCheck: () => AnalyticsManager.healthCheck(),
    debug: AnalyticsManager.debug
  };
}

export default AnalyticsManager;
export {
  AnalyticsManager,
  analyticsStore,
  AnalyticsTracker,
  MetricsManager,
  AnalyticsLifecycle
};
