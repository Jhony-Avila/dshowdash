// Migrado para TypeScript: 2026-02-25
// Router Global - Navigation v7.1.0
// @version 7.1.0-ENTERPRISE

import { routerStore as _routerStore, createVirtualRoute } from '/components/router/state/store.js';
const routerStore = _routerStore as any;
import { routerTelemetry as _routerTelemetry } from '/components/router/telemetry/tracker.js';
const routerTelemetry = _routerTelemetry as any;
import { URLParser as _URLParser } from '/components/router/core/parser.js';
const URLParser = _URLParser as any;
import { RouteResolver } from '/components/router/core/resolver.js';
import { HistoryManager as _HistoryManager } from '/components/router/core/history.js';
const HistoryManager = _HistoryManager as any;
import { RouteGuard } from '/components/router/core/guard.js';
import { RouteTransitions as _RouteTransitions } from '/components/router/core/transitions.js';
const RouteTransitions = _RouteTransitions as any;
import { getRouteByIdOrPath } from '/components/router/registry/routes.js';
import { ROUTER_EVENTS } from '../events/events-contracts.ts';
import { normalizePath, createNavigationResult } from './utils.ts';
import type { NavigationResult, RouteInfo } from './utils.ts';

// ═══════════════════════════════════════════════════════════════
// Interfaces
// ═══════════════════════════════════════════════════════════════

export interface RouterGlobalInstance {
  isInitialized: boolean;
  isDestroyed: boolean;
  version: string;
  moduleId: string;
  isReady: () => boolean;
  navigate: (logicalPathOrId: string, options?: NavigateOptions) => Promise<NavigationResult>;
  replace: (logicalPathOrId: string, options?: NavigateOptions) => Promise<NavigationResult>;
  handleRouteChange: (path: string, state: unknown) => Promise<void>;
  [key: string]: unknown;
}

export interface NavigateOptions {
  replace?: boolean;
  force?: boolean;
  source?: string;
  virtualRoute?: Record<string, unknown>;
  [key: string]: unknown;
}

interface GuardResult {
  allowed: boolean;
  reason?: string;
  redirect?: string;
  [key: string]: unknown;
}

interface VirtualRoute {
  view?: string;
  tab?: string;
  section?: string;
  entity?: string;
  id?: string | number;
  mode?: string;
  page?: number;
  sort?: string;
  filters?: Record<string, unknown>;
  [key: string]: unknown;
}

// ═══════════════════════════════════════════════════════════════
// navigate
// ═══════════════════════════════════════════════════════════════

export async function navigate(
  routerGlobal: RouterGlobalInstance,
  logicalPathOrId: string,
  options: NavigateOptions = {}
): Promise<NavigationResult> {
  if (!routerGlobal.isInitialized) return createNavigationResult(false, 'router-not-initialized');

  const routeEntry = getRouteByIdOrPath(logicalPathOrId) as RouteInfo | null;
  const normalizedPath: string = routeEntry?.path || normalizePath(logicalPathOrId);
  const startTime: number = Date.now();

  routerStore.setNavigating(true);
  routerStore.clearError();

  const virtualRoute: VirtualRoute | null = options.virtualRoute
    // @ts-expect-error strict migration — TS2352
    ? (createVirtualRoute(options.virtualRoute) as VirtualRoute)
    : null;

  if (window.EventBus?.emit) {
    window.EventBus.emit((ROUTER_EVENTS as Record<string, string>).NAVIGATE_REQUESTED ?? 'router:navigate:requested', {
      from: routerStore.getCurrentRoute(), to: normalizedPath,
      originalPath: logicalPathOrId, virtualRoute, options,
      source: options.source || "navigate", timestamp: Date.now()
    });
  }

  try {
    const resolvedRoute = RouteResolver.resolve(normalizedPath) as RouteInfo;
    const currentRoute = routerStore.getCurrentRoute() as RouteInfo | null;

    if (currentRoute && URLParser.isSamePath(currentRoute.path, resolvedRoute.path) && !options.force) {
      if (!virtualRoute) { routerStore.setNavigating(false); return createNavigationResult(true, 'same-route', null, currentRoute); }
      routerStore.setVirtualRoute(virtualRoute);
      routerStore.setNavigating(false);
      return createNavigationResult(true, 'virtual-route-updated', null, currentRoute);
    }

    const canProceed: boolean = await RouteTransitions.runBeforeHooks(currentRoute, resolvedRoute);
    if (!canProceed) {
      routerStore.setNavigating(false);
      return createNavigationResult(false, 'before-hook-blocked', 'transitions');
    }

    const guardResult: GuardResult = await RouteGuard.checkRoute(resolvedRoute) as GuardResult;
    if (!guardResult.allowed) {
      if (window.EventBus?.emit) window.EventBus.emit((ROUTER_EVENTS as Record<string, string>).NAVIGATE_BLOCKED ?? 'router:navigate:blocked', { from: currentRoute, to: resolvedRoute, reason: guardResult.reason || "forbidden", timestamp: Date.now() });
      if (guardResult.reason === 'unauthenticated' && normalizedPath !== '/login') routerStore.setAttemptedRoute(normalizedPath, options);
      if (guardResult.redirect) { routerStore.setNavigating(false); return navigate(routerGlobal, guardResult.redirect, { replace: true }); }
      routerStore.setNavigating(false);
      return createNavigationResult(false, guardResult.reason || 'forbidden', 'guard');
    }

    routerTelemetry.trackNavigation(currentRoute, resolvedRoute.path);

    if (window.EventBus?.emit) {
      window.EventBus.emit((ROUTER_EVENTS as Record<string, string>).NAVIGATE_ALLOWED ?? 'router:navigate:allowed', { from: currentRoute, to: resolvedRoute, virtualRoute, permissionsChecked: true, authChecked: true, timestamp: Date.now() });
    }

    const routeVirtualDefaults: Record<string, unknown> = (resolvedRoute.virtualDefaults as Record<string, unknown>) || {};
    // @ts-expect-error strict migration — TS2352
    const finalVirtualRoute: VirtualRoute = virtualRoute || (createVirtualRoute(routeVirtualDefaults) as VirtualRoute);

    if (options.replace) {
      HistoryManager.replace(resolvedRoute.path, { ...resolvedRoute, virtualRoute: finalVirtualRoute });
    } else {
      HistoryManager.push(resolvedRoute.path, { ...resolvedRoute, virtualRoute: finalVirtualRoute });
    }

    const routeWithVirtual = { ...resolvedRoute, ...finalVirtualRoute } as RouteInfo;
    routerStore.setCurrentRoute(routeWithVirtual);
    routerStore.setVirtualRoute(finalVirtualRoute);

    applyRouteEffects(resolvedRoute);
    await RouteTransitions.runAfterHooks(currentRoute, resolvedRoute);

    routerTelemetry.trackNavigationSuccess(resolvedRoute, Date.now() - startTime);
    routerStore.setNavigating(false);

    return createNavigationResult(true, null, null, resolvedRoute);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    routerTelemetry.trackNavigationError(normalizedPath, err);
    routerStore.setError(err);
    routerStore.setNavigating(false);
    return createNavigationResult(false, err.message, 'exception');
  }
}

// ═══════════════════════════════════════════════════════════════
// replace
// ═══════════════════════════════════════════════════════════════

export async function replace(
  routerGlobal: RouterGlobalInstance,
  logicalPathOrId: string,
  options: NavigateOptions = {}
): Promise<NavigationResult> {
  return navigate(routerGlobal, logicalPathOrId, { ...options, replace: true });
}

// ═══════════════════════════════════════════════════════════════
// handleRouteChange
// ═══════════════════════════════════════════════════════════════

export async function handleRouteChange(
  routerGlobal: RouterGlobalInstance,
  path: string,
  state: unknown
): Promise<void> {
  try {
    const normalizedPath: string = normalizePath(path);
    const resolvedRoute = RouteResolver.resolve(normalizedPath) as RouteInfo;
    const guardResult: GuardResult = await RouteGuard.checkRoute(resolvedRoute) as GuardResult;

    if (!guardResult.allowed && guardResult.redirect) {
      if (guardResult.reason === 'unauthenticated' && normalizedPath !== '/login') routerStore.setAttemptedRoute(normalizedPath);
      HistoryManager.replace(guardResult.redirect);
      const redirectedRoute = RouteResolver.resolve(guardResult.redirect) as RouteInfo;
      routerStore.setCurrentRoute(redirectedRoute);
      applyRouteEffects(redirectedRoute);
    } else {
      routerStore.setCurrentRoute(resolvedRoute);
      applyRouteEffects(resolvedRoute);
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    routerTelemetry.logger.error('handleRouteChange error', { error: err.message });
  }
}

// ═══════════════════════════════════════════════════════════════
// applyRouteEffects
// ═══════════════════════════════════════════════════════════════

export function applyRouteEffects(route: RouteInfo | null): void {
  if (!route) return;
  try {
    HistoryManager.updateTitle(route.title || 'DshowDash');

    if (window.EventBus?.emit) {
      window.EventBus.emit(ROUTER_EVENTS.ROUTE_CHANGED, {
        route: { path: route.path, page: route.page, title: route.title, params: route.params, query: route.query, hash: route.hash, layout: route.layout },
        virtualRoute: routerStore.getVirtualRoute(),
        timestamp: Date.now()
      });
    }

    const layoutType: string = route.layout || 'default';
    const hideNav: boolean = layoutType === 'full-screen' || layoutType === 'login-only';

    if (window.EventBus?.emit) {
      window.EventBus.emit('router:layout:changed', { layout: layoutType, route: route.path, hideNav: hideNav, timestamp: Date.now() });
    }
  } catch (_error: unknown) { /* silenced */ }
}
