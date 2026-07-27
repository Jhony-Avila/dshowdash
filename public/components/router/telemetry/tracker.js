import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "4.3.0-P18EC";
const MODULE_ID = "router.telemetry.tracker";
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
function getVersion() {
  return VERSION;
}
const createRouterTelemetry = () => {
  const NAMESPACE = "router-global";
  const TRACKER_EVENTS = Object.freeze({
    NAVIGATION_START: "router:navigation:start",
    NAVIGATION_SUCCESS: "router:navigation:success",
    NAVIGATION_ERROR: "router:navigation:error",
    GUARD_BLOCKED: "router:guard:blocked",
    ROUTE_RESOLVED: "router:route:resolved",
    HISTORY_CHANGE: "router:history:change",
    LIFECYCLE_INIT: "router:lifecycle:init",
    LIFECYCLE_READY: "router:lifecycle:ready",
    LIFECYCLE_DESTROY: "router:lifecycle:destroy",
    HEALTH_CHECK: "router:health:check"
  });
  const eventLog = [];
  const maxLogSize = 500;
  const _debug = () => {
    const config = _getPort("config");
    return config && config.app && config.app.debug ? config.app.debug : false;
  };
  let metrics = { totalNavigations: 0, successfulNavigations: 0, failedNavigations: 0, guardBlocks: 0, averageNavigationTime: 0, navigationTimes: [], lastEvent: null, byRoute: {} };
  const logger = {
    info(msg, ctx) {
      if (!ctx) ctx = {};
      if (!_debug()) return;
      try {
        const loggerPort = _getPort("logger");
        if (loggerPort && loggerPort.info) {
          ctx.component = NAMESPACE;
          loggerPort.info(msg, ctx);
        }
      } catch (e) {
      }
    },
    warn(msg, ctx) {
      if (!ctx) ctx = {};
      if (!_debug()) return;
      try {
        const loggerPort = _getPort("logger");
        if (loggerPort && loggerPort.warn) {
          ctx.component = NAMESPACE;
          loggerPort.warn(msg, ctx);
        }
      } catch (e) {
      }
    },
    error(msg, ctx) {
      if (!ctx) ctx = {};
      try {
        const loggerPort = _getPort("logger");
        if (loggerPort && loggerPort.error) {
          ctx.component = NAMESPACE;
          loggerPort.error(msg, ctx);
        }
      } catch (e) {
      }
    },
    debug(msg, ctx) {
      if (!ctx) ctx = {};
      if (!_debug()) return;
      try {
        const loggerPort = _getPort("logger");
        if (loggerPort && loggerPort.debug) {
          ctx.component = NAMESPACE;
          loggerPort.debug(msg, ctx);
        }
      } catch (e) {
      }
    }
  };
  const track = (eventKey, data) => {
    if (!data) data = {};
    try {
      const event = Object.assign({ event: eventKey, timestamp: Date.now(), component: NAMESPACE }, data);
      metrics.lastEvent = event;
      eventLog.push(event);
      if (eventLog.length > maxLogSize) {
        eventLog.shift();
      }
      logger.debug(`Event: ${eventKey}`, event);
      try {
        const eventBus = _getPort("eventBus");
        if (eventBus && eventBus.emit) {
          eventBus.emit(eventKey, event);
        }
      } catch (e) {
      }
      return event;
    } catch (error) {
      return null;
    }
  };
  const trackNavigation = (from, to, params) => {
    if (!params) params = {};
    metrics.totalNavigations++;
    const toPath = typeof to === "string" ? to : to ? to.path : null;
    if (toPath) {
      metrics.byRoute[toPath] = (metrics.byRoute[toPath] || 0) + 1;
    }
    return track(TRACKER_EVENTS.NAVIGATION_START, { from: from ? from.path || from.page || null : null, to: toPath, params, navigationId: `nav-${Date.now()}` });
  };
  const trackNavigationSuccess = (route, durationMs) => {
    try {
      metrics.successfulNavigations++;
      metrics.navigationTimes.push(durationMs);
      if (metrics.navigationTimes.length > 100) {
        metrics.navigationTimes.shift();
      }
      let sum = 0;
      for (let i = 0; i < metrics.navigationTimes.length; i++) {
        sum += metrics.navigationTimes[i];
      }
      metrics.averageNavigationTime = sum / metrics.navigationTimes.length;
      return track(TRACKER_EVENTS.NAVIGATION_SUCCESS, { route: route ? route.path || route : null, page: route ? route.page : null, durationMs, avgTime: metrics.averageNavigationTime.toFixed(2) });
    } catch (error) {
      return track(TRACKER_EVENTS.NAVIGATION_SUCCESS, { route, durationMs });
    }
  };
  const trackNavigationError = (route, error) => {
    metrics.failedNavigations++;
    return track(TRACKER_EVENTS.NAVIGATION_ERROR, { route: route ? route.path || route : null, error: error ? error.message || String(error) : null, stack: error ? error.stack : null });
  };
  const trackGuardBlock = (route, reason) => {
    metrics.guardBlocks++;
    return track(TRACKER_EVENTS.GUARD_BLOCKED, { route: route ? route.path || route : null, page: route ? route.page : null, reason });
  };
  const trackRouteResolved = (path, resolvedRoute) => track(TRACKER_EVENTS.ROUTE_RESOLVED, { path, page: resolvedRoute ? resolvedRoute.page : null, matchType: resolvedRoute ? resolvedRoute.matchType || "unknown" : "unknown", isPublic: resolvedRoute ? resolvedRoute.public || false : false, matched: resolvedRoute ? resolvedRoute.matched !== void 0 ? resolvedRoute.matched : true : true });
  const trackHistoryChange = (action, path) => track(TRACKER_EVENTS.HISTORY_CHANGE, { action, path });
  const trackLifecycle = (phase, data) => {
    if (!data) data = {};
    const eventKey = phase === "init" ? TRACKER_EVENTS.LIFECYCLE_INIT : phase === "ready" ? TRACKER_EVENTS.LIFECYCLE_READY : phase === "destroy" ? TRACKER_EVENTS.LIFECYCLE_DESTROY : `router:lifecycle:${phase}`;
    return track(eventKey, data);
  };
  const trackHealthCheck = (result) => track(TRACKER_EVENTS.HEALTH_CHECK, { healthy: result.healthy, score: result.score, issues: result.issues ? result.issues.length : 0 });
  const getMetrics = () => {
    try {
      const topRoutes = [];
      const entries = Object.entries(metrics.byRoute);
      entries.sort((a, b) => b[1] - a[1]);
      for (let i = 0; i < Math.min(5, entries.length); i++) {
        topRoutes.push({ path: entries[i][0], count: entries[i][1] });
      }
      return { totalNavigations: metrics.totalNavigations, successfulNavigations: metrics.successfulNavigations, failedNavigations: metrics.failedNavigations, guardBlocks: metrics.guardBlocks, averageNavigationTime: metrics.averageNavigationTime, lastEvent: metrics.lastEvent, successRate: metrics.totalNavigations > 0 ? `${(metrics.successfulNavigations / metrics.totalNavigations * 100).toFixed(2)}%` : "0%", topRoutes };
    } catch (error) {
      return Object.assign({}, metrics, { successRate: "0%", topRoutes: [] });
    }
  };
  const resetMetrics = () => {
    metrics = { totalNavigations: 0, successfulNavigations: 0, failedNavigations: 0, guardBlocks: 0, averageNavigationTime: 0, navigationTimes: [], lastEvent: null, byRoute: {} };
  };
  const getEventLog = () => {
    try {
      return eventLog.slice();
    } catch (error) {
      return [];
    }
  };
  const getRecentEvents = (count) => {
    if (!count) count = 10;
    try {
      const safeCount = Math.min(Math.max(1, count), eventLog.length);
      return eventLog.slice(-safeCount);
    } catch (error) {
      return [];
    }
  };
  const clearEventLog = () => {
    eventLog.length = 0;
    return true;
  };
  const getTrackerStats = () => ({
    version: VERSION,
    moduleId: MODULE_ID,
    totalEvents: eventLog.length,
    maxSize: maxLogSize,
    oldestEvent: eventLog[0] ? eventLog[0].timestamp : null,
    newestEvent: eventLog[eventLog.length - 1] ? eventLog[eventLog.length - 1].timestamp : null,
    metrics: getMetrics(),
    portsStatus: { initialized: Ports.isInitialized() }
  });
  const getStatus = () => ({
    version: VERSION,
    moduleId: MODULE_ID,
    eventLogSize: eventLog.length,
    maxLogSize,
    debugMode: _debug(),
    metrics: getMetrics(),
    portsStatus: { initialized: Ports.isInitialized() }
  });
  return { track, trackNavigation, trackNavigationSuccess, trackNavigationError, trackGuardBlock, trackRouteResolved, trackHistoryChange, trackLifecycle, trackHealthCheck, getMetrics, resetMetrics, getEventLog, getRecentEvents, clearEventLog, getTrackerStats, getStatus, logger, injectPorts, getPorts, getVersion, TRACKER_EVENTS };
};
const routerTelemetry = createRouterTelemetry();
var tracker_default = routerTelemetry;
export {
  MODULE_ID,
  VERSION,
  tracker_default as default,
  getPorts,
  getVersion,
  injectPorts,
  routerTelemetry
};
