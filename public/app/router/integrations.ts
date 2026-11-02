// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.5.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: router-integrations
// PURPOSE: Router Global - Integrations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   routerStore from /components/router/state/store.js
//   routerTelemetry from /components/router/telemetry/tracker.js
//   AUTH_EVENTS from /core/runtime/events/catalog/auth.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getGlobalStateStatus() — exported function
//   getAuthEventsStatus() — exported function
//   setupGlobalStateIntegration() — exported function
//   cleanupGlobalStateIntegration() — exported function
//   setupAuthEventIntegration() — exported function
//   cleanupAuthEventIntegration() — exported function
//   retryGlobalStateIntegration() — exported function
//   retryAuthEventIntegration() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   AUTH_EVENTS.LOGIN_SUCCESS
//   AUTH_EVENTS.LOGOUT
//   AUTH_EVENTS.LOGOUT_SUCCESS
// WINDOW ACCESS:
//   (none)
// @changelog v3.5.0-P18EC: Fix syncNavigation to filter null fields and validate page as number before dispatch (GlobalState validator rejects null page)
// @changelog v3.4.0-P18EC: Fix createCorePorts -> createPanelPorts
// @changelog v3.3.0-P18EC: Previous version
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { routerStore } from '/components/router/state/store.js';
import { routerTelemetry } from '/components/router/telemetry/tracker.js';
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';

export const VERSION = '3.5.0-P18EC';
export const MODULE_ID = 'router-integrations';

interface RouterGlobalRef {
  isInitialized: boolean;
  navigate: (path: string, options?: Record<string, unknown>) => Promise<unknown>;
  [key: string]: unknown;
}

const RETRY_MAX = 5;
const RETRY_DELAY = 300;

let globalStateCleanups: Array<() => void> = [];
let authEventCleanups: Array<() => void> = [];
let globalStateRetryCount = 0;
let authEventRetryCount = 0;

const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export function getGlobalStateStatus() { return { connected: globalStateCleanups.length > 0, retryCount: globalStateRetryCount }; }
export function getAuthEventsStatus() { return { connected: authEventCleanups.length > 0, retryCount: authEventRetryCount }; }

export function setupGlobalStateIntegration() {
  if (globalStateCleanups.length > 0) return true;
  _initPorts();
  const globalState = _getPort('globalState');
  if (!globalState) {
    if (globalStateRetryCount < RETRY_MAX) { globalStateRetryCount++; setTimeout(setupGlobalStateIntegration, RETRY_DELAY * globalStateRetryCount); }
    return false;
  }
  try {
    const syncNavigation = (route: Record<string, unknown>, virtualRoute: Record<string, unknown> | null) => {
      const gs = _getPort('globalState');
      if (!gs || !route) return;
      try {
        if (gs.dispatch && gs.actions && gs.actions.updateNavigation) {
          // v3.5.0: Build navigation payload respecting GlobalState contracts
          // - Only include fields with non-null values to avoid validator rejection
          // - page must be positive number (pagination), not string (page name)
          // - currentPage is string (page identifier from route registry)
          const previousRouteObj = routerStore.getPreviousRoute();
          const payload: Record<string, any> = {
            currentRoute: route.path,
            lastNavigationAt: Date.now()
          };
          // String fields: only include if truthy string
          if (route.page && typeof route.page === 'string') payload.currentPage = route.page;
          if (previousRouteObj && previousRouteObj.path) payload.previousRoute = previousRouteObj.path;
          // activePanel: prefer virtualRoute.view, fallback to route.panel or route.defaultView
          if (virtualRoute && virtualRoute.view) payload.activePanel = virtualRoute.view;
          else if (route.panel) payload.activePanel = route.panel;
          else if (route.defaultView) payload.activePanel = route.defaultView;
          // Virtual route navigation fields: only include if defined and non-null
          if (virtualRoute) {
            if (virtualRoute.view) payload.view = virtualRoute.view;
            if (virtualRoute.tab) payload.tab = virtualRoute.tab;
            if (virtualRoute.section) payload.section = virtualRoute.section;
            if (virtualRoute.entity) payload.entity = virtualRoute.entity;
            if (virtualRoute.id) payload.entityId = virtualRoute.id;
            if (virtualRoute.mode) payload.mode = virtualRoute.mode;
            if (virtualRoute.sort) payload.sort = virtualRoute.sort;
            if (virtualRoute.filters) payload.filters = virtualRoute.filters;
            // page: only include if positive number (pagination field, not page name)
            if (typeof virtualRoute.page === 'number' && virtualRoute.page >= 1) payload.page = virtualRoute.page;
          }
          gs.dispatch(gs.actions.updateNavigation(payload));
        }
      } catch (e) {}
    };
    const unsubscribe = routerStore.subscribe(() => { const currentRoute = routerStore.getCurrentRoute(); const virtualRoute = routerStore.getVirtualRoute() as Record<string, unknown> | null; if (currentRoute) syncNavigation(currentRoute, virtualRoute); });
    if (typeof unsubscribe === 'function') globalStateCleanups.push(unsubscribe);
    if (routerTelemetry.track) routerTelemetry.track('router:globalstate:connected', { retriesNeeded: globalStateRetryCount });
    return true;
  } catch (error) { return false; }
}

export function cleanupGlobalStateIntegration() { globalStateCleanups.forEach(cleanup => { try { if (typeof cleanup === 'function') cleanup(); } catch (e) {} }); globalStateCleanups = []; globalStateRetryCount = 0; }

export function setupAuthEventIntegration(getRouterGlobal: () => RouterGlobalRef) {
  if (authEventCleanups.length > 0) return true;
  _initPorts();
  const eventBus = _getPort('eventBus');
  if (!eventBus || typeof eventBus.on !== 'function') {
    if (authEventRetryCount < RETRY_MAX) { authEventRetryCount++; setTimeout(() => { setupAuthEventIntegration(getRouterGlobal); }, RETRY_DELAY * authEventRetryCount); }
    return false;
  }
  try {
    if (AUTH_EVENTS && AUTH_EVENTS.LOGIN_SUCCESS) {
      const loginHandler = (data: Record<string, unknown> | null) => {
        try {
          // @ts-expect-error strict migration — TS2531
          const attemptedRoute = routerStore.getAttemptedRoute() ? routerStore.getAttemptedRoute().path : (data ? data.attemptedRoute : null);
          const targetRoute = (attemptedRoute && attemptedRoute !== '/login') ? attemptedRoute : '/';
          if (targetRoute) { routerStore.clearAttemptedRoute(); setTimeout(() => { try { const router = getRouterGlobal(); if (router && router.isInitialized) router.navigate(targetRoute as string, { replace: true }); } catch (e) {} }, 100); }
        } catch (e) {}
      };
      eventBus.on(AUTH_EVENTS.LOGIN_SUCCESS, loginHandler);
      authEventCleanups.push(() => { try { const eb = _getPort('eventBus'); if (eb && eb.off) eb.off(AUTH_EVENTS.LOGIN_SUCCESS, loginHandler); } catch (e) {} });
    }
    if (AUTH_EVENTS && AUTH_EVENTS.LOGOUT) {
      const logoutHandler = () => { setTimeout(() => { try { const router = getRouterGlobal(); if (router && router.isInitialized) router.navigate('/login', { replace: true }); } catch (e) {} }, 100); };
      eventBus.on(AUTH_EVENTS.LOGOUT, logoutHandler);
      authEventCleanups.push(() => { try { const eb = _getPort('eventBus'); if (eb && eb.off) eb.off(AUTH_EVENTS.LOGOUT, logoutHandler); } catch (e) {} });
      if (AUTH_EVENTS.LOGOUT_SUCCESS) { eventBus.on(AUTH_EVENTS.LOGOUT_SUCCESS, logoutHandler); authEventCleanups.push(() => { try { const eb = _getPort('eventBus'); if (eb && eb.off) eb.off(AUTH_EVENTS.LOGOUT_SUCCESS, logoutHandler); } catch (e) {} }); }
    }
    if (routerTelemetry.track) routerTelemetry.track('router:auth-events:connected', { retriesNeeded: authEventRetryCount });
    return true;
  } catch (error) { return false; }
}

export function cleanupAuthEventIntegration() { authEventCleanups.forEach(cleanup => { try { if (typeof cleanup === 'function') cleanup(); } catch (e) {} }); authEventCleanups = []; authEventRetryCount = 0; }
export function retryGlobalStateIntegration() { globalStateRetryCount = 0; globalStateCleanups = []; return setupGlobalStateIntegration(); }
export function retryAuthEventIntegration(getRouterGlobal: () => RouterGlobalRef) { authEventRetryCount = 0; authEventCleanups = []; return setupAuthEventIntegration(getRouterGlobal); }

export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { globalState: getGlobalStateStatus(), authEvents: getAuthEventsStatus(), portsInitialized: Ports.isInitialized() } }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, globalState: getGlobalStateStatus(), authEvents: getAuthEventsStatus(), portsInitialized: Ports.isInitialized() }; }

export default { setupGlobalStateIntegration, cleanupGlobalStateIntegration, setupAuthEventIntegration, cleanupAuthEventIntegration, retryGlobalStateIntegration, retryAuthEventIntegration, getGlobalStateStatus, getAuthEventsStatus, injectPorts, getPorts, healthCheck, info, VERSION, MODULE_ID };
