// Migrado para TypeScript: 2026-02-25
// Router Global - Lifecycle v7.1.0
// @version 7.1.0-ENTERPRISE

import { routerStore as _routerStore } from '/components/router/state/store.js';
const routerStore = _routerStore as any;
import { routerTelemetry as _routerTelemetry } from '/components/router/telemetry/tracker.js';
const routerTelemetry = _routerTelemetry as any;
import { RouteResolver as _RouteResolver } from '/components/router/core/resolver.js';
const RouteResolver = _RouteResolver as any;
import { HistoryManager as _HistoryManager } from '/components/router/core/history.js';
const HistoryManager = _HistoryManager as any;
import { RouteGuard } from '/components/router/core/guard.js';
import { RouteTransitions as _RouteTransitions } from '/components/router/core/transitions.js';
const RouteTransitions = _RouteTransitions as any;
import { validateEventContracts, ROUTER_EVENTS } from '../events/events-contracts.ts';
import { createNavigationResult } from './utils.ts';
import type { NavigationResult, RouteInfo } from './utils.ts';
import { applyRouteEffects } from './navigation.ts';
import type { RouterGlobalInstance } from './navigation.ts';
import {
  setupGlobalStateIntegration, cleanupGlobalStateIntegration,
  setupAuthEventIntegration, cleanupAuthEventIntegration
} from './integrations.ts';

// ═══════════════════════════════════════════════════════════════
// Interfaces
// ═══════════════════════════════════════════════════════════════

export interface RouterConfig {
  routesRegistry: unknown;
  defaultRoute: string;
  hashStrategy: 'none';
  queryStrategy: 'internal';
}

interface InitConfig {
  routesRegistry?: unknown;
  defaultRoute?: string;
  [key: string]: unknown;
}

interface GuardResult {
  allowed: boolean;
  reason?: string;
  redirect?: string;
  [key: string]: unknown;
}

interface HistoryState {
  route?: string;
  [key: string]: unknown;
}

// ═══════════════════════════════════════════════════════════════
// Estado do modulo
// ═══════════════════════════════════════════════════════════════

const debug: boolean = window.APP_CONFIG?.app?.debug ?? false;

export let routerConfig: RouterConfig = {
  routesRegistry: null,
  defaultRoute: '/',
  hashStrategy: 'none',
  queryStrategy: 'internal'
};

export let contractsValid = false;

// ═══════════════════════════════════════════════════════════════
// getConfig
// ═══════════════════════════════════════════════════════════════

export function getConfig(): RouterConfig { return { ...routerConfig }; }

// ═══════════════════════════════════════════════════════════════
// init
// ═══════════════════════════════════════════════════════════════

export async function init(
  routerGlobal: RouterGlobalInstance,
  config: InitConfig = {}
): Promise<NavigationResult> {
  if (routerGlobal.isInitialized) return createNavigationResult(true, 'already-initialized');
  if (routerGlobal.isDestroyed) return createNavigationResult(false, 'router-destroyed-cannot-reinitialize');

  const issues: string[] = [];
  routerConfig = {
    routesRegistry: config.routesRegistry || null,
    defaultRoute: config.defaultRoute || '/',
    hashStrategy: 'none',
    queryStrategy: 'internal'
  };

  try {
    routerTelemetry.trackLifecycle('init:start', { config: routerConfig });
    const contractsResult = validateEventContracts();
    contractsValid = contractsResult.valid;
    if (!contractsResult.valid) issues.push(...contractsResult.missing);

    const historyInit: unknown = HistoryManager.init();
    if (!historyInit) issues.push('history-init-failed');

    HistoryManager.listen((path: string, state: unknown) => { routerGlobal.handleRouteChange(path, state); });

    const historyState = window.history.state as HistoryState | null;
    const stateRoute: string | undefined = historyState?.route;
    const initialPath: string = stateRoute || '/';
    const initialRoute = RouteResolver.resolve(initialPath) as RouteInfo;
    const guardResult: GuardResult = await RouteGuard.checkRoute(initialRoute) as GuardResult;

    if (!guardResult.allowed && guardResult.redirect) {
      if (!initialRoute.public && initialRoute.path !== '/login') routerStore.setAttemptedRoute(initialRoute.path);
      HistoryManager.replace(guardResult.redirect);
      const redirectedRoute = RouteResolver.resolve(guardResult.redirect) as RouteInfo;
      routerStore.setCurrentRoute(redirectedRoute);
      applyRouteEffects(redirectedRoute);
    } else {
      routerStore.setCurrentRoute(initialRoute);
      applyRouteEffects(initialRoute);
    }

    setupGlobalStateIntegration();
    setupAuthEventIntegration(() => routerGlobal);
    routerGlobal.isInitialized = true;

    const currentRoute = routerStore.getCurrentRoute() as RouteInfo | null;
    routerTelemetry.trackLifecycle('init:complete', { initialRoute: currentRoute?.path, contractsValid, issues: issues.length });
    try { if (window.EventBus?.emit) window.EventBus.emit(ROUTER_EVENTS.READY, { version: routerGlobal.version, currentRoute, timestamp: Date.now() }); } catch (_e: unknown) { /* silenced */ }

    return createNavigationResult(true, issues.length ? 'initialized-with-issues' : null, null, currentRoute);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    routerTelemetry.logger.error('Init failed', { error: err.message });
    routerGlobal.isInitialized = false;
    return createNavigationResult(false, `init-error: ${err.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// shutdown
// ═══════════════════════════════════════════════════════════════

export function shutdown(routerGlobal: RouterGlobalInstance): boolean {
  if (routerGlobal.isDestroyed) return true;
  try {
    cleanupGlobalStateIntegration();
    cleanupAuthEventIntegration();
    HistoryManager.destroy();
    RouteTransitions.clearHooks();
    routerStore.fullReset();
    routerTelemetry.resetMetrics();
    routerGlobal.isInitialized = false;
    routerGlobal.isDestroyed = true;
    contractsValid = false;
    routerTelemetry.trackLifecycle('shutdown');
    try {
      if (window.EventBus?.emit) {
        window.EventBus.emit((ROUTER_EVENTS as Record<string, string>).DESTROYED ?? 'router:destroyed', { timestamp: Date.now() });
      }
    } catch (_e: unknown) { /* silenced */ }
    const devWindow = window as unknown as Record<string, unknown>;
    const devObj = devWindow.__dev as Record<string, unknown> | undefined;
    if (devObj) delete devObj.routerGlobal;
    return true;
  } catch (_error: unknown) { return false; }
}

// ═══════════════════════════════════════════════════════════════
// reset
// ═══════════════════════════════════════════════════════════════

export function reset(): void {
  routerStore.reset();
  routerTelemetry.resetMetrics();
  RouteResolver.resetMetrics();
  RouteTransitions.resetMetrics();
  RouteGuard.resetMetrics();
}
