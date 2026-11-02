// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.5.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: router-global
// PURPOSE: Router Global - Lifecycle
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   routerStore from /components/router/state/store.js
//   routerTelemetry from /components/router/telemetry/tracker.js
//   RouteResolver from /components/router/core/resolver.js
//   HistoryManager from /components/router/core/history.js
//   RouteGuard, validateEventContracts from /components/router/core/guard.js
//   RouteTransitions from /components/router/core/transitions.js
//   ROUTER_EVENTS from /core/runtime/events/index.js
//   createNavigationResult from ./utils.js
//   applyRouteEffects from ./navigation.js
//   setupGlobalStateIntegration, cleanupGlobalStateIntegration, setupAuthEventIntegration, cleanupAuthEventIntegration from ./integrations.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   routerConfig — exported value
//   contractsValid — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   getConfig() — exported function
//   init() — exported function
//   shutdown() — exported function
//   reset() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   ROUTER_EVENTS.READY
//   ROUTER_EVENTS.DESTROYED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.__dev
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { routerStore as _routerStore } from '/components/router/state/store.js';
const routerStore = _routerStore as any;
import { routerTelemetry as _routerTelemetry } from '/components/router/telemetry/tracker.js';
const routerTelemetry = _routerTelemetry as any;
import { RouteResolver } from '/components/router/core/resolver.js';
import { HistoryManager as _HistoryManager } from '/components/router/core/history.js';
const HistoryManager = _HistoryManager as any;
import { RouteGuard, validateEventContracts } from '/components/router/core/guard.js';
import { RouteTransitions } from '/components/router/core/transitions.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';
import { createNavigationResult } from './utils.js';
import { applyRouteEffects } from './navigation.js';
import { setupGlobalStateIntegration, cleanupGlobalStateIntegration, setupAuthEventIntegration, cleanupAuthEventIntegration } from './integrations.js';

export const VERSION = '3.5.0-P18EC';
export const MODULE_ID = 'router-global';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debug = () => { const config = _getPort('config'); return config && config.app && config.app.debug ? true : false; };

export let routerConfig: { routesRegistry: unknown; defaultRoute: string; hashStrategy: string; queryStrategy: string } = { routesRegistry: null, defaultRoute: '/', hashStrategy: 'none', queryStrategy: 'internal' };
export let contractsValid = false;
export function getConfig() { return Object.assign({}, routerConfig); }

export function init(routerGlobal: Record<string, unknown>, config: Record<string, unknown>) {
  if (!config) config = {};
  if (routerGlobal.isInitialized) return Promise.resolve(createNavigationResult(true, 'already-initialized'));
  if (routerGlobal.isDestroyed) return Promise.resolve(createNavigationResult(false, 'router-destroyed-cannot-reinitialize'));
  _initPorts();
  let issues: string[] = [];
  routerConfig = { routesRegistry: config.routesRegistry || null, defaultRoute: (config.defaultRoute as string) || '/', hashStrategy: 'none', queryStrategy: 'internal' };
  return Promise.resolve().then(() => {
    if (routerTelemetry.trackLifecycle) routerTelemetry.trackLifecycle('init:start', { config: routerConfig });
    const contractsResult = validateEventContracts(_debug());
    contractsValid = contractsResult.valid;

    // @ts-expect-error TS migration - TS2339
    if (!contractsResult.valid && contractsResult.warnings) issues = issues.concat(contractsResult.warnings);
    const historyInit = HistoryManager.init ? HistoryManager.init() : true;
    if (!historyInit) issues.push('history-init-failed');
    if (HistoryManager.listen) HistoryManager.listen((path: string, state: Record<string, unknown>) => { (routerGlobal.handleRouteChange as (p: string, s: Record<string, unknown>) => void)(path, state); });
    const runtime = typeof window !== 'undefined' ? { history: window.history } : null;
    const stateRoute = runtime && runtime.history && runtime.history.state ? runtime.history.state.route : null;
    const initialPath = stateRoute || '/';
    const initialRoute = RouteResolver.resolve ? RouteResolver.resolve(initialPath) : { path: initialPath };
    return (Promise.resolve(RouteGuard.checkRoute ? RouteGuard.checkRoute(initialRoute) : { allowed: true }) as Promise<{ allowed: boolean; reason?: string; redirect?: string }>).then((guardResult: { allowed: boolean; reason?: string; redirect?: string }) => {
      if (!guardResult.allowed && guardResult.redirect) {
        if (!(initialRoute as any).public && (initialRoute as any).path !== '/login') routerStore.setAttemptedRoute((initialRoute as any).path);
        if (HistoryManager.replace) HistoryManager.replace(guardResult.redirect);
        const redirectedRoute = RouteResolver.resolve ? RouteResolver.resolve(guardResult.redirect) : { path: guardResult.redirect };
        routerStore.setCurrentRoute(redirectedRoute);
        applyRouteEffects(redirectedRoute);
      } else {
        routerStore.setCurrentRoute(initialRoute);
        applyRouteEffects(initialRoute);
      }
      setupGlobalStateIntegration();
      setupAuthEventIntegration(() => routerGlobal as unknown as { isInitialized: boolean; navigate: (path: string, options?: Record<string, unknown>) => Promise<unknown>; [key: string]: unknown });
      routerGlobal.isInitialized = true;
      if (routerTelemetry.trackLifecycle) routerTelemetry.trackLifecycle('init:complete', { initialRoute: routerStore.getCurrentRoute() ? routerStore.getCurrentRoute().path : null, contractsValid, issues: issues.length });
      const eventBus = _getPort('eventBus');
      try { if (eventBus && eventBus.emit) eventBus.emit(ROUTER_EVENTS.READY, { version: VERSION, currentRoute: routerStore.getCurrentRoute(), timestamp: Date.now() }); } catch (e) {}
      return createNavigationResult(true, issues.length ? 'initialized-with-issues' : null, null, routerStore.getCurrentRoute());
    });
  }).catch(error => {
    if (routerTelemetry.logger && routerTelemetry.logger.error) routerTelemetry.logger.error('Init failed', { error: error.message });
    routerGlobal.isInitialized = false;
    return createNavigationResult(false, `init-error: ${error.message}`);
  });
}

export function shutdown(routerGlobal: Record<string, unknown>) {
  if (routerGlobal.isDestroyed) return true;
  try {
    cleanupGlobalStateIntegration();
    cleanupAuthEventIntegration();
    if ((HistoryManager as any).destroy) (HistoryManager.destroy as any)();

    // @ts-expect-error TS migration - TS2339
    if (RouteTransitions.clearHooks) RouteTransitions.clearHooks();
    if (routerStore.fullReset) routerStore.fullReset();
    if (routerTelemetry.resetMetrics) routerTelemetry.resetMetrics();
    routerGlobal.isInitialized = false;
    routerGlobal.isDestroyed = true;
    contractsValid = false;
    if (routerTelemetry.trackLifecycle) routerTelemetry.trackLifecycle('shutdown');
    const eventBus = _getPort('eventBus');
    try { if (eventBus && eventBus.emit) eventBus.emit(ROUTER_EVENTS.DESTROYED, { timestamp: Date.now() }); } catch (e) {}
    if (typeof window !== 'undefined' && window.__dev) delete window.__dev.routerGlobal;
    return true;
  } catch (error) { return false; }
}


// @ts-expect-error TS migration - TS2339
export function reset() { if (routerStore.reset) routerStore.reset(); if (routerTelemetry.resetMetrics) routerTelemetry.resetMetrics(); if (RouteResolver.resetMetrics) RouteResolver.resetMetrics(); if (RouteTransitions.resetMetrics) RouteTransitions.resetMetrics(); if (RouteGuard.resetMetrics) RouteGuard.resetMetrics(); }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { config: !!getConfig(), portsInitialized: Ports.isInitialized() } }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, config: getConfig(), portsInitialized: Ports.isInitialized() }; }

export default { init, shutdown, reset, getConfig, injectPorts, getPorts, healthCheck, info, VERSION, MODULE_ID };
