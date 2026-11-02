// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.5.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: router-global
// PURPOSE: Router Global - Public API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   initPorts, injectPorts, getPort, getPorts, isInitialized as isPortsInitialized, log from ./ports.js
//   CircuitBreaker, RetryManager from ./circuit-breaker.js
//   metrics, createNavigationAbortController, isNavigationAborted, clearAbortController, abortNavigation, updateAvgNavigationTime, createRoutePayload, resetMetrics, hasAbortController, getMetrics as getNavMetrics from ./navigation-controller.js
//   AUTH_EVENTS, ROUTER_EVENTS from /app/events/index.js
//   routerStore, createVirtualRoute from /components/router/state/store.js
//   routerTelemetry from /components/router/telemetry/tracker.js
//   RouteGuard from /components/router/core/guard.js
//   RouteResolver from /components/router/core/resolver.js
//   HistoryManager from /components/router/core/history.js
//   RouteTransitions from /components/router/core/transitions.js
//   URLParser from /components/router/core/parser.js
//   handleRouteChange as navigationHandleRouteChange, applyRouteEffects from ./navigation.js
//   getRouteByIdOrPath from /components/router/registry/routes.js
//   setupGlobalStateIntegration, cleanupGlobalStateIntegration, setupAuthEventIntegration, cleanupAuthEventIntegration from ./integrations.js
//
// PROVIDES:
//   VERSION, MODULE_ID, RouterGlobal, getVersion(), AUTH_EVENTS, ROUTER_EVENTS,
//   routerStore, routerTelemetry, RouteGuard, RouteResolver, HistoryManager,
//   RouteTransitions, URLParser, injectPorts, getPorts
//
// EMITS: ROUTER_EVENTS.INITIALIZED, READY, GUARD_BLOCK, NAVIGATE_START, ROUTE_CHANGED, NAVIGATE_END, NAVIGATE_ERROR, CANVAS_NAVIGATE
// LISTENS: ROUTER_EVENTS.ROUTE_CHANGED
// WINDOW ACCESS: window.RouterGlobal, window.__dev
// @changelog v4.5.0-P18EC: Fix setVirtualRoute before setCurrentRoute so subscriber sees virtualRoute.view on notify
// @changelog v4.4.0-P18EC: Add setupGlobalStateIntegration + setupAuthEventIntegration in init()
// @changelog v4.3.0-P18EC: Fix navigate() to resolve full route data from registry
// @changelog v4.2.0-P18EC: Previous version
// ═══════════════════════════════════════════════════════════════
'use strict';

import { initPorts, injectPorts, getPort, getPorts, isInitialized as isPortsInitialized, log } from './ports.js';
import { CircuitBreaker, RetryManager } from './circuit-breaker.js';
import { metrics, createNavigationAbortController, isNavigationAborted, clearAbortController, abortNavigation, updateAvgNavigationTime, createRoutePayload, resetMetrics, hasAbortController, getMetrics as getNavMetrics } from './navigation-controller.js';

import { AUTH_EVENTS, ROUTER_EVENTS } from '/app/events/index.js';
import { routerStore as _routerStore, createVirtualRoute } from '/components/router/state/store.js';
const routerStore = _routerStore as any;
import { routerTelemetry } from '/components/router/telemetry/tracker.js';
import { RouteGuard } from '/components/router/core/guard.js';
import { RouteResolver } from '/components/router/core/resolver.js';
import { HistoryManager as _HistoryManager } from '/components/router/core/history.js';
const HistoryManager = _HistoryManager as any;
import { RouteTransitions } from '/components/router/core/transitions.js';
import { URLParser } from '/components/router/core/parser.js';
import { handleRouteChange as navigationHandleRouteChange, applyRouteEffects } from './navigation.js';
import { getRouteByIdOrPath } from '/components/router/registry/routes.js';
import { setupGlobalStateIntegration, cleanupGlobalStateIntegration, setupAuthEventIntegration, cleanupAuthEventIntegration } from './integrations.js';

export const VERSION = '4.5.0-P18EC';
export const MODULE_ID = 'router-global';

export { AUTH_EVENTS, ROUTER_EVENTS, routerStore, routerTelemetry, RouteGuard, RouteResolver, HistoryManager, RouteTransitions, URLParser, injectPorts, getPorts };
export function getVersion() { return VERSION; }

let _initialized = false;
let _initTimestamp: number | null = null;
const _routeChangeListeners = new Set<(payload: Record<string, unknown>) => void>();

function _notifyRouteChangeListeners(payload: Record<string, unknown>): void {
  _routeChangeListeners.forEach(handler => { try { (handler as any)(payload); } catch (e) { log('error', 'Route change listener error', { error: (e as any).message }); } });
}

export const RouterGlobal = {
  version: VERSION, moduleId: MODULE_ID, isInitialized: false, isDestroyed: false,
  injectPorts, getPorts,

  init(options: Record<string, unknown>) {
    const self = this;
    if (!options) options = {};
    if (_initialized) { log('warn', 'Already initialized'); return Promise.resolve(true); }
    return Promise.resolve().then(() => {
      log('info', 'Initializing Router v4.5.0-P18EC...');
      initPorts();
      if (routerStore.init) routerStore.init(options);
      if (HistoryManager.init) HistoryManager.init();
      const runtime = getPort('runtime');
      if (runtime && runtime.addEventListener) runtime.addEventListener('popstate', (e: PopStateEvent) => { self._handlePopState(e); });
      CircuitBreaker.reset();
      _initialized = true;
      self.isInitialized = true;
      self.isDestroyed = false;
      _initTimestamp = Date.now();
      const eventBus = getPort('eventBus');
      if (eventBus && eventBus.emit) { eventBus.emit(ROUTER_EVENTS.INITIALIZED, { version: VERSION }); eventBus.emit(ROUTER_EVENTS.READY, { version: VERSION }); }
      // v4.4.0: Setup integrations (GlobalState sync + Auth events) - same as lifecycle.js lines 102-103
      setupGlobalStateIntegration();
      // @ts-expect-error strict migration — TS2322
      setupAuthEventIntegration(() => self);
      log('info', 'Router initialized (Circuit Breaker, Retry, AbortController, Integrations enabled)');
      return true;
    }).catch(error => { log('error', 'Init failed', { error: error.message }); metrics.errorCount++; metrics.lastError = error.message; return false; });
  },

  _handlePopState(event: PopStateEvent) {
    const runtime = getPort('runtime');
    const path = runtime && runtime.location && runtime.location.hash ? runtime.location.hash.replace('#', '') : '/';
    this.handleRouteChange(path, event.state || {});
  },

  navigate(path: string, options: Record<string, unknown>) {
    const self = this;
    if (!options) options = {};
    if (!_initialized) { log('warn', 'Not initialized'); return Promise.resolve(false); }
    if (!CircuitBreaker.canNavigate(path, metrics)) { metrics.navigationsBlocked++; return Promise.resolve(false); }

    const startTime = Date.now();
    metrics.navigationsTotal++;
    createNavigationAbortController();

    return Promise.resolve().then(() => {
      const replace = options.replace || false;
      const source = options.source || 'api';
      const eventBus = getPort('eventBus');
      const runtime = getPort('runtime');

      // @ts-expect-error strict migration — TS2345
      return Promise.resolve(RouteGuard.checkRoute ? RouteGuard.checkRoute({ path }) : { allowed: true }).then((guardResult: { allowed: boolean; reason?: string; redirect?: string }) => {
        if (!guardResult.allowed) {
          log('warn', 'Navigation blocked by guard', { path, reason: guardResult.reason });
          metrics.guardBlocks++;
          if (eventBus && eventBus.emit) eventBus.emit(ROUTER_EVENTS.GUARD_BLOCK, { path, reason: guardResult.reason });
          if (guardResult.redirect && runtime && runtime.location) { log('info', 'Redirecting to', { redirect: guardResult.redirect }); clearAbortController(); runtime.location.href = guardResult.redirect; return false; }
          CircuitBreaker.recordFailure(path, metrics);
          clearAbortController();
          return false;
        }

        if (isNavigationAborted()) { log('info', 'Navigation aborted before execution'); return false; }
        if (eventBus && eventBus.emit) eventBus.emit(ROUTER_EVENTS.NAVIGATE_START, { path, options });

        const hashPath = path.indexOf('#') === 0 ? path : '#' + path;
        if (runtime && runtime.history) {
          if (replace) runtime.history.replaceState({ path }, '', hashPath);
          else runtime.history.pushState({ path }, '', hashPath);
        }

        // v4.3.0: Resolve full route data from registry for proper panel/page resolution
        const routeEntry = getRouteByIdOrPath(path);
        const routeData = routeEntry
          ? Object.assign({}, routeEntry, { path: routeEntry.path || path, timestamp: Date.now() })
          : { path, timestamp: Date.now() };

        // v4.3.0: Create virtualRoute from route virtualDefaults for proper panel identification
        const virtualRoute = options.virtualRoute
          ? createVirtualRoute(options.virtualRoute as Record<string, unknown>)
          : (routeEntry && routeEntry.virtualDefaults)
            ? createVirtualRoute(routeEntry.virtualDefaults)
            : null;

        // v4.3.0: Merge virtual route info into route data for complete state
        const routeWithVirtual = virtualRoute
          ? Object.assign({}, routeData, virtualRoute)
          : routeData;

        // v4.5.0: Set virtualRoute BEFORE currentRoute so subscriber sees it on _notify()
        if (virtualRoute && routerStore.setVirtualRoute) {
          routerStore.setVirtualRoute(virtualRoute);
        }

        // v4.3.0: Set enriched route in store (triggers subscriber -> GlobalState sync via _notify)
        if (routerStore.setCurrentRoute) routerStore.setCurrentRoute(routeWithVirtual);
        else if (routerStore.setState) routerStore.setState({ currentPath: path, lastNavigateAt: Date.now() });

        // v4.3.0: Apply route effects (emits ROUTE_CHANGED with rich route data + LAYOUT_CHANGED)
        applyRouteEffects(routeWithVirtual);

        // Emit NAVIGATE_END and notify direct listeners
        if (eventBus && eventBus.emit) {
          eventBus.emit(ROUTER_EVENTS.NAVIGATE_END, { path, options });
          _notifyRouteChangeListeners(createRoutePayload(path, options, routeWithVirtual));
        }

        const duration = Date.now() - startTime;
        metrics.navigationsSucceeded++;
        metrics.lastNavigationTime = Date.now();
        metrics.lastNavigationDuration = duration;
        updateAvgNavigationTime(duration);
        CircuitBreaker.recordSuccess();
        if (routerTelemetry && routerTelemetry.track) routerTelemetry.track('navigate', { path, source, duration });
        clearAbortController();
        return true;
      });
    }).catch(error => {
      log('error', 'Navigate failed', { path, error: error.message });
      metrics.navigationsFailed++; metrics.errorCount++; metrics.lastError = error.message;
      CircuitBreaker.recordFailure(path, metrics);
      const eventBus = getPort('eventBus');
      if (eventBus && eventBus.emit) eventBus.emit(ROUTER_EVENTS.NAVIGATE_ERROR, { path, error: error.message });
      clearAbortController();
      return false;
    });
  },

  handleRouteChange(path: string, state: Record<string, unknown>) {
    const self = this;
    if (!state) state = {};
    if (!_initialized) return Promise.resolve();
    return Promise.resolve().then(() => navigationHandleRouteChange(self, path, state)).catch(error => {
      log('error', 'handleRouteChange error', { path, error: error.message });
      const routeData = Object.assign({ path, timestamp: Date.now() }, state);
      const payload = createRoutePayload(path, {}, routeData);
      const eventBus = getPort('eventBus');
      if (eventBus && eventBus.emit) eventBus.emit(ROUTER_EVENTS.ROUTE_CHANGED, payload);
      _notifyRouteChangeListeners(payload);
    });
  },

  navigateCanvas(panelIds: string | string[], options: Record<string, unknown>) { if (!options) options = {}; if (!Array.isArray(panelIds)) panelIds = [panelIds]; const canvasPath = '/canvas?panels=' + panelIds.join(','); const eventBus = getPort('eventBus'); if (eventBus && eventBus.emit) eventBus.emit(ROUTER_EVENTS.CANVAS_NAVIGATE, { panelIds, options }); return this.navigate(canvasPath, options); },
  abortNavigation,

  current() {
    const runtime = getPort('runtime');
    if (!runtime || !runtime.location) return { path: '/' };
    const hash = runtime.location.hash || '#/';
    const path = hash.replace('#', '') || '/';
    return { path, hash, search: runtime.location.search, fullPath: path + runtime.location.search };
  },

  getCurrentRoute() { const storeRoute = routerStore.getCurrentRoute ? routerStore.getCurrentRoute() : null; if (storeRoute) return storeRoute; return this.current(); },

  onRouteChange(handler: (payload: Record<string, unknown>) => void) {
    if (typeof handler !== 'function') return () => {};
    _routeChangeListeners.add(handler);
    const eventBus = getPort('eventBus');
    const eventHandler = (data: Record<string, unknown>) => { try { handler(data); } catch (e) { log('error', 'onRouteChange handler error', { error: (e as Error).message }); } };
    if (eventBus && eventBus.on) eventBus.on(ROUTER_EVENTS.ROUTE_CHANGED, eventHandler);
    return () => { _routeChangeListeners.delete(handler); if (eventBus && eventBus.off) eventBus.off(ROUTER_EVENTS.ROUTE_CHANGED, eventHandler); };
  },

  resolveFromUrl() { return this.current(); },
  back() { const runtime = getPort('runtime'); if (runtime && runtime.history) runtime.history.back(); },
  forward() { const runtime = getPort('runtime'); if (runtime && runtime.history) runtime.history.forward(); },
  isReady() { return _initialized; },
  retryLastNavigation() { const self = this; const attempted = routerStore.getAttemptedRoute ? routerStore.getAttemptedRoute() : null; if (attempted && attempted.path) { log('info', 'Retrying last navigation', { path: attempted.path }); return self.navigate(attempted.path, attempted.options || {}); } return Promise.resolve(false); },
  resetCircuitBreaker() { CircuitBreaker.reset(); log('info', 'Circuit breaker reset'); },
  getCircuitBreakerStatus() { return CircuitBreaker.getStatus(); },

  getStatus() { return { version: VERSION, moduleId: MODULE_ID, initialized: _initialized, initTimestamp: _initTimestamp, currentRoute: this.getCurrentRoute(), uptime: _initTimestamp ? Date.now() - _initTimestamp : 0, listenerCount: _routeChangeListeners.size, circuitBreaker: CircuitBreaker.getStatus(), retry: RetryManager.getStatus(), hasAbortController: hasAbortController(), portsStatus: { initialized: isPortsInitialized() } }; },

  getMetrics() { const storeMetrics = routerStore.getMetrics ? routerStore.getMetrics() : {}; return Object.assign({ version: VERSION, moduleId: MODULE_ID }, storeMetrics, getNavMetrics(), { circuitBreaker: CircuitBreaker.getStatus(), retry: RetryManager.getStatus(), uptime: _initTimestamp ? Date.now() - _initTimestamp : 0, timestamp: Date.now() }); },

  healthCheck() {
    const eventBus = getPort('eventBus');
    const globalState = getPort('globalState');
    const checks = { initialized: _initialized, notDestroyed: !this.isDestroyed, portsInitialized: isPortsInitialized(), circuitBreakerClosed: CircuitBreaker.state === 'CLOSED', lowFailureRate: metrics.navigationsTotal === 0 || (metrics.navigationsFailed / metrics.navigationsTotal) < 0.3, lowErrorCount: metrics.errorCount < 10, noLoopsDetected: metrics.loopsDetected < 5, guardAvailable: !!RouteGuard.checkRoute, eventBusConnected: !!eventBus, globalStateConnected: !!globalState };
    let passed = 0, total = 0;
    for (const k in checks) { if (checks.hasOwnProperty(k)) { total++; if ((checks as Record<string, boolean>)[k]) passed++; } }
    const status = passed < total * 0.5 ? 'UNHEALTHY' : passed < total ? 'DEGRADED' : 'HEALTHY';
    const issues = [];
    if (!checks.initialized) issues.push('not-initialized');
    if (!checks.portsInitialized) issues.push('ports-not-initialized');
    if (!checks.circuitBreakerClosed) issues.push('circuit-breaker-' + CircuitBreaker.state);
    if (!checks.lowErrorCount) issues.push('high-error-count');
    return { status, score: passed + '/' + total, healthy: passed >= total - 2, checks, issues: issues.length > 0 ? issues : null, circuitBreaker: CircuitBreaker.getStatus(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  },

  info() { return Object.assign({}, this.getStatus(), { metrics: this.getMetrics(), healthCheck: this.healthCheck() }); },
  resetMetrics() { resetMetrics(); CircuitBreaker.reset(); },
  // v4.4.0: Cleanup integrations on destroy
  destroy() { _initialized = false; this.isInitialized = false; this.isDestroyed = true; _initTimestamp = null; _routeChangeListeners.clear(); cleanupGlobalStateIntegration(); cleanupAuthEventIntegration(); CircuitBreaker.reset(); clearAbortController(); log('info', 'Destroyed'); }
};

// DevTools
if (typeof window !== 'undefined') {
  window.__dev = window.__dev || {};
  window.__dev.routerGlobal = {
    getVersion() { return VERSION; },
    info() { return RouterGlobal.info(); },
    healthCheck() { return RouterGlobal.healthCheck(); },
    getStatus() { return RouterGlobal.getStatus(); },
    getMetrics() { return RouterGlobal.getMetrics(); },
    getCircuitBreakerStatus() { return RouterGlobal.getCircuitBreakerStatus(); },
    getPorts() { return RouterGlobal.getPorts(); },
    resetCircuitBreaker() { return RouterGlobal.resetCircuitBreaker(); },
    resetMetrics() { return RouterGlobal.resetMetrics(); },
    abortNavigation() { return RouterGlobal.abortNavigation(); },
    retryLastNavigation() { return RouterGlobal.retryLastNavigation(); }
  };
}

export default RouterGlobal;
