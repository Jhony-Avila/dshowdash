// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.4.0-HOOKS-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: router-navigation
// PURPOSE: Router Global - Navigation
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   ROUTER_EVENTS from /core/runtime/events/index.js
//   routerStore, createVirtualRoute from /components/router/state/store.js
//   routerTelemetry from /components/router/telemetry/tracker.js
//   URLParser from /components/router/core/parser.js
//   RouteResolver from /components/router/core/resolver.js
//   HistoryManager from /components/router/core/history.js
//   RouteGuard from /components/router/core/guard.js
//   RouteTransitions from /components/router/core/transitions.js
//   RouterHooks from /components/router/hooks/index.js
//   getRouteByIdOrPath from /components/router/registry/routes.js
//   normalizePath, createNavigationResult from ./utils.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   navigate() — exported function
//   replace() — exported function
//   handleRouteChange() — exported function
//   applyRouteEffects() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   ROUTER_EVENTS.NAVIGATE_REQUEST
//   ROUTER_EVENTS.GUARD_BLOCKED
//   ROUTER_EVENTS.GUARD_PASSED
//   ROUTER_EVENTS.ROUTE_CHANGED
//   ROUTER_EVENTS.LAYOUT_CHANGED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';
import { routerStore as _routerStore, createVirtualRoute } from '/components/router/state/store.js';
const routerStore = _routerStore as any;
import { routerTelemetry as _routerTelemetry } from '/components/router/telemetry/tracker.js';
const routerTelemetry = _routerTelemetry as any;
import { URLParser } from '/components/router/core/parser.js';
import { RouteResolver } from '/components/router/core/resolver.js';
import { HistoryManager as _HistoryManager } from '/components/router/core/history.js';
const HistoryManager = _HistoryManager as any;
import { RouteGuard } from '/components/router/core/guard.js';
import { RouteTransitions } from '/components/router/core/transitions.js';
import { RouterHooks } from '/components/router/hooks/index.js';
import { getRouteByIdOrPath } from '/components/router/registry/routes.js';
import { normalizePath, createNavigationResult } from './utils.js';

export const VERSION = '3.4.0-HOOKS-FIX';
export const MODULE_ID = 'router-navigation';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export function navigate(routerGlobal: Record<string, unknown>, logicalPathOrId: string, options: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (!options) options = {};
  if (!routerGlobal.isInitialized) return Promise.resolve(createNavigationResult(false, 'router-not-initialized'));
  const routeEntry = getRouteByIdOrPath(logicalPathOrId);
  const normalizedPath = routeEntry && routeEntry.path ? routeEntry.path : normalizePath(logicalPathOrId);
  const startTime = Date.now();
  routerStore.setNavigating(true);
  routerStore.clearError();
  const virtualRoute = options.virtualRoute ? createVirtualRoute(options.virtualRoute as Record<string, unknown>) : null;
  _initPorts();
  const eventBus = _getPort('eventBus');
  if (eventBus && eventBus.emit) { eventBus.emit(ROUTER_EVENTS.NAVIGATE_REQUEST, { from: routerStore.getCurrentRoute(), to: normalizedPath, originalPath: logicalPathOrId, virtualRoute, options, source: options.source || 'navigate', timestamp: Date.now() }); }
  return Promise.resolve().then(() => {
    const resolvedRoute = RouteResolver.resolve ? RouteResolver.resolve(normalizedPath) : { path: normalizedPath };
    const currentRoute = routerStore.getCurrentRoute();

    // @ts-expect-error TS migration - TS2339
    if (currentRoute && URLParser.isSamePath && URLParser.isSamePath(currentRoute.path, resolvedRoute.path) && !options.force) {
      if (!virtualRoute) { routerStore.setNavigating(false); return createNavigationResult(true, 'same-route', null, currentRoute); }
      routerStore.setVirtualRoute(virtualRoute);
      routerStore.setNavigating(false);
      return createNavigationResult(true, 'virtual-route-updated', null, currentRoute);
    }
    return RouterHooks.execute('beforeNavigate', { from: currentRoute, to: resolvedRoute }).then((hookResult: { aborted?: boolean }) => {
      if (hookResult.aborted) { routerStore.setNavigating(false); return createNavigationResult(false, 'before-hook-blocked', 'hooks'); }
      return (Promise.resolve(RouteGuard.checkRoute ? RouteGuard.checkRoute(resolvedRoute) : { allowed: true }) as Promise<{ allowed: boolean; reason?: string; redirect?: string }>).then((guardResult: { allowed: boolean; reason?: string; redirect?: string }) => {
        if (!guardResult.allowed) {
          if (eventBus && eventBus.emit) eventBus.emit(ROUTER_EVENTS.GUARD_BLOCKED, { from: currentRoute, to: resolvedRoute, reason: guardResult.reason || 'forbidden', timestamp: Date.now() });
          if (guardResult.reason === 'unauthenticated' && normalizedPath !== '/login') routerStore.setAttemptedRoute(normalizedPath, options);
          if (guardResult.redirect) { routerStore.setNavigating(false); return navigate(routerGlobal, guardResult.redirect, { replace: true }); }
          routerStore.setNavigating(false);
          return createNavigationResult(false, guardResult.reason || 'forbidden', 'guard');
        }
        if (routerTelemetry.trackNavigation) routerTelemetry.trackNavigation(currentRoute, resolvedRoute.path);
        if (eventBus && eventBus.emit) { eventBus.emit(ROUTER_EVENTS.GUARD_PASSED, { from: currentRoute, to: resolvedRoute, virtualRoute, permissionsChecked: true, authChecked: true, timestamp: Date.now() }); }
        const routeVirtualDefaults = (resolvedRoute as any).virtualDefaults || {};
        const finalVirtualRoute = virtualRoute || createVirtualRoute(routeVirtualDefaults);
        if (options.replace) { if (HistoryManager.replace) HistoryManager.replace(resolvedRoute.path, Object.assign({}, resolvedRoute, { virtualRoute: finalVirtualRoute })); }
        else { if (HistoryManager.push) HistoryManager.push(resolvedRoute.path, Object.assign({}, resolvedRoute, { virtualRoute: finalVirtualRoute })); }
        const routeWithVirtual = Object.assign({}, resolvedRoute, finalVirtualRoute);
        routerStore.setCurrentRoute(routeWithVirtual);
        routerStore.setVirtualRoute(finalVirtualRoute);
        applyRouteEffects(resolvedRoute);
        return RouterHooks.execute('afterNavigate', { from: currentRoute, to: resolvedRoute }).then(() => {
          if (routerTelemetry.trackNavigationSuccess) routerTelemetry.trackNavigationSuccess(resolvedRoute, Date.now() - startTime);
          routerStore.setNavigating(false);
          return createNavigationResult(true, null, null, resolvedRoute);
        });
      });
    });
  }).catch(error => {
    if (routerTelemetry.trackNavigationError) routerTelemetry.trackNavigationError(normalizedPath, error);
    routerStore.setError(error);
    routerStore.setNavigating(false);
    return createNavigationResult(false, error.message, 'exception');
  });
}

export function replace(routerGlobal: Record<string, unknown>, logicalPathOrId: string, options: Record<string, unknown>) { if (!options) options = {}; return navigate(routerGlobal, logicalPathOrId, Object.assign({}, options, { replace: true })); }

export function handleRouteChange(routerGlobal: Record<string, unknown>, path: string, state: Record<string, unknown>) {
  return Promise.resolve().then(() => {
    const normalizedPath = normalizePath(path);
    const resolvedRoute = RouteResolver.resolve ? RouteResolver.resolve(normalizedPath) : { path: normalizedPath };
    return (Promise.resolve(RouteGuard.checkRoute ? RouteGuard.checkRoute(resolvedRoute) : { allowed: true }) as Promise<{ allowed: boolean; reason?: string; redirect?: string }>).then((guardResult: { allowed: boolean; reason?: string; redirect?: string }) => {
      if (!guardResult.allowed && guardResult.redirect) {
        if (guardResult.reason === 'unauthenticated' && normalizedPath !== '/login') routerStore.setAttemptedRoute(normalizedPath);
        if (HistoryManager.replace) HistoryManager.replace(guardResult.redirect);
        const redirectedRoute = RouteResolver.resolve ? RouteResolver.resolve(guardResult.redirect) : { path: guardResult.redirect };
        routerStore.setCurrentRoute(redirectedRoute);
        applyRouteEffects(redirectedRoute);
      } else {
        routerStore.setCurrentRoute(resolvedRoute);
        applyRouteEffects(resolvedRoute);
      }
    });
  }).catch(error => { if (routerTelemetry.logger && routerTelemetry.logger.error) routerTelemetry.logger.error('handleRouteChange error', { error: error.message }); });
}

export function applyRouteEffects(route: Record<string, unknown>) {
  if (!route) return;
  try {
    if (HistoryManager.updateTitle) HistoryManager.updateTitle(route.title || 'DshowDash');
    const eventBus = _getPort('eventBus');
    if (eventBus && eventBus.emit) { eventBus.emit(ROUTER_EVENTS.ROUTE_CHANGED, { route: { path: route.path, page: route.page, title: route.title, params: route.params, query: route.query, hash: route.hash, layout: route.layout }, virtualRoute: routerStore.getVirtualRoute(), timestamp: Date.now() }); }
    const layoutType = route.layout || 'default';
    const hideNav = layoutType === 'full-screen' || layoutType === 'login-only';
    if (eventBus && eventBus.emit) { eventBus.emit(ROUTER_EVENTS.LAYOUT_CHANGED, { layout: layoutType, route: route.path, hideNav, timestamp: Date.now() }); }
  } catch (error) {}
}

export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { portsInitialized: Ports.isInitialized() } }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }

export default { navigate, replace, handleRouteChange, applyRouteEffects, injectPorts, getPorts, healthCheck, info, VERSION, MODULE_ID };
